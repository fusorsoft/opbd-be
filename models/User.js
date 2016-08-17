var Mongoose = require('mongoose');
var FriendSchema = require('./friend').schema;

module.exports = Mongoose.model('User', {
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
	roles: [String]
});