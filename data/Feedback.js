var Q = require('q');
var uuid = require('node-uuid');

var Mongoose = require('mongoose');
var Feedback = require('../models/Feedback.js');
var settings = require('../../settings')();
var mailer = require('../utils/mailer');

var sendFeedback = function(user, subject, message, url) {

	var deferred = Q.defer();

	var feedback = new Feedback();

	feedback.id = uuid.v4(); // generate a new guid
	feedback.submitter = user;
	feedback.date = Date.now();
	feedback.subject = subject;
	feedback.message = message;
	feedback.url = url;

	Q(feedback.save()).then(function() {
		deferred.resolve(feedback);
		// we don't need the user to wait for this....

		var mailSubject = "Feedback from " + user.username + " (ID: " + feedback.id + ")";

		var mailMessage = subject + "<br/><br/>";
		mailMessage += "URL: " + url + "<br/>";
		mailMessage += "Subject: " + subject + "<br/><br/>";
		mailMessage += message.replace("\n", "<br/>");

		mailer.sendEmail(settings.FEEDBACK_EMAIL, mailSubject, mailMessage);
		
	});

	return deferred.promise;
};

module.exports = {
	sendFeedback: sendFeedback
};