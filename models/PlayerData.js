var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var schema = new Schema({
	SteamID: String
}, {
	strict: false
});

module.exports =  Mongoose.model('PlayerData', schema);