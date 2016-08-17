var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var PlayerData = require('./PlayerData');
var BreakdownMetadata = require('./BreakdownMetadata');

var playerDataSchema = PlayerData.schema;
var breakdownMetadataSchema = BreakdownMetadata.schema;

var schema = new Schema({
	playerData: [playerDataSchema],
	breakdownMetadata: breakdownMetadataSchema
}, {
	strict: false
});

module.exports = Mongoose.model('PlayerMatchData', schema);