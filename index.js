var Connection = require('./lib/connection')

module.exports = {
  createProxy: require('./lib/proxy'),
  connect: function (a, b, c) {
    // Parse connection arguments like net.connect.
    var opts = (
      typeof a === 'string' ? { path: a }
      : typeof a === 'number' ? { port: a, host: b }
      : a
    )

    if (typeof opts !== 'object') {
      throw new TypeError('Toll: Invalid connection options.')
    }

    // Find the first object for the heatbeat option.
    opts.heartbeat = (
      typeof a === 'object' ? a.heartbeat
      : typeof b === 'object' ? b.heartbeat
      : typeof c === 'object' ? c.heartbeat
      : undefined
    )

    return new Connection(opts)
  }
}
