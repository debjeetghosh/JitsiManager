We have an server which includes jitsi meet debian installation. Now we will  add more server and install videobridge there.
So actually we will scale videobridge service. So first of all we have to configure main server for multi-videobridge server.

## Main Server configure
* Step 1: 
`vi /etc/prosody/conf.d/talk.gomeeting.org.cfg.lua`
add under `VirtualHost "talk.gomeeting.org"`
```
admins = {
    "jitsi-videobridge.talk.gomeeting.org"
}
```

* Step 2:
Edit JVB_OPTS in jvb config (`/etc/jitsi/videobridge/config`)
`JVB_OPTS="--apis=rest,xmpp"`

* Step 3:
in /etc/prosody/prosody.cfg.lua add following lines
```
component_ports = { 5347 }
component_interface = "0.0.0.0"
```

* Step 4: Edit jicofo and jvb host in config
`JICOFO_HOST=talk.gomeeting.org`
`JVB_HOST=talk.gomeeting.org`

* Step 5: Edit jvb and jicofo sip communicator (`/etc/jitsi/videobridge/sip-communicator.properties`)
```
org.jitsi.videobridge.ENABLE_STATISTICS=true
org.jitsi.videobridge.STATISTICS_TRANSPORT=muc
```
vi /etc/jitsi/jicofo/sip-communicator.properties
```
org.jitsi.focus.pubsub.ADDRESS=talk.gomeeting.org
org.jitsi.focus.pubsub.STATS_PUBSUB_NODE=sharedStatsNode
``` 
* Step 6: edit /etc/prosody/conf.d/talk.gomeeting.org.cfg.lua and add two component
```
Component "jitsi-videobridge.talk.gomeeting.org"
        component_secret = "ecirzdGK" # this will be found in /etc/jitsi/videobridge/config of main server  

 ```

## Videobridge server setup
* SSH into your server as root
* Install the Jitsi repository key:
```
wget -qO - https://download.jitsi.org/jitsi-key.gpg.key | sudo apt-key add - 
```
* Create a new repository sources file – sources.list.d – for the Jitsi repo:
```
sudo sh -c "echo 'deb https://download.jitsi.org stable/' > /etc/apt/sources.list.d/jitsi-stable.list" 
```
* Install apt-transport-https to access packages with an SSL (HTTPS) connection:
```
apt-get install apt-transport-https
```
* Update your Ubuntu server package lists:
```
sudo apt-get -y update
```
* Install videobridge only 
```
apt install -y jitsi-videobridge2
```
during installation(`talk.gomeeting.org`) add main Hostname instead of `localhost`
* Change jvb sip communicator (/etc/jitsi/videobridge/sip-communicator.properties) and add these line
```
org.jitsi.videobridge.xmpp.user.shard.HOSTNAME=talk.gomeeting.org
org.jitsi.videobridge.xmpp.user.shard.DOMAIN=auth.talk.gomeeting.org
org.jitsi.videobridge.xmpp.user.shard.USERNAME=jvb
org.jitsi.videobridge.xmpp.user.shard.PASSWORD=ecirzdGK # this will be found in /etc/jitsi/videobridge/config of main server
org.jitsi.videobridge.xmpp.user.shard.DISABLE_CERTIFICATE_VERIFICATION=true
```
* Change jvb config and change this properties
```
JVB_OPTS="--apis=rest,xmpp --subdomain=videobridge2"
JICOFO_HOST=talk.gomeeting.org
```

reload the services in main server 
 ```
 /etc/init.d/prosody restart
 /etc/init.d/jicofo restart
 /etc/init.d/jitsi-videobridge2 restart

```
and reload the videobridge in auxiliary server 
`/etc/init.d/jitsi-videobridge2 restart`