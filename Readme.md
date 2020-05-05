## Install This project
* firstly install `virtualenv` with the help of `pip3`
```
sudo apt install python3-pip
sudo pip3 install --upgrade virtualenv
```
* Now make a virtualenv in the project root and activate it
```
virtualenv venv -p python3
source venv/bin/activate
```
* Now install the requirements
```
pip install -r requirements.txt
```

* Now replace the username, password and name (database name) in `DATABASES` in `settings.py`
* run the project in screen 
```
screen -S manager
source venv/bin/activate
python manage.py migrate
python manage.py runserver
```
* and press ctrl+a+d to detach the screen

# Configure Prosody and install modules
* firsly download and prosody-trunk_1nightly and jitsi-meet-token
```
wget https://packages.prosody.im/debian/pool/main/p/prosody-trunk/prosody-trunk_1nightly747-1~xenial_amd64.deb
sudo dpkg -i prosody-trunk_1nightly747-1~xenial_amd64.deb
sudo apt-get install jitsi-meet-tokens
``` 
Also check if client to server encryption is not enforced. Otherwise token authentication won't work:
```
c2s_require_encryption=false
```

* copy the modules to prosody modules directory 
```
cp prosody_modules/mod_muc_custom_max_occupants.lua /usr/share/jitsi-meet/prosody-plugins/
cp prosody_modules/mod_auth_token.lua /usr/share/jitsi-meet/prosody-plugins/
cp prosody_modules/mod_moderation_custom.lua /usr/share/jitsi-meet/prosody-plugins/
cp prosody_modules/token/util.lib.lua /usr/share/jitsi-meet/prosody-plugins/token/
```
* configure token authentication, add issuer and audiences
    - Add this lines prosody cofig (`your_domain_name.cfg.lua`)
    ```
    asap_accepted_issuers = { "jitsi", "my_app_client" }
    asap_accepted_audiences = { "jitsi", "my_server1" }
    ```
    - under `VirtualHost "talk.gomeeting.org"` please change the `authentication` to `token`
    - add `app_id`, `app_secret` 
    ```
    app_id="example_app_id";
    app_secret="example_app_secret"
    allow_empty_token = false
    ```
    
    - under `modules_enabled` of ` VirtualHost "talk.gomeeting.org"` make sure `bosh` and `presence_identity` are enabled
    - under `Component "conference.talk.gomeeting.org"` `storage="null"` and under `modules_enabled` => `"muc_custom_max_occupants"`, `"moderation_custom"` are enabled
    
    
* Make sure the `bosh` module is enabled in prosody.cfg.lua and database username, password and database name are same as this project

* Make sure this line is appended in prosody.cfg.lua
```
Include "conf.d/*.cfg.lua"
```

* then 
```
wget https://raw.githubusercontent.com/bjc/prosody/master/plugins/mod_posix.lua
mv mod_posix.lua /usr/lib/prosody/modules
```

* install luarocks and lua plugins
```
apt install luarocks
luarocks install luadbi
sudo apt-get install libpq-dev
luarocks install luadbi-postgresql POSTGRES_INCDIR=/usr/include/postgresql
apt-get install libssl1.0-dev
luarocks install basexx
luarocks install luajwtjitsi
```

