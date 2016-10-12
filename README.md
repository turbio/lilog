# Lilog
[![Build Status](https://travis-ci.org/turbio/lilog.svg?branch=master)](https://travis-ci.org/turbio/lilog)  
live browser based http access log visualizer running on nodejs.

![bracey logo](readme_media/island.gif)
## installation
lilog runs on [nodejs](http://nodejs.org/) and needs [npm](https://npmjs.com) to install packages

1. clone this repository `git clone https://github.com/turbio/lilog.git`
2. change into repository directory `cd lilog`
3. install packages `npm install` (might take a while)
4. run preprocessors `npm run build`

should be ready to go...
you can start it by running `node index.js`

## usage

```
usage: [OPTIONS] <logfile> 
--formats      list all supported log formats
--format -f	   log format (default: clf)
--port -p      http port (default: 3000)
```

currently, `clf` is the only supported log format.
(luckily it's what many servers use by default).  
You could also implement your own log parser for another format.
Check out the `/log_parser/` directory to see the clf parser as an example.

### example
this is what you would use to start lilog on port `8080` for the respective server's default configuration

* apache:
  `node index.js -p 8080 -f clf /var/log/httpd/access_log`
* nginx:
  `node index.js -p 8080 -f clf /var/log/nginx/access.log`
