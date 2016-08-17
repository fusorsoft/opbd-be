var mongoose = require('mongoose');
var User = require('../models/user.js');
var Friend = require('../models/friend.js');
var MatchData = require('../models/PlayerMatchData.js');
var MatchData = mongoose.model("PlayerMatchData");
var Q = require('q');
var uuid = require('node-uuid');
var mailer = require('../utils/mailer');

var getUsers = function() {
	var deferred = Q.defer();

	Q(User.find({}).lean().exec()).then(function(data) {
		deferred.resolve(data);
	},
	function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var getUserInfoByUserId = function(userId) {
	
	var deferred = Q.defer();

	var fields = [
		'steamID',
		'username',
		'avatar',
		'avatarMedium',
		'avatarFull',
	].join(' ');


	Q.all([
		Q(User.findOne({ steamID: userId }, fields).lean().exec()),
		Q(MatchData.findOne({ 'playerData.SteamID' : userId}, 'playerData.Name').sort({created_at: -1}).lean().exec())
	]).then(function(data) {

		if (data[0]) {
			deferred.resolve(data[0]);
		} else {
			deferred.resolve({
				username: data[1].playerData[0].Name,
				steamID: userId
			});
		}

		deferred.resolve(data[0]);
	});

	return deferred.promise;
};

var getFriends = function(userId) {
	var deferred = Q.defer();

	Q(User.findOne({ 'steamID' : userId}, 'username friends').lean().exec())
	.then(function(data) {
		var friendData = data.friends.map(function(f) {
			return {
				steamID: f.steamId,
				username: f.username
			};
		});	

		deferred.resolve(
		{
			username: data.username,
			friends: friendData
		});
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var addFriend = function(userId, friendId, friendName) {
	var deferred = Q.defer();

	User.findOne({
		'steamID': userId
	}, function(err, user) {
		var friend = new Friend();
		friend.steamId = friendId;
		friend.username = friendName;

		if (user.friends.find(function(f) {
				return f.steamId === userId;
			})) {
			var conflictUri = 'users/' + userId + '/friends/' + friendId;

			deferred.reject({
				'conflictUri': conflictUri,
				'message' : 'Already exists in friends list'
			});
		}

		user.friends.push(friend);

		user.save(function(err) {
			if (err) {
				deferred.reject({'message': 'unable to add friend'});
			}

			deferred.resolve();
		});
	});

	return deferred.promise;
};

var removeFriend = function(userId, friendId) {
	var deferred = Q.defer();

	Q(User.findOneAndUpdate(
		{ 'steamID': userId },
		{ $pull: { 'friends' : { 'steamId' : friendId }}}
		).exec()).then(
		function(user) {
			deferred.resolve();
		},
		function(error) {
			deferred.reject(error);
		}
	);

	return deferred.promise;
};

var setEmailAddress = function(steamId, email) {
	var deferred = Q.defer();

	Q(User.findOneAndUpdate( 
		{
			'steamID': steamId
		},
		{
			'email': email,
			'contactOnRelease': true
		}
	).exec()).then(function() {
		deferred.resolve();
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

module.exports = {
	getUsers: getUsers,
	getUserInfoByUserId: getUserInfoByUserId,
	getFriends: getFriends,
	addFriend: addFriend,
	removeFriend: removeFriend,
	setEmailAddress: setEmailAddress,
};