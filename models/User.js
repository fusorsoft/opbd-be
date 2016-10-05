var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var FriendSchema = require('./Friend').schema;

var userSchema = new Schema({
	username: String,
	email: String,
	contactOnRelese: Boolean,
	steamID: String,
	apiToken: String,
	openId: String,
	friends: [FriendSchema],
	avatar: String,
	avatarMedium: String,
	avatarFull: String,
	friendlyUrl: String,
	roles: [String],
});


module.exports = Mongoose.model('User', userSchema);