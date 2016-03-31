'use strict'

var net = require('net')
var temp = []
var connection = Connection.prototype

module.exports = Connection

function Connection (address, opts) {
  // Ensure address provided.
  if (!address) throw new TypeError('Toll: You must specify the proxy server address.')

  // Extract options and set defailts.
  opts = opts || {}
  this.send = this.send.bind(this)
  this._heartbeat = opts.heartbeat || 15000
  this._address = parseAddress(address)
  this._servers = []
}

/**
 * Sends a connection to the Toll proxy with a list of registered servers.
 *
 * @return {Promise}
 */
connection.send = send
function send () {
  var self = this
  // Reset other connections.
  clearInterval(self._interval)
  self._interval = setInterval(self.send, self._heartbeat)
  var p = self._p = new Promise(function (resolve, reject) {
    setImmediate(function () {
      // Here we ensure only one net connection per tick.
      if (p !== self._p) return resolve(self._p)
      // Sends a heartbeat to the proxy server.
      net.connect(self._address)
        .once('close', resolve)
        .once('error', reject)
        .end(JSON.stringify(self._servers))
    })
  })
  return p
}

/**
 * Registers a HTTP(s) server with a Toll proxy.
 *
 * @param {net.Server} server
 * @param {Array|String} hosts
 * @return {Promise}
 */
connection.register = register
function register (server, hosts) {
  // Require a valid node server.
  if (!server || typeof server.address !== 'function') throw new TypeError('Toll: Registered server must be a valid HTTP(s) server.')
  // Ensure listen has been called.
  if (server.address() === null) throw new TypeError('Toll: You must call "listen" on the server before registering.')
  // Ensure some hostnames were provided.
  if (!hosts) throw new TypeError('Toll: You must specify the hostnames of the server.')
  // Add service.
  this._servers.push(Object.assign({ hosts: temp.concat(hosts) }, server.address()))
  // Send a heartbeat for the registration.
  return this.send()
}

/**
 * Converts a url string into a valid socket address.
 *
 * @params {*} address
 * @returns {Object}
 */
function parseAddress (address) {
  // Allow passing in the actual proxy server.
  if (address && typeof address.address === 'function') return address.address()
  return address
}
