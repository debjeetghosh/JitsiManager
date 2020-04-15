-- MUC Max Occupants
-- Configuring muc_max_occupants will set a limit of the maximum number
-- of participants that will be able to join in a room.
-- Participants in muc_access_whitelist will not be counted for the
-- max occupants value (values are jids like recorder@jitsi.meeet.example.com).
-- This module is configured under the muc component that is used for jitsi-meet
local split_jid = require "util.jid".split;
local st = require "util.stanza";
local it = require "util.iterators";
local DBI = require "DBI"
local connection;
local params = module:get_option("auth_sql", module:get_option("sql"));



local function count_keys(t)
  return it.count(it.keys(t));
end

local function test_connection()
        if not connection then return nil; end
        if connection:ping() then
                return true;
        else
                module:log("debug", "Database connection closed");
                connection = nil;
        end
end

local function connect()
        if not test_connection() then
                prosody.unlock_globals();
                local dbh, err = DBI.Connect(
                        params.driver, params.database,
                        params.username, params.password,
                        params.host, params.port
                );
                prosody.lock_globals();
                if not dbh then
                        module:log("debug", "Database connection failed: %s", tostring(err));
                        return nil, err;
                end
                module:log("debug", "Successfully connected to database");
                dbh:autocommit(true); -- don't run in transaction
                connection = dbh;
                return connection;
        end
end
do -- process options to get a db connection
        params = params or { driver = "SQLite3" };

        if params.driver == "SQLite3" then
                params.database = resolve_relative_path(prosody.paths.data or ".", params.database or "prosody.sqlite");
        end

        assert(params.driver and params.database, "Both the SQL driver and the database need to be specified");

        assert(connect());
end

local function getsql(sql, ...)
        if params.driver == "PostgreSQL" then
                sql = sql:gsub("`", "\"");
        end
        if not test_connection() then connect(); end
        -- do prepared statement stuff
        local stmt, err = connection:prepare(sql);
        if not stmt and not test_connection() then error("connection failed"); end
        if not stmt then module:log("error", "QUERY FAILED: %s %s", err, debug.traceback()); return nil, err; end
        -- run query
        local ok, err = stmt:execute(...);
        if not ok and not test_connection() then error("connection failed"); end
        if not ok then return nil, err; end

        return stmt;
end

local function get_max_count(room_id)
    module:log("warn","check_for_max_occupants: room: %s", room_id);
    local room_stmt, room_err = getsql("SELECT id, room_id, max_number_of_user from room_room where room_id=?", room_id);
    if room_stmt then
        for row in room_stmt:rows(true) do
            if( row.room_id == room_id )then
                return row.max_number_of_user
            end
        end
    end
    return -1
end

local function check_for_max_occupants(event)
    log('info', 'muc-occupant-pre-join adding module');
  local room, origin, stanza = event.room, event.origin, event.stanza;
    local event_params = parse(event.request.url.query);
	local room_name = params["room"];
    module:log("info", "param room name %s", room_name);
    local MAX_OCCUPANTS=get_max_count(room);
    module:log("warn","MAX_OCCUPANTS: %s", MAX_OCCUPANTS);

  local actor = stanza.attr.from;
  local user, domain, res = split_jid(stanza.attr.from);

  --no user object means no way to check for max occupants
  if user == nil then
    return
  end
  -- If we're a whitelisted user joining the room, don't bother checking the max
  -- occupants.


	if room and not room._jid_nick[stanza.attr.from] then
		local count = count_keys(room._occupants);
		local slots = MAX_OCCUPANTS;

		-- If there is no whitelist, just check the count.

		-- TODO: Are Prosody hooks atomic, or is this a race condition?
		-- For each person in the room that's not on the whitelist, subtract one
		-- from the count.
        if MAX_OCCUPANTS < 0 then
            return
        end

		for _, occupant in room:each_occupant() do
			user, domain, res = split_jid(occupant.bare_jid);
            slots = slots - 1
		end

		-- If the room is full (<0 slots left), error out.
		if slots <= 0 then
			module:log("info", "Attempt to enter a maxed out MUC");
			origin.send(st.error_reply(stanza, "cancel", "service-unavailable"));
			return true;
		end
	end
end

module:hook("muc-occupant-pre-join", check_for_max_occupants, 8808);