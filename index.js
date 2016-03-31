var normalizeConnectArgs = require('net')._normalizeConnectArgs
var Connection = require('./lib/connection')

module.exports = {
  createProxy: require('./lib/proxy'),
  connect: function () {
    return new Connection(normalizeConnectArgs(arguments)[0])
  }
}
