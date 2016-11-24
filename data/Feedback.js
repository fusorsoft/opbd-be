var Q = require('q');
var uuid = require('node-uuid');

var Mongoose = require('mongoose');
var Feedback = require('../models/Feedback.js');
var settings = require('../../settings')();
var mailer = require('../utils/mailer');

var sendFeedback = function(user, subject, message, url) {

	var feedback = new Feedback();

	feedback.id = uuid.v4(); // generate a new guid
	feedback.submitter = user;
	feedback.date = Date.now();
	feedback.subject = subject;
	feedback.message = message;
	feedback.url = url;

	return feedback.save();
};

module.exports = {
	sendFeedback: sendFeedback
};
