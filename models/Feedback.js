var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var User = Mongoose.model('User');

var userSchema = User.schema;

var FeedbackSchema = new Schema({
	submitter: [userSchema],
	id: String,
	date: Date,
	subject: String,
	message: String,
	url: String
});

FeedbackSchema.add({replies: [FeedbackSchema]});

module.exports = Mongoose.model('Feedback', FeedbackSchema);