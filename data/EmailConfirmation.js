var Q = require('q');
var uuid = require('node-uuid');

var Mongoose = require('mongoose');
var EmailConfirmation = require('../models/EmailConfirmation.js');
var Mailer = require('../utils/mailer.js');
var User = require('./User.js');

var get24HoursAgo  = function() {
	var twentyFourHoursAgo = new Date();
	twentyFourHoursAgo.setHours(new Date().getHours() - 24);

	return twentyFourHoursAgo;
};

var getDateCountForFieldToday = function(field, val) {
	var deferred = Q.defer();

	var twentyFourHoursAgo = get24HoursAgo();

	var initialMatchQ = { 
		'$match' : {
				'date': {
					'$elemMatch': {
						'$gte': twentyFourHoursAgo
					}
				}
			}
		};

	initialMatchQ.$match[field] = val;

	EmailConfirmation.aggregate(
		[
			initialMatchQ,
			{ '$unwind' : '$date' },
			{ '$match' : {
				'date': { '$gte': twentyFourHoursAgo }		
				
			}},
			{
				'$group': {
					'_id' : null,
					'count': { '$sum': 1}
				}
			}
		], 
		function(err, count) {

			if(err) {
				deferred.reject(err);
			}
			
			var finalCount = count.length > 0 ? count[0].count : 0;

			deferred.resolve(finalCount);
		}
	);

	return deferred.promise;
};

var getTryCountToEmailToday = function(email) {
	return getDateCountForFieldToday('email', email);
};

var getTryCountBySteamIdToday = function(steamId) {
	return getDateCountForFieldToday('steamId', steamId);
};

var create =  function(email, steamId) {
	var deferred = Q.defer();

	var emailConfirmation = new EmailConfirmation();

	emailConfirmation.email = email;
	emailConfirmation.steamId = steamId;
	emailConfirmation.date = [new Date()];
	emailConfirmation.token = uuid.v4();

	emailConfirmation.save().then(function() {
		deferred.resolve(emailConfirmation.token);
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var getOldestOrNewestEmailSentToday = function(field, value, oldest) {
	var deferred = Q.defer();
	var twentyFourHoursAgo = get24HoursAgo();

	var initialMatchQ = { 
		'$match' : {
				'date': {
					'$elemMatch': {
						'$gte': twentyFourHoursAgo
					}
				}
			}
		};

	initialMatchQ.$match[field] = value;

	EmailConfirmation.aggregate(
		[
			initialMatchQ,
			{ '$unwind' : '$date' },
			{ '$sort': { 'date': oldest ? 1 : -1 }},
			{ '$limit': 1 }
		], 
		function(err, data) {

			if(err) {
				deferred.reject(err);
			}
			
			deferred.resolve(data[0]);
		}
	);

	return deferred.promise;
};

var getOldestEmailSentTodayByUser = function(steamId) {
	return getOldestOrNewestEmailSentToday('steamId', steamId, true);
};

var getOldestEmailSentToday = function(email) {
	return getOldestOrNewestEmailSentToday('email', email, true);
};

var getMostRecentEmailSentToday = function(email) {
	return getOldestOrNewestEmailSentToday('email', email, false);
};

var updateTryDate = function(email, steamId) {
	var deferred = Q.defer();

	EmailConfirmation.findOneAndUpdate(
	{
		email: email,
		steamId: steamId
	}, 
	{
		$push: { 'date': new Date() }
	}
	).then(function(doc) {
		deferred.resolve(doc.token);
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};


var getTryForEmailSteamIdCombo = function(email, steamId) {
	var deferred = Q.defer();

	Q(EmailConfirmation.findOne(
		{
			steamId: steamId,
			email: email,
		}
	).lean().exec()).then(function(count) {
		deferred.resolve(count);
	}, function(err) {
		deferred.rejeect(err);
	});

	return deferred.promise;
};

var setConfirmation = function(email, steamId, userName) {
	var deferred = Q.defer();

	// get all try count by current steamId..
	// and all tries to a given email.

	if (!email || !steamId) {
		//empty values falsy, require both to be present
		deferred.reject({error: 'email and steam id required'});
		return deferred.promise;
	}

	Q.all(
	[
		getTryCountBySteamIdToday(steamId),
		getTryCountToEmailToday(email),
		getTryForEmailSteamIdCombo(email, steamId),
		getMostRecentEmailSentToday(email),
		getOldestEmailSentToday(email),
		getOldestEmailSentTodayByUser(steamId),
	]).then(function(counts) {
		var countForSteamId = counts[0];
		var countForEmail = counts[1];
		var tryForCombo = counts[2];
		var newestEmail = counts[3];
		var oldestEmail = counts[4];
		var oldestByUser = counts[5];

		var error = [];

		if ( newestEmail && (new Date().getTime() - newestEmail.date.getTime()) / 60000 < 3) {
			// "if the most recent try to this email was in the last 3 minutes"
			error.push({
				message: 'Too soon to retry',
				resolvesAt: new Date(newestEmail.date.getTime() + 180000) // three minutes from now
			});
		}

		if (countForEmail > 5) {
			error.push({
				message: 'Too many tries to this email',
				resolvesAt: new Date(new Date().setDate(oldestEmail.date.getDate() + 1)) // 24 hours from the oldest one sent in the last 24 hours
			});
		}

		if (countForSteamId > 5) {
			error.push({
				message: 'Too many tries for this user',
				resolvesAt: new Date(new Date().setDate(oldestByUser.date.getDate() + 1))
			});
		}

		if (error.length > 0) {
			deferred.reject(error);
			return deferred.promise;
		}

		
		if(tryForCombo !== null) {
			//add current time
			updateTryDate(email, steamId).then(function(token) {
				sendConfirmationEmail(email, userName, token);
				deferred.resolve('updated');
			}, function(err) {
				deferred.reject(err);
			});
		} else {
			//add new...

			create(email, steamId).then(function(token) {
				sendConfirmationEmail(email, userName, token);
				deferred.resolve('created');
			}, function(err) {
				deferred.reject(err);
			});
		}
	});

	return deferred.promise;
};

var sendConfirmationEmail = function(email, userName, token) {
	var subject = userName + ', please confirm your email address with Operation Breakdown';
	var message= '<link href="https://fonts.googleapis.com/css?family=Raleway" rel="stylesheet" type="text/css">';
	message+= '<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" type="text/css">';
	message+= '<div style="text-align:center;padding: 3em 0px;background-color: #374146;">';
	message+= '<img src="http://www.operation-breakdown.com/assets/images/opbreakdownlogo-horizontal.png"/>';
	message+= '</div>';
	message+= '<h1 style="font-family: Raleway, Helvetica, Tahoma, Sans-serif;">Hello ' + userName + ',</h1>';
	message+= '<div style="font-family: Open Sans, Arial, Sans-serif;">';
	message+= '<p>Please confirm your email address with Operation Breakdown.</p>';
	message+= '<p><a href="http://www.operation-breakdown.com/confirmEmail?token=' + token + '">Click here to confirm</a>. ';
	message+= 'If the link doesn\'t work, paste the following link in to your browser:</p>';
	message+= '<p>http://www.operation-breakdown.com/confirmEmail?token=' + token + '</p>';
	message+= '<p><em>If you didn\'t sign up, you can safely ignore this email, we\'re sorry for the inconvenience.</em></p>';
	message+= '<div style="background-color: #374146;padding: 3em 0;text-align: center;color: rgba(255, 255, 255, 0.5);margin-top: 5em;">';
	message+= '<p><a style="color: #54606d;" href="mailto:contact@operation-breakdown.com">Contact Us</a> | <a style="color: #54606d;" href="http://www.operation-breakdown.com/privacy">Privacy Policy</a></p>';
	message+= '<p style="font-size: 0.7em;">&copy; 2016 Fusorsoft, LLC.  Operation Breakdown is not associated with Valve Corp.</p></div></div>';

	Mailer.sendEmail(email, subject, message);
};

var confirmEmail = function(token) {
	var deferred = Q.defer();


	var q = {
		'token': token
	};

	Q(EmailConfirmation.findOne(q).exec()).then(function (confirmation) {
		if (!confirmation) {
			deferred.reject('Bad token');
		}

		User.setEmailAddress(confirmation.steamId, confirmation.email).then(function() {
			confirmation.remove();
			deferred.resolve();
		});
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};


module.exports = {
	setConfirmation: setConfirmation,
	confirmEmail: confirmEmail
};