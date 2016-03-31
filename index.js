var Connection = require('./lib/connection')

module.exports = {
  createProxy: require('./lib/proxy'),
  connect: function (address, opts) {
    return new Connection(address, opts)
  }
}
