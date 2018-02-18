const mongoose = require('mongoose')
const PlayerData = require('./PlayerData')
const BreakdownMetadata = require('./BreakdownMetadata')

const Schema = mongoose.Schema
const playerDataSchema = PlayerData.schema
const breakdownMetadataSchema = BreakdownMetadata.schema

const schema = new Schema({
  playerData: [playerDataSchema],
  breakdownMetadata: breakdownMetadataSchema,
}, {
  strict: false,
})

module.exports = mongoose.model('PlayerMatchData', schema)
