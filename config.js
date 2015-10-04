const ini = require('ini')
const fs = require('fs')

module.exports = ini.parse(fs.readFileSync('./gm-cli.ini', 'utf-8'))