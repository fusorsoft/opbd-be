var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var EmailConfirmationSchema = new Schema({
	email: String,
	token: String,
	date: [Date],
	steamId: String
});

module.exports = Mongoose.model('EmailConfirmation', EmailConfirmationSchema);

