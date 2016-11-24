'use strict'

var net = require('net')
var isLocal = require('is-local-ip')
var util = require('./util')
var slice = Array.prototype.slice
var temp = []
var normalizeHost = util.normalizeHost
var normalizeConnect = util.normalizeConnect
var parseSNI = util.parseSNI
var parseHeader = util.parseHeader
var server = Server.prototype = Object.create(net.Server.prototype)

module.exports = Server

/**
 * Creates a proxy server that will forward a hostname to a specific address.
 *
 * @returns {net.Server}
 */
function Server () {
  var self = this
  var servers = this._servers = {}

  // Setup server.
  net.Server.call(this, handleConnection)

  // Don't timeout requests.
  this.timeout = 0

  /**
   * Function to handle a new connection.
   * Adds an eventlistener to wait for data.
   *
   * @param {net.Socket|tls.TLSSocket} socket
   */
  function handleConnection (socket) {
    socket.once('error', handleEnd)
    socket.once('data', handleData)
  }

  /**
   * Function to listen for initial request data.
   * Attempts to proxy request based on hostname.
   *
   * @param {Buffer} data
   */
  function handleData (data) {
    var socket = this
    // Handle incomming registering server.
    if (isLocal(socket.remoteAddress) && data[0] === 123) {
      Object.assign(servers, JSON.parse(data))
      self.emit('heartbeat', servers)
      return
    }

    // Check for secure requests.
    var secure = data[0] === 22
    // Parse the hostname.
    var host = normalizeHost(secure ? parseSNI(data) : parseHeader(data))
    // Find the server.
    var address = servers[host || 'default']
    if (address == null) return socket.end()

    // Begin proxy to address.
    var proxy = net
      .connect(address)
      .setTimeout(Number.MAX_VALUE)

    proxy.once('error', handleError)
    socket.once('error', handleError)
    proxy.write(data)
    socket.pipe(proxy).pipe(socket)

    /**
     * Gracefully handle net errors.
     *
     * @param {Error} err
     */
    function handleError (err) {
      switch (err.code) {
        case 'ECONNREFUSED':
          // Server not up anymore.
          self.remove(address.hosts)
          break
        case 'ECONNRESET':
          // Unimportant socket error.
          break
        default:
          console.error(err)
          break
      }

      if (this === proxy) socket.emit('error', err)
      proxy.end()
    }
  }
}

/**
 * Adds a server that can be proxied to.
 *
 * @return {Promise<Number>}
 */
server.register = function register (hosts) {
  var server = normalizeConnect(slice.call(arguments, 1))
  if (!hosts) throw new TypeError('Toll: Invalid server hosts provided.')
  if (!server) throw new TypeError('Toll: Invalid server address provided.')
  hosts = temp.concat(hosts)
  // Add server server for each host.
  for (var i = hosts.length; i--;) this._servers[hosts[i]] = server
  // Attach hosts to server for easy referencing.
  server.hosts = hosts
  return Promise.resolve()
}

/**
 * Removes a server from the proxy list.
 *
 * @param {Number} index
 * @return {Promise}
 */
server.remove = function remove (hosts) {
  if (!hosts) throw new TypeError('Toll: Invalid server hosts provided.')
  hosts = temp.concat(hosts)
  for (var i = hosts.length; i--;) this._servers[hosts[i]] = null
  return Promise.resolve()
}

/**
 * Ends a socket on error event.
 */
function handleEnd () {
  this.end()
}
