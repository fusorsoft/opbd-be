var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var uuid = require('node-uuid');
var Q = require('q');
var express = require('express'),
	router = express.Router();

var DataTask = require('../../../data/DataTask.js');
var MatchData = require('../../../data/MatchData.js');

module.exports = function(passport, auth) {

	var createAddPlayerDataTaskAndRespond = function(userId, res) {
		var deferred = Q.defer();

		DataTask.create(userId, "Starting")
			.then(function(task) {
				res.status(202).json({
					taskUrl: '/api/tasks/' + task.task
				}).end();

				taskId = task.Id;
				deferred.resolve(taskId);
			}, function(err) {
			});

		return deferred.promise;
	};

	var addPlayerData = function(req, res, data, userId) {
		var taskId = null;
		createAddPlayerDataTaskAndRespond(userId, res)
			.then(function(newTaskId) {
				taskId = newTaskId;
				return MatchData.createPlayerData(data, userId);
			})
			.then(function() {
				// success, update task
				console.log('success');
			}, function() {
				//fail
				console.log('fail');
			});
	};

	router.get('/summary/:type/:id', auth.isAuthenticated, function(req, res) {
		var queryId = req.params.id;
		var queryField = req.params.type;

		if (queryField !== 'user' && queryField !== 'match') {
			res.status(400).json({
				message: 'Invalid query type ' + queryField
			}).end();
		}

		if (req.query.with) {
			
			MatchData.getCombinedMatchSummaryData(queryId, req.query.with)
			.then(function(intersection) {
				res.status(200).json(intersection).end();
			}, function(err) {
				res.status(500).json({
					error: err
				}).end();
			});	

		} else {

			var op = null;

			if (queryField == 'user') {
				op = MatchData.getMatchSummaryDataByUser;
			} else {
				op = MatchData.getMatchSummaryDataByMatchId;
			}

			op(queryId).then(function(data) {
				//console.log('success: ' + query);
				res.status(200).json(data).end();
			}, function(err) {
				console.log('err: ' + error);
				res.status(500).end();
			});
		}
	});

	router.get('/details/:playerMatchId', auth.isAuthenticated, function(req, res) {

		MatchData.getMatchDetailsById(req.params.playerMatchId).then(function(data) {
			res.status(200).json(data).end();
		}, function(err) {
			console.log('err: ' + error);
			res.status(500).end();
		});
	});

	router.get('/players', function(req, res) {
		var query = req.query.query;
		var limit = req.query.limit;

		if (!query || !limit) {
			res.status(400).json({'message':'Missing parameter'}).end();
			return;
		}

		MatchData.getPlayerFromMatchQuery(query, limit).then(function(data) {
			res.status(200).json(data).end();
		},
		function(err) {
			res.status(500).json().end();
		});
	});

	router.post('/', auth.isAuthenticated, function(req, res) {
		addPlayerData(req, res, req.body, req.user.steamID);
	});

	router.post('/fromClient/', auth.apiTokenValid, function(req, res) {
		addPlayerData(req, res, req.body, req.get('OP-User-Id'));
	});

	return router;
};