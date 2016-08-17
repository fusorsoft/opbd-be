var Q = require('q');
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var settings = require('../../settings')();

var sendEmail = function(to, subject, message) {
	var deferred = Q.defer();

	var transport = nodemailer.createTransport(smtpTransport({
		host: settings.EMAIL_SERVER,
		port: 465,
		secureConnection: true,
		auth: {
			user: settings.EMAIL_USER,
			pass: settings.EMAIL_PASS
		}
	}));

	var mail = {
		from: settings.EMAIL_USER,
		to: to,
		subject: subject,
		html: message
	};

	transport.sendMail(mail, function(err, resp) {

		if (err) {
			deferred.reject(err);
			return;
		}

		transport.close();
		deferred.resolve();

	});

	return deferred.promise;
};

module.exports = {
	sendEmail: sendEmail
};