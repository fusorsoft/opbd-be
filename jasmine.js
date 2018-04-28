const Jasmine = require('jasmine')

const configPath = 'test/jasmine.json'
const jasmine = new Jasmine()
jasmine.loadConfigFile(configPath)
jasmine.execute()
