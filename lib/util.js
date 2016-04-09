var normalizeConnectArgs = require('net')._normalizeConnectArgs
var hostReg = /^Host: ([^:\r\n]+).*$/im

module.exports = {
  parseHeader: parseHeader,
  parseSNI: parseSNI,
  normalizeHost: normalizeHost,
  normalizeConnect: normalizeConnect
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
 * Like normalizeConnectArgs but ignores callback.
 */
function normalizeConnect (args) {
  return normalizeConnectArgs(args)[0]
}

/**
 * Remove `www` part of hostname.
 */
function normalizeHost (host) {
  if (!host) return ''
  return String(host).replace(/^www\./, '')
}
