const mongoose = require('mongoose')
var Schema = mongoose.Schema

var breakdownMetadataSchema = new Schema({
  submitter: String,
  corroborators: [String],
}, {
  strict: false,
})

module.exports = mongoose.model('BreakdownMetadata', breakdownMetadataSchema)
