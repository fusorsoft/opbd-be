import mongoose from 'mongoose'
import PlayerData from './PlayerData'
import BreakdownMetadata from './BreakdownMetadata'

const Schema = mongoose.Schema
const playerDataSchema = PlayerData.schema
const breakdownMetadataSchema = BreakdownMetadata.schema

const schema = new Schema({
  playerData: [playerDataSchema],
  breakdownMetadata: breakdownMetadataSchema,
}, {
  strict: false,
})

export default mongoose.model('PlayerMatchData', schema)
