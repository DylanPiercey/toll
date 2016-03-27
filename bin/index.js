#!/usr/bin/env node
'use stict'

const toll = require('../')
const pkg = require('../package.json')
const program = require('commander')

program
  .version(pkg.version)
  .usage('<port> [ip]')
  .parse(process.argv)

if (!program.args.length) program.help()
else {
  const port = Number(program.args[0])
  const ip = program.args[1] || undefined

  toll
  .createProxy()
  .listen(port, ip, function () {
    const address = this.address()
    process.stdout.write(
      'Toll Proxy Started on ' +
      address.address + '(' + address.port + ').'
    )
  })
}
