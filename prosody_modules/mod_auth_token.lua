-- Token authentication
-- Copyright (C) 2015 Atlassian

local formdecode = require "util.http".formdecode;
local generate_uuid = require "util.uuid".generate;
local new_sasl = require "util.sasl".new;
local sasl = require "util.sasl";
local token_util = module:require "token/util".new(module);
local sessions = prosody.full_sessions;
local DBI = require "DBI"
local connection;
local params = module:get_option("auth_sql", module:get_option("sql"));

-- no token configuration
if token_util == nil then
    return;
end

-- define auth provider
local provider = {};

local host = module.host;

-- Extract 'token' param from URL when session is created
function init_session(event)
	local session, request = event.session, event.request;
	local query = request.url.query;
    local room = event.room;
    log("info", "init_session, room: %s", room);

	if query ~= nil then
        local params = formdecode(query);
        session.auth_token = query and params.token or nil;
        -- previd is used together with https://modules.prosody.im/mod_smacks.html
        -- the param is used to find resumed session and re-use anonymous(random) user id
        -- (see get_username_from_token)
        session.previd = query and params.previd or nil;

        -- The room name and optional prefix from the bosh query
        session.jitsi_bosh_query_room = params.room;
        session.jitsi_bosh_query_prefix = params.prefix or "";
    end
end

module:hook_global("bosh-session", init_session);
module:hook("websocket-session", init_session);

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
local function verify_user_room(user_id, room)
    local db_room = tonumber(room)
    local db_user_id = tonumber(user_id)
    log("info","verifying user: room: %s, usr: %s", room, user_id)
    local room_stmt, room_err = getsql("SELECT id, name, created_by_id, room_type from room_room where id=?", db_room);
    if room_stmt then
        for row in room_stmt:rows(true) do
            log("info: row.id: %s, room: %s", row.id, db_room)
            if( row.id == db_room )then
                log("info", "row.id = room")
                if(row.room_type == "public")then
                    log("info", "room=public")
                    return row.name;
                end
                break;
            end
        end
    end
	return nil;
end

function provider.test_password(username, password)
	return nil, "Password based auth not supported";
end

function provider.get_password(username)
	return nil;
end

function provider.set_password(username, password)
	return nil, "Set password not supported";
end

function provider.user_exists(username)
	log("info", "user %s", username)
	return nil;
end

function provider.create_user(username, password)
	return nil;
end

function provider.delete_user(username)
	return nil;
end

function provider.get_sasl_handler(session)
	local function get_username_from_token(self, message)
        local res, error, reason = token_util:process_and_verify_token(session);
	log("info", "result: %s",res)
    log("info", "message: %s",message)
        if (res == false) then
            log("warn",
                "Error verifying token err:%s, reason:%s", error, reason);
            return nil, error, reason;
        end

	log("info","session: room: %s, usr: %s", session.jitsi_bosh_query_room, session.jitsi_meet_context_user.p_id)
	local verify_room = verify_user_room(session.jitsi_meet_context_user.p_id,  session.jitsi_meet_context_room_info.id)
    log("info", "verified_room: %s", verify_room)
	if (verify_room == nil) then
		return false, "Invalid-user-for-room";
	end
        local customUsername
            = session.jitsi_meet_context_user.id;

        if (customUsername) then
            self.username = customUsername;
        elseif (session.previd ~= nil) then
            for _, session1 in pairs(sessions) do
                if (session1.resumption_token == session.previd) then
                    self.username = session1.username;
                    break;
                end
        	end
        else
            self.username = message;
        end

        return customUsername;
	end

	return new_sasl(host, { anonymous = get_username_from_token });
end

module:provides("auth", provider);

local function anonymous(self, message)

	-- local username = generate_uuid();

	-- This calls the handler created in 'provider.get_sasl_handler(session)'
	local result, err, msg = self.profile.anonymous(self, nil, self.realm);

	if result ~= nil then
		if (self.username == nil) then
			self.username = result;
		end
		return "success";
	else
		return "failure", err, msg;
	end
end

sasl.registerMechanism("ANONYMOUS", {"anonymous"}, anonymous);