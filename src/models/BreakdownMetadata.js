import mongoose from 'mongoose'
var Schema = mongoose.Schema

var breakdownMetadataSchema = new Schema({
  submitter: String,
  corroborators: [String],
}, {
  strict: false,
})

export default mongoose.model('BreakdownMetadata', breakdownMetadataSchema)
