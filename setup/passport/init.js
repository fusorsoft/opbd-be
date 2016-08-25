var initSteam = require('./initSteam');
var UserModel = require('../../models/User');

module.exports = function(passport) {

	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
		UserModel.findById(id, function(err, user) {
			done(err, user);
		});
	});

	initSteam(passport);
};