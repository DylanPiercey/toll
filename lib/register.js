"use strict";

var net = require("net");
var url = require("url");

module.exports = register;

/**
 * Registers a HTTP(s) server with a Toll proxy.
 *
 * @param {net.Server} server
 * @param {Object} opts
 * @param {String|Object} opts.proxy
 * @param {Array} opts.hosts
 * @param {Array} [opts.heartbeat]
 * @return {Promise}
 */
function register (server, opts) {
	// Require a valid node server.
	if (!server || typeof server.address !== "function") throw new TypeError("Toll: Registered server must be a valid HTTP(s) server.");
	// Ensure listen has been called.
	if (server.address() === null) throw new TypeError("Toll: You must call 'listen' on the server before registering.");
	// Validate options.
	if (!opts) throw new TypeError("Toll: Register options are required.");
	if (!opts.proxy) throw new TypeError("Toll: You must specify the proxy server address.");
	if (!opts.hosts) throw new TypeError("Toll: You must specify the hostnames of the server.");

	// Extract options and set defailts.
	var heartbeat = opts.heartbeat || 15000;
	var proxy     = parseAddress(opts.proxy);
	var hosts     = opts.hosts;
	var details   = JSON.stringify(Object.assign({ hosts: hosts }, server.address()));

	// Setup heartbeat.
	setInterval(connect, heartbeat);

	// Send initial heartbeat.
	return connect();

	// Sends a heartbeat to the proxy server.
	function connect () {
		return new Promise(function (resolve, reject) {
			net.connect(proxy)
				.once("close", resolve)
				.once("error", reject)
				.end(details);
		});
	}
}

/**
 * Does nothing
 */
function noop () {}

/**
 * Converts a url string into a valid socket address.
 *
 * @params {*} address
 * @returns {Object}
 */
function parseAddress (address) {
	if (typeof address !== "string") return address;
	var parsed = url.parse(address);
	return { host: parsed.hostname, port: parsed.port };
}
