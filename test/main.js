var fs          = require("fs");
var test        = require("tape");
var http        = require("http");
var https       = require("https");
var request     = require("supertest");
var toll        = require("../");
var createProxy = toll.createProxy;
var register    = toll.register;

test("proxy http", function (t) {
	t.plan(3);

	// Start up an example http server.
	var server = http.createServer(function (req, res) {
		res.end("HTTP-Server");
	}).listen();

	// Start the proxy.
	var proxy = createProxy().listen();

	// Register the example server.
	register(server, {
		proxy: proxy.address(),
		hosts: ["localhost"]
	});

	// Valid host proxy
	request("http://localhost:" + proxy.address().port)
		.get("/")
		.end(function (err, res) {
			if (err) t.fail(err);
			t.equals(res.text, "HTTP-Server", "server should respond");
		});

	// Invalid host proxy.
	request("http://127.0.0.1:" + proxy.address().port)
		.get("/")
		.end(function (err, res) {
			t.ok(err, "error should exist");
			t.equals(err.code, "ECONNRESET", "connection should fail");
		});
});


test("proxy https", function (t) {
	t.plan(3);

	// Allow self signed certs.
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	// Start up an example http server.
	var options = {
		key: fs.readFileSync(__dirname + "/cert/privkey.pem"),
		cert: fs.readFileSync(__dirname + "/cert/cert.pem")
	};
	var server = https.createServer(options, function (req, res) {
		res.end("HTTPS-Server");
	}).listen();

	// Start the proxy.
	var proxy = createProxy().listen();

	// Register the example server.
	register(server, {
		proxy: proxy.address(),
		hosts: ["localhost"]
	});

	// Valid host proxy
	request("https://localhost:" + proxy.address().port)
		.get("/")
		.end(function (err, res) {
			if (err) t.fail(err);
			t.equals(res.text, "HTTPS-Server", "server should respond");
		});

	// Invalid host proxy.
	request("https://127.0.0.1:" + proxy.address().port)
		.get("/")
		.end(function (err, res) {
			t.ok(err, "error should exist");
			t.equals(err.code, "ECONNRESET", "connection should fail");
		});
});

test("proxy unregister", function (t) {
	t.plan(3);

	// Start the proxy.
	var proxy = createProxy().listen();

	// Start up an example http server.
	var server = http.createServer(function (req, res) {
		res.end("HTTP-Server");
	}).listen();

	// Register the example server.
	register(server, {
		proxy: proxy.address(),
		hosts: ["localhost"]
	}).then(function () {
		var href = "http://localhost:" + proxy.address().port;

		// Valid host proxy
		request(href)
			.get("/")
			.end(function (err, res) {
				if (err) t.fail(err);
				t.equals(res.text, "HTTP-Server", "server should respond");
				server.close();
				// Close host proxy
				request("http://localhost:" + proxy.address().port)
					.get("/")
					.end(function (err, res) {
						t.ok(err, "error should exist");
						t.equals(err.code, "ECONNRESET", "connection should fail");
					});
			});
	});

});

test("proxy multiple", function (t) {
	t.plan(6);

	// Start the proxy.
	var proxy = createProxy().listen();

	// Start up an example http server.
	var server1 = http.createServer(function (req, res) {
		res.end("HTTP-Server-1");
	}).listen();

	// Start up an example http server.
	var server2 = http.createServer(function (req, res) {
		res.end("HTTP-Server-2");
	}).listen();

	Promise.all([
		register(server1, {
			proxy: proxy.address(),
			hosts: ["test.com"]
		}),
		register(server2, {
			proxy: proxy.address(),
			hosts: ["api.test.com"]
		})
	]).then(function () {
		// Valid host proxy
		request(proxy)
			.get("/")
			.set("host", "test.com")
			.end(function (err, res) {
				if (err) t.fail(err);
				t.equals(res.text, "HTTP-Server-1", "server should respond");
				// Close host proxy
				server1.close();
				request(proxy)
					.get("/")
					.set("host", "test.com")
					.end(function (err, res) {
						t.ok(err, "error should exist");
						t.equals(err.code, "ECONNRESET", "connection should fail");
					});
			});

		// Valid host proxy
		request(proxy)
			.get("/")
			.set("host", "api.test.com")
			.end(function (err, res) {
				if (err) t.fail(err);
				t.equals(res.text, "HTTP-Server-2", "server should respond");
				// Close host proxy
				server2.close();
				request(proxy)
					.get("/")
					.set("host", "api.test.com")
					.end(function (err, res) {
						t.ok(err, "error should exist");
						t.equals(err.code, "ECONNRESET", "connection should fail");
					});
			});
	});

});
