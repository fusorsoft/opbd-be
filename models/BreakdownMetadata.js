var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var breakdownMetadataSchema = new Schema({
	submitter: String,
	corroborators: [String]
}, {
	strict: false
});


module.exports = Mongoose.model('BreakdownMetadata', breakdownMetadataSchema);