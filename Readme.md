## Install prerequisits
#### Step 1:   install postgres and create database
Install postgres firstly.
```shell
sudo apt update
sudo apt install postgresql postgresql-contrib
```
Create database and user
```
sudo su postgres
psql
```
```postgresql
create database jitsi_manager_db;
create user jitsi_user with password 'jitsi_password';
grant ALL on DATABASE jitsi_manager_db to jitsi_user;
```
#### Step 2:  install nginx 
```shell
sudo apt update
sudo apt install nginx
```

#### Step 3: install Jitsi meet
```shell
cd
wget -qO - https://download.jitsi.org/jitsi-key.gpg.key | sudo apt-key add -
sudo sh -c "echo 'deb https://download.jitsi.org stable/' > /etc/apt/sources.list.d/jitsi-stable.list"
sudo apt update -y
sudo apt install -y jitsi-meet
```
During the installation, when you are asked to provide the hostname of the current installation, type in the Domain `talk.gomeeting.org` you setup earlier and then press `ENTER`.

#### Step 4: Check firewall configuration
please check your firewall status by
```shell
sudo ufw status
```
if it is showing `Status: inactive` it is ok for you. Else you should allow some ports for jitsi meet.
```shell
sudo ufw allow OpenSSH
sudo ufw allow http
sudo ufw allow https
sudo ufw allow in 10000:20000/udp
sudo ufw allow 8000
sudo ufw enable
```
#### Step 5: Configure Prosody and install modules
* **Step 5.1:** firsly download and prosody-trunk_1nightly and jitsi-meet-token
```shell
wget https://packages.prosody.im/debian/pool/main/p/prosody-trunk/prosody-trunk_1nightly747-1~xenial_amd64.deb
sudo dpkg -i prosody-trunk_1nightly747-1~xenial_amd64.deb
sudo apt-get install jitsi-meet-tokens
```
* **Step 5.2:** install luarocks and lua plugins
```shell
apt install luarocks
luarocks install luadbi
sudo apt-get install libpq-dev
luarocks install luadbi-postgresql POSTGRES_INCDIR=/usr/include/postgresql
apt-get install libssl1.0-dev
luarocks install basexx
luarocks install luajwtjitsi
```
* **Step 5.3:** change prosody configuratio
Make sure your base prosody configuration (`/etc/prosody/prosody.cfg.lua`) is like this
```lua

admins = { }


https_ports = { }
modules_enabled = {

	-- Generally required
		"roster"; -- Allow users to have a roster. Recommended ;)
		"saslauth"; -- Authentication for clients and servers. Recommended if you want to log in.
		"tls"; -- Add support for secure TLS on c2s/s2s connections
		"dialback"; -- s2s dialback support
		"disco"; -- Service discovery

	-- Not essential, but recommended
		"private"; -- Private XML storage (for room bookmarks, etc.)
		"vcard"; -- Allow users to set vCards

	-- These are commented by default as they have a performance impact
		--"blocklist"; -- Allow users to block communications with other users
		--"compression"; -- Stream compression (requires the lua-zlib package installed)

	-- Nice to have
		"version"; -- Replies to server version requests
		"uptime"; -- Report how long server has been running
		"time"; -- Let others know the time here on this server
		"ping"; -- Replies to XMPP pings with pongs
		"pep"; -- Enables users to publish their mood, activity, playing music and more
		"register"; -- Allow users to register on this server using a client and change passwords

	-- Admin interfaces
		"admin_adhoc"; -- Allows administration via an XMPP client that supports ad-hoc commands
		--"admin_telnet"; -- Opens telnet console interface on localhost port 5582

	-- HTTP modules
		"bosh"; -- Enable BOSH clients, aka "Jabber over HTTP"
		--"http_files"; -- Serve static files from a directory over HTTP

	-- Other specific functionality
		--"groups"; -- Shared roster support
		--"announce"; -- Send announcement to all online users
		--"welcome"; -- Welcome users who register accounts
		--"watchregistrations"; -- Alert admins of registrations
		--"motd"; -- Send a message to users when they log in
		--"legacyauth"; -- Legacy authentication. Only used by some old clients and bots.
}

modules_disabled = {
	-- "offline"; -- Store offline messages
	-- "c2s"; -- Handle client connections
	-- "s2s"; -- Handle server-to-server connections
	-- "posix"; -- POSIX functionality, sends server to background, enables syslog, etc.
}

allow_registration = false

--ssl = {
--	key = "/etc/prosody/certs/auth.talk.gomeeting.org.key";
--	certificate = "/etc/prosody/certs/auth.talk.gomeeting.or.crt";
--}

--c2s_require_encryption = true


s2s_secure_auth = false
--consider_bosh_secure=true

--s2s_insecure_domains = { "gmail.com" }


--s2s_secure_domains = { "jabber.org" }

pidfile = "/var/run/prosody/prosody.pid"


authentication = "internal_plain"


--storage = "sql" -- Default is "internal"

-- For the "sql" backend, you can uncomment *one* of the below to configure:
--sql = { driver = "SQLite3", database = "prosody.sqlite" } -- Default. 'database' is the filename.
--sql = { driver = "MySQL", database = "prosody", username = "prosody", password = "secret", host = "localhost" }
sql = { driver = "PostgreSQL", database = "jitsi_manager_db", username = "jitsi_user", password = "jitsi_password", host = "localhost" }

-- Logging configuration
-- For advanced logging see https://prosody.im/doc/logging
log = {
	info = "/var/log/prosody/prosody.log"; -- Change 'info' to 'debug' for verbose logging
	error = "/var/log/prosody/prosody.err";
	"*syslog";
}

component_ports = { 5347 }
component_interface = "0.0.0.0"

Include "conf.d/*.cfg.lua"
```
and your site prosody configuration (`/etc/prosody/conf.d/talk.gomeeting.org.cfg.lua`)

```lua
plugin_paths = { "/usr/share/jitsi-meet/prosody-plugins/" }

-- domain mapper options, must at least have domain base set to use the mapper
muc_mapper_domain_base = "talk.gomeeting.org";

turncredentials_secret = "Z9xyMNNZjcK1grV7";
asap_accepted_issuers = {"jitsi","my_app_client"}
asap_accepted_audiences = {"jitsi","my_server1"}
turncredentials = {
  { type = "stun", host = "talk.gomeeting.org", port = "4446" },
  { type = "turn", host = "talk.gomeeting.org", port = "4446", transport = "udp" },
  { type = "turns", host = "talk.gomeeting.org", port = "443", transport = "tcp" }
};

cross_domain_bosh = false;
consider_bosh_secure = true;
c2s_require_encryption=false
VirtualHost "talk.gomeeting.org"
        -- enabled = false -- Remove this line to enable this host
        authentication = "token";
        -- Properties below are modified by jitsi-meet-tokens package config
        -- and authentication above is switched to "token"
        app_id="example_app_id";
        app_secret="example_app_secret";
	allow_empty_token = false;
        -- Assign this host a certificate for TLS, otherwise it would use the one
        -- set in the global section (if any).
        -- Note that old-style SSL on port 5223 only supports one certificate, and will always
        -- use the global one.
        ssl = {
                key = "/etc/prosody/certs/talk.gomeeting.org.key";
                certificate = "/etc/prosody/certs/talk.gomeeting.org.crt";
        }
        --speakerstats_component = "speakerstats.talk.gomeeting.org"
        --conference_duration_component = "conferenceduration.talk.gomeeting.org"
        -- we need bosh
        modules_enabled = {
            "bosh";
            "pubsub";
            "ping"; -- Enable mod_ping
            --"speakerstats";
            "turncredentials";
            --"conference_duration";
	    "presence_identity";
        }
        c2s_require_encryption = false

Component "conference.talk.gomeeting.org" "muc"
    storage = "null"
    muc_max_occupants = 1
    modules_enabled = {
        "muc_meeting_id";
	"muc_custom_max_occupants";
        --"muc_domain_mapper";
        "token_verification";
	"moderation_custom";
	 --"muc_max_occupants";
    }
    admins = { "focus@auth.talk.gomeeting.org" }
    muc_room_locking = false
    muc_room_default_public_jids = true
    muc_room_cache_size = 10
Component "jitsi-videobridge.talk.gomeeting.org"
        component_secret = "ecirzdGK"
-- internal muc component
Component "internal.auth.talk.gomeeting.org" "muc"
    storage = "null"
    modules_enabled = {
      "ping";
    }
    admins = { "focus@auth.talk.gomeeting.org", "jvb@auth.talk.gomeeting.org" }
    muc_room_locking = false
    muc_room_default_public_jids = true
    muc_room_cache_size = 1000


VirtualHost "auth.talk.gomeeting.org"
    ssl = {
        key = "/etc/prosody/certs/auth.talk.gomeeting.org.key";
        certificate = "/etc/prosody/certs/auth.talk.gomeeting.org.crt";
    }
    authentication = "internal_plain"

Component "focus.talk.gomeeting.org"
    component_secret = "vbJrSIoU"

Component "speakerstats.talk.gomeeting.org" "speakerstats_component"
    muc_component = "conference.talk.gomeeting.org"

Component "conferenceduration.talk.gomeeting.org" "conference_duration_component"
    muc_component = "conference.talk.gomeeting.org"


VirtualHost "recorder.talk.gomeeting.org"
  modules_enabled = {
    "ping";
  }
  authentication = "internal_plain"

Component "callcontrol.talk.gomeeting.org"
    component_secret = "CTnUzFWg"
```  


#### Step 6: Install django project

* firstly install `virtualenv` with the help of `pip3`
```shell
sudo apt install python3-pip
sudo pip3 install --upgrade virtualenv
```
* download project from github
```shell
git clone https://github.com/debjeetghosh/JitsiManager
```
* Now make a virtualenv in the project root and activate it
```shell
cd JitsiManager
virtualenv venv -p python3
source venv/bin/activate
```
* Now install the requirements
```shell
pip install -r requirements.txt
```

* Now replace the username, password and name (database name) in `DATABASES` in `jitsi_helper/local.py` and make sure configuration looks like this
```python
from .settings import *
DATABASES = {
    "default": {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'jitsi_manager_db',
        'USER': 'jitsi_user',
        'PASSWORD': 'jitsi_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
SITE_URL = "https://talk.gomeeting.org:8000"

```

* run the project in screen 
```shell
screen -S manager
source venv/bin/activate
python manage.py migrate
python manage.py runserver 8081
```
* and press **ctrl+a+d** to detach the screen
#### Step 7: Create a super user for first time
* Go to django project and activate virtualenv
```shell
cd
cd JitsiManager
source venv/bin/activate
python manage.py createsuperuser
```
After that you will be prompted to give `Username`, `Email` and `Password` which will be your login username and password

#### Step 8: install letsencrypt for ssl certificate (`https`)
```
sudo add-apt-repository ppa:certbot/certbot
sudo apt install python-certbot-nginx
sudo certbot --nginx -d talk.gomeeting.org
```
You will be prompted to give you an email, just give any email and give `Y` and `A` as options further
You will be shown that 
```
Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/talk.gomeeting.org/fullchain.pem
``` 
You should see the link `/etc/letsencrypt/live/talk.gomeeting.org/fullchain.pem` and update the nginx config with that link



#### Step 9: Configure nginx
make a new configuration for your domain (`talk.gomeeting.org`)
```shell
vi /etc/nginx/sites-enabled/talk.gomeeting.org.conf
```
and copy following configuration and paste in that `talk.gomeeting.org.conf`
```editorconfig
server {
    listen 8000 ssl;
    ssl_certificate /etc/letsencrypt/live/talk.gomeeting.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/talk.gomeeting.org/privkey.pem;

    location / {
	proxy_pass http://localhost:8081;
    }
}
server {
    listen 80;
    listen [::]:80;
    server_name talk.gomeeting.org;

    location ^~ /.well-known/acme-challenge/ {
       default_type "text/plain";
       root         /usr/share/jitsi-meet;
    }
    location = /.well-known/acme-challenge/ {
       return 404;
    }
    location / {
       return 301 https://$host$request_uri;
    }
}
server {
    listen 4444 ssl http2;
    listen [::]:4444 ssl http2;
    server_name talk.gomeeting.org;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+ECDSA+AESGCM:EECDH+aRSA+AESGCM:EECDH+ECDSA+SHA256:EECDH+aRSA+SHA256:EECDH+ECDSA+SHA384:EECDH+ECDSA+SHA256:EECDH+aRSA+SHA384:EDH+aRSA+AESGCM:EDH+aRSA+SHA256:EDH+aRSA:EECDH:!aNULL:!eNULL:!MEDIUM:!LOW:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS:!RC4:!SEED";

    add_header Strict-Transport-Security "max-age=31536000";

    ssl_certificate /etc/letsencrypt/live/talk.gomeeting.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/talk.gomeeting.org/privkey.pem;

    root /usr/share/jitsi-meet;

    # ssi on with javascript for multidomain variables in config.js
    ssi on;
    ssi_types application/x-javascript application/javascript;

    index index.html index.htm;
    error_page 404 /static/404.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_vary on;

    location = /config.js {
        alias /etc/jitsi/meet/talk.gomeeting.org-config.js;
    }

    location = /external_api.js {
        alias /usr/share/jitsi-meet/libs/external_api.min.js;
    }

    #ensure all static content can always be found first
    location ~ ^/(libs|css|static|images|fonts|lang|sounds|connection_optimization|.well-known)/(.*)$
    {
        add_header 'Access-Control-Allow-Origin' '*';
        alias /usr/share/jitsi-meet/$1/$2;
    }

    # BOSH
    location = /http-bind {
        proxy_pass      http://localhost:5280/http-bind;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }

    # xmpp websockets
    location = /xmpp-websocket {
        proxy_pass http://127.0.0.1:5280/xmpp-websocket?prefix=$prefix&$args;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;
        tcp_nodelay on;
    }
    location ^~ /etherpad/ {
        proxy_pass http://localhost:9001/;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_buffering off;
        proxy_set_header       Host $host;
    }

    location ~ ^/([^/?&:'"]+)$ {
        try_files $uri @root_path;
    }

    location @root_path {
        rewrite ^/(.*)$ / break;
    }

    location ~ ^/([^/?&:'"]+)/config.js$
    {
       set $subdomain "$1.";
       set $subdir "$1/";

       alias /etc/jitsi/meet/talk.gomeeting.org-config.js;
    }

    #Anything that didn't match above, and isn't a real file, assume it's a room name and redirect to /
    location ~ ^/([^/?&:'"]+)/(.*)$ {
        set $subdomain "$1.";
        set $subdir "$1/";
        rewrite ^/([^/?&:'"]+)/(.*)$ /$2;
    }

    # BOSH for subdomains
    location ~ ^/([^/?&:'"]+)/http-bind {
        set $subdomain "$1.";
        set $subdir "$1/";
        set $prefix "$1";

        rewrite ^/(.*)$ /http-bind;
    }

    # websockets for subdomains
    location ~ ^/([^/?&:'"]+)/xmpp-websocket {
        set $subdomain "$1.";
        set $subdir "$1/";
        set $prefix "$1";

        rewrite ^/(.*)$ /xmpp-websocket;
    }
}
```

#### Step 8: Copy custom prosody modules
```shell
cp prosody_modules/mod_muc_custom_max_occupants.lua /usr/share/jitsi-meet/prosody-plugins/
cp prosody_modules/mod_auth_token.lua /usr/share/jitsi-meet/prosody-plugins/
cp prosody_modules/mod_moderation_custom.lua /usr/share/jitsi-meet/prosody-plugins/
cp prosody_modules/token/util.lib.lua /usr/share/jitsi-meet/prosody-plugins/token/
``` 
Lastly restart your prosody and nginx
```shell
sudo service prosody restart
sudo service nginx restart
```



