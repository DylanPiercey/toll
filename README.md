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

// Register the server with toll.
toll.register(server, {
	proxy: "localhost:80",
	hosts: ["api.myapp.com", "api.v2.myapp.com"]
});
```

## Starting a Toll server.
```javascript
var toll = require("toll");
var server = toll.createProxy();

// This server will automatically listen for new Toll registrations and proxy by hostname.
server.listen(80);
```

# API
+ **register(server, opts)** : Registers a node server with a Toll proxy server.


```javascript
// Registered server must be listening and have an "address" function.
// Note that a registered server will be dropped if Toll can't connect to it until it sends another heartbeat.
toll.register(server, {
	proxy: ..., // A string url pointing to the toll proxy or an object with { host, port }.
	hosts: ..., // Array of hostnames that this specific server will accept from the Toll proxy.
	heartbeat: 15000 // How often (in ms) to notify the toll server that this server is still alive.
})
```

+ **createProxy()** : Creates a Toll proxy server.


```javascript
// Creates a net.Server which which will automatically proxy registered toll services.
toll.createProxy().listen(80);
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
