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
var proxy = toll.connect(80);

// Register the server with toll.
proxy.register(
	["api.myapp.com", "api.v2.myapp.com"], // List of hosts this server accepts.
	server.address() // The servers address (same api as connect)
);
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
var proxy = toll.createProxy().listen(80);
```

+ **toll.connect(path)**
+ **toll.connect(port, host)**
+ **toll.connect({ path, host, port, heartbeat })**
Creates a new connection to a Toll proxy at a given port.

```javascript
// Creates a proxy Connection that sends a heartbeat every 15 seconds.
// Api is the same as net.connect. (except for the return value).
var proxy = toll.connect({
	port: 80,
	host: "localhost".
	heartbeat: 15000
});
```

### The Following api works the same for both the proxy server and the connected hosts.

+ **proxy.register(hosts, path)**
+ **proxy.register(hosts, port, host)**
+ **proxy.register(hosts, { path, host, port }) -> Promise**
Registers hosts with a Toll proxy.

```javascript
// Registers arguments are flexable like `toll.connect` but must start with a host(s).
proxy.register("a.b.com", server.address());
proxy.register(["api.a.b.com", "test.a.b.com"], 3002, "127.0.0.1");
```

+ **proxy.remove(hosts) -> Promise**
Unregisters a hosts with a Toll proxy.

```javascript
proxy.remove("a.b.com");
proxy.remove(["api.a.b.com", "test.a.b.com"]);
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

* Use `npm test` to run tests.

Please feel free to create a PR!
