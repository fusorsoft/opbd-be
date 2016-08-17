var Q = require('q');
var uuid = require('node-uuid');

var Mongoose = require('mongoose');
var DataTask = require('../models/DataTask.js');

var saveTask = function(userId, status) {

	var deferred = Q.defer();

	var task = new DataTask();

	task.id = uuid.v4(); // generate a new guid
	task.initiator = userId;
	task.status = status;
	task.start = Date.now();
	task.complete = null;

	Q(task.save()).then(function() {
		deferred.resolve(task);
	});

	return deferred.promise;
};

module.exports = {
	create: saveTask
};