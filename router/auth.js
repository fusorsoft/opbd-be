var UserModel = require('../models/User');

module.exports = function() {
	var isAuthenticated = function(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}

		req.session.redirectUrl = req.originalUrl;

		res.status(401).redirect('/signin');
	};

	var isAuthorized = function(role) {
		return function(req, res, next) {
			UserModel.findOne({
				'steamID': req.user.steamID,
			}, function(err, user) {
				
				if (user && user.roles.indexOf(role) > -1) {
					return next();
				} else {
					if (role === 'user') {
						res.status(403).redirect('/beta');
					} else {
						res.status(403).end();
					}
				}
			});
		};
	};

	var apiIsAuthenticated = function(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}

		res.status('401').send({
			'Message': 'Unauthorized'
		});
	};

	var apiTokenValid = function(req, res, next) {
		var id = req.get('OP-User-Id');
		var apiToken = req.get('OP-Api-Token');

		UserModel.findOne({
			'steamID': id,
			'apiToken': apiToken
		}, function(err, user) {
			if (user) {
				return next();
			} else {
				res.status(401).end();
			}
		});
	};

	return {
		isAuthenticated: isAuthenticated,
		apiIsAuthenticated: apiIsAuthenticated,
		apiTokenValid: apiTokenValid,
		isAuthorized: isAuthorized
	};
};