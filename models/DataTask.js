var Mongoose = require('mongoose');

module.exports = Mongoose.model('DataTask', {
	id: String,
	initiator: String,
	status: String,
	start: Date,
	complete: Date,
});