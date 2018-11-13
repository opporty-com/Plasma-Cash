const {readFile, writeFile} = require('fs')
const {promisify} = require('util')

const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

module.exports = {readFileAsync, writeFileAsync}
