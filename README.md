[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Join the chat at https://gitter.im/DylanPiercey/toll](https://badges.gitter.im/DylanPiercey/toll.svg)](https://gitter.im/DylanPiercey/toll?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


# Toll

Utility to manage dynamic micro-services by proxying hostnames to other node servers.

# Why

* Sometimes you are stuck in an environment without something like NGINX.
* Services may be too sporadic to properly configure.
* You like node js.

# Installation

#### Npm
```console
npm install toll
```

## Registering a Toll service.
```javascript
var toll = require("toll");

// Start up a server at an arbitrary port.
var server = require("http").createServer(...).listen();

// Connect to Toll proxy.
var proxy = toll.connect("localhost:80");

// Register the server with toll.
proxy.register(server, ["api.myapp.com", "api.v2.myapp.com"]);
```

## Starting a Toll server.
```javascript
var toll = require("toll");
var server = toll.createProxy();

// This server will automatically listen for new Toll registrations and proxy by hostname.
server.listen(80);
```

# API
+ **toll.createProxy()** : Creates a Toll proxy server.

```javascript
// Creates a net.Server which which will automatically proxy registered toll services.
toll.createProxy().listen(80);
```

+ **toll.connect(url, [opts])**
+ **toll.connect({ host, port }, [opts])**
Creates a new connection to a Toll proxy at a given port.

```javascript
// Creates a proxy Connection that sends a heartbeat every 15 seconds.
var proxy = toll.connect("localhost:80", { heartbeat: 15000 });
```

+ **proxy.register(server, [hosts...])** : Registers a server with a Toll proxy.

```javascript
// Registered server must be listening and have an "address" function.
// Note that a registered server will be dropped if Toll can't connect to it until it sends another heartbeat.
proxy.register(server, "a.b.com");
proxy.register(server, ["api.a.b.com", "test.a.b.com"]);
```


# CLI

Start a Toll Proxy server from the cli.

```terminal
npm install toll -g

toll <port> [ip]
toll 80 127.0.0.1
```

---

### Contributions

* Use gulp to run tests.

Please feel free to create a PR!
