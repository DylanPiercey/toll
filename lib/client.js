'use strict'

var net = require('net')
var util = require('./util')
var EventEmitter = require('events').EventEmitter
var slice = Array.prototype.slice
var temp = []
var normalizeConnect = util.normalizeConnect
var client = Client.prototype = Object.create(EventEmitter.prototype)

module.exports = Client

function Client (address) {
  // Ensure address provided.
  if (!address) throw new TypeError('Toll: You must specify the proxy server address.')
  // Extract options and set defailts.
  this._servers = {}
  this._address = address
  this._heartbeat = address.heartbeat || 15000
  // Setup event emitter.
  EventEmitter.call(this)
}

/**
 * Sends a client to the Toll proxy with a list of registered servers.
 *
 * @return {Promise}
 */
client._send = function send () {
  var self = this
  // Reset other clients.
  clearInterval(self._interval)
  self._interval = setInterval(self._send, self._heartbeat)
  var p = self._p = new Promise(function (resolve, reject) {
    setImmediate(function () {
      // Here we ensure only one net client per tick.
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
 * Adds a server that can be proxied to.
 *
 * @return {Promise<Number>}
 */
client.register = function register (hosts) {
  var server = normalizeConnect(slice.call(arguments, 1))
  if (!hosts) throw new TypeError('Toll: Invalid server hosts provided.')
  if (!server) throw new TypeError('Toll: Invalid server address provided.')
  hosts = temp.concat(hosts)
  this.emit('register', hosts, server)
  // Add server server for each host.
  for (var i = hosts.length; i--;) this._servers[hosts[i]] = server
  // Attach hosts to server for easy referencing.
  server.hosts = hosts
  return this._send()
}

/**
 * Removes a server from the proxy list.
 *
 * @param {Number} index
 * @return {Promise}
 */
client.remove = function remove (hosts) {
  if (!hosts) throw new TypeError('Toll: Invalid server hosts provided.')
  hosts = temp.concat(hosts)
  this.emit('remove', hosts)
  for (var i = hosts.length; i--;) this._servers[hosts[i]] = null
  return this._send()
}
