local formdecode = require "util.http".formdecode;
local generate_uuid = require "util.uuid".generate;
local new_sasl = require "util.sasl".new;
local sasl = require "util.sasl";
local token_util = module:require "token/util".new(module);
local sessions = prosody.full_sessions;
local DBI = require "DBI"
local connection;
local params = module:get_option("auth_sql", module:get_option("sql"));
local log = module._log;
local json = require "cjson";
local basexx = require "basexx";
local jid_bare = require "util.jid".bare;

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

module:hook("muc-room-created", function(event)
        log('info', 'room created, adding token moderation code');
        local room = event.room;
        local _handle_normal_presence = room.handle_normal_presence;
        local _handle_first_presence = room.handle_first_presence;
        -- Wrap presence handlers to set affiliations from token whenever a user joins
        room.handle_normal_presence = function(thisRoom, origin, stanza)
                local pres = _handle_normal_presence(thisRoom, origin, stanza);
                setupAffiliation(thisRoom, origin, stanza);
                return pres;
        end;
        room.handle_first_presence = function(thisRoom, origin, stanza)
                local pres = _handle_first_presence(thisRoom, origin, stanza);
                setupAffiliation(thisRoom, origin, stanza);
                return pres;
        end;
        -- Wrap set affilaition to block anything but token setting owner (stop pesky auto-ownering)
        local _set_affiliation = room.set_affiliation;
        room.set_affiliation = function(room, actor, jid, affiliation, reason)
                -- let this plugin do whatever it wants
                if actor == "token_plugin" then
                        return _set_affiliation(room, true, jid, affiliation, reason)
                -- noone else can assign owner (in order to block prosody/jisti's built in moderation functionality
                elseif affiliation == "owner" then
                        return nil, "modify", "not-acceptable"
                -- keep other affil stuff working as normal (hopefully, haven't needed to use/test any of it)
                else
                        return _set_affiliation(room, actor, jid, affiliation, reason);
                end;
        end;
end, 8808);

local function is_creator(user_id, room_id)
    local stmt, err = getsql("SELECT id, created_by_id, name from room_room where created_by_id=? and id=?", user_id, room_id)
    if stmt then
        for row in stmt:rows(true) do
            if(row.id == tonumber(room_id)) then
                log("info", "creator: user: %s, room: %s", user_id, room_id);
                return "true";
            end
        end

    end
    return nil;
end


function setupAffiliation(room, origin, stanza)
        if origin.auth_token then
                -- Extract token body and decode it
                local dotFirst = origin.auth_token:find("%.");
                if dotFirst then
                        local dotSecond = origin.auth_token:sub(dotFirst + 1):find("%.");
                        if dotSecond then
                            local bodyB64 = origin.auth_token:sub(dotFirst + 1, dotFirst + dotSecond - 1);
                            local body = json.decode(basexx.from_url64(bodyB64));
                            -- If user is a moderator, set their affiliation to be an owner
                            local room_id = body["context"]["room_info"]["id"]
                            local user_id = body["context"]["user"]["p_id"]
                            log("info", "jid_bare:%s", jid_bare(stanza.attr.from))
                            if is_creator(user_id, room_id) ~= nil then
                                    room:set_affiliation("token_plugin", jid_bare(stanza.attr.from), "owner");
                            else
                                    room:set_affiliation("token_plugin", jid_bare(stanza.attr.from), "member");
                            end;
            end;
        end;
    end;
end;

