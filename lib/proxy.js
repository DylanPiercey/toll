'use strict'

var net = require('net')
var hostReg = /^Host: ([^:\r\n]+).*$/im
var _proxy = {}
var temp = []

module.exports = createProxy

/**
 * Creates a proxy server that will forward a hostname to a specific address.
 *
 * @returns {net.Server}
 */
function createProxy () {
  return net.createServer(handleConnection)
}

/**
 * Function to handle a new connection.
 * Adds an eventlistener to wait for data.
 *
 * @param {net.Socket|tls.TLSSocket} socket
 */
function handleConnection (socket) {
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
  if (isLocal(socket.remoteAddress) && data[0] === 91) {
    JSON.parse(data).forEach(addServer)
    return
  }

  // Check for secure requests.
  var secure = data[0] === 22
  // Parse the hostname.
  var hostname = secure ? parseSNI(data) : parseHeader(data)
  // Find the server.
  var server = _proxy[hostname || 'fallback']
  if (server == null) return socket.end()
  // Begin proxy to server.
  var proxy = net.connect(server)
  proxy.write(data)
  proxy.once('error', handleError)
  socket.pipe(proxy).pipe(socket)

  /**
   * Gracefully handle net errors.
   *
   * @param {Error} err
   */
  function handleError (err) {
    if (err.code === 'ECONNREFUSED') removeServer(server)
    else console.error(err)
    socket.end()
    this.end()
  }
}

/**
 * Adds a server that can be proxied to.
 *
 * @param {Object} server
 */
function addServer (server) {
  if (!server || !server.port) return
  var hosts = server.hosts = temp.concat(server.hosts)
  for (var i = hosts.length; i--;) _proxy[hosts[i]] = server
}

/**
 * Adds a server from the proxy list.
 *
 * @param {Object} server
 */
function removeServer (server) {
  if (!server) return
  var hosts = server.hosts
  for (var i = hosts.length; i--;) delete _proxy[hosts[i]]
}

/**
 * Parses initial http header for a hostname.
 *
 * @params {Buffer} data
 * @returns {String|null}
 */
function parseHeader (data) {
  var match = data.toString('utf8').match(hostReg)
  return match && match[1]
}

/**
 * Parses initial https SNI data for a hostname.
 *
 * @params {Buffer} data
 * @returns {String|null}
 */
function parseSNI (data) {
  // Session ID Length (static position)
  var currentPos = 43
  // Skip session IDs
  currentPos += 1 + data[currentPos]
  // skip Cipher Suites
  currentPos += 2 + data.readInt16BE(currentPos)
  // skip compression methods
  currentPos += 1 + data[currentPos]
  // We are now at extensions!
  currentPos += 2 // ignore extensions length
  while (currentPos < data.length) {
    if (data.readInt16BE(currentPos) === 0) {
      // we have found an SNI
      var sniLength = data.readInt16BE(currentPos + 2)
      currentPos += 4
      // the RFC says this is a reserved host type, not DNS
      if (data[currentPos] !== 0) return null
      currentPos += 5
      return data.toString('utf8', currentPos, currentPos + sniLength - 5)
    } else {
      currentPos += 4 + data.readInt16BE(currentPos + 2)
    }
  }
  return null
}

/**
 * Test that a hostname / ip address is a local loopback ip.
 */
function isLocal (address) {
  return (
    /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/.test(address) ||
    /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/.test(address) ||
    /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})/.test(address) ||
    /^(::f{4}:)?172\.1[6-9]\.([0-9]{1,3})\.([0-9]{1,3})/.test(address) ||
    /^fe80::1$/.test(address) ||
    /^::1$/.test(address) ||
    /^::$/.test(address)
  )
}
