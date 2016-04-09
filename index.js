var Server = require('./lib/server')
var Client = require('./lib/client')
var normalizeConnect = require('./lib/util').normalizeConnect

module.exports = {
  createProxy: function () {
    return new Server()
  },
  connect: function () {
    return new Client(normalizeConnect(arguments))
  }
}
