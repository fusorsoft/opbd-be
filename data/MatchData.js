var uuid = require('node-uuid');
var Q = require('q');

var BreakdownMetadata = require('../models/BreakdownMetadata.js');
var PlayerData = require('../models/PlayerData.js');
var PlayerMatchData = require('../models/PlayerMatchData.js');

var matchSummaryFields = [
	'playerData.SteamID',
	'playerData.Name',
	'playerData.MatchTeam',
	'playerData.ADR',
	'playerData.TSideADR',
	'playerData.CTSideADR',
	'playerData.MVPs',
	'playerData.DamageTotals.Kills',
	'playerData.DamageTotals.Deaths',
	'playerData.DamageTotals.Assists',
	'playerData.DamageTotals.TotalDamage',
	'playerData.TSideDamageTotals.TotalDamage',
	'playerData.CTSideDamageTotals.TotalDamage',
	'playerData.TotalWins',
	'playerData.TotalRoundsPlayed',
	'playerData.TRoundsPlayed',
	'playerData.CTRoundsPlayed',
	'playerData.TWins',
	'playerData.CTWins',
	'playerData.InitialRank',
	'playerData.FinalRank',
	'demoFileMetadata.Created',
	'matchMetadata.MapName',
	'breakdownMetadata.breakdownMatchId'
];

var getMatchDetailsById = function(playerMatchId) {
	var deferred = Q.defer();

	Q(PlayerMatchData.findById(playerMatchId).lean().exec()).then(function(data) {
		deferred.resolve(data);
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var getMatchSummaryData = function(query) {
	var deferred = Q.defer();

	Q(PlayerMatchData.find(query, matchSummaryFields.join(' ')).lean().exec())
	.then(function(data){ 
		deferred.resolve(data);
	});

	return deferred.promise;
};


var getMatchSummaryDataByUser = function(playerId) {
	var query = { 'playerData.SteamID': playerId };

	return getMatchSummaryData(query);
};

var getMatchSummaryDataByMatchId = function(matchId) {
	var query = { 'breakdownMetadata.breakdownMatchId': matchId };

	return getMatchSummaryData(query);
};

var getCombinedMatchSummaryData = function(player1, player2) {
	var deferred = Q.defer();

	p1Query = { 'playerData.SteamID': player1 };
	p2Query = { 'playerData.SteamID': player2 };

	Q.all([
		PlayerMatchData.find(p1Query, matchSummaryFields.join(' ')).lean().exec(),
		PlayerMatchData.find(p2Query, 'breakdownMetadata.breakdownMatchId playerData.MatchTeam').lean().exec()
	])
	.then(function(data) {
		var userMatches = data[0];
		var withMatches = data[1];

		var lookup = {};
		var intersection = [];

		withMatches.map(function(w) {
			// lookup object's keys will be used to compute intersection, nothing special about 1
			lookup[w.breakdownMetadata.breakdownMatchId] = w.playerData[0].MatchTeam;	
		});



		for (var i = 0; i < userMatches.length; i++) {
			var currentId = userMatches[i].breakdownMetadata.breakdownMatchId;

			var matchWithFriend = {
				friend: player2,
				match: userMatches[i]
			};

			if (lookup[currentId]  && userMatches[i].playerData[0].MatchTeam === lookup[currentId]) {
				intersection.push(matchWithFriend);
			}
		}
		deferred.resolve(intersection);
	});

	return deferred.promise;	
};

var getMatchData = function(server, map, fileHash) {
	var query = {
		'matchMetadata.MapName': map,
		'demoFileMetadata.FileHash': fileHash,
		'matchMetadata.ServerName': server,
	};

	return Q(PlayerMatchData.find(query).lean().exec());
};

// computes and intersection of two matche lists based on some predicate
var intersectMatches = function(data, data2, filterFn) {

	return data.playerData.filter(function(p) {
		var thisPlayerId = p.SteamID;
		var item = data2.filter(filterFn)[0];

		if (existingItem) {
			return true;
		} else {
			return false;
		}
	});
};

var createPlayerData = function(data, userId) {
	var deferred = Q.defer();

	getMatchData(
		data.matchMetadata.ServerName,
		data.matchMetadata.MapName,
		data.demoFileMetadata.FileHash
	).then(function(existingData) {
		return saveMatchData(existingData, data, userId);
	}).then(function() {
		deferred.resolve();
	});

	return deferred.promise;
};

var saveMatchData = function(existingData, data, userId) {
	var toBeUpdated = [];
	var newItems = data.playerData;

	if (existingData.length > 0) {
		//someone has already submitted some data for this map...

		toBeUpdated = filterMatches(data, existingData, function(e) {
			// user is corroborating this match
			return e.playerData[0].SteamID === thisPlayerId && e.breakdownMetadata.submitter !== userId;
		});

		newItems = filterMatches(data, existingData, function(e) {
			// user is adding data for a new player from this match.
			return e.playerData[0].SteamID === thisPlayerId;
		});

		console.log(newItems.length + ' new items, ' + toBeUpdated.length + ' to be updated');
	}

	var updateItemPromises = toBeUpdated.map(function(p) {
		p.breakdownMetadata.corroborators.push("" + userId);

		var pMatchData = new PlayerMatchData(p);
		return Q(pMatchData.save());
	});

	var thisBreakdownMatchId = uuid.v4();

	var newItemPromises = newItems.map(function(p) {

		// map all submitted player data to an array of promises
		var breakdownMetadata = new BreakdownMetadata({
			submitter: "" + userId,
			corroborators: [],
			breakdownMatchId: thisBreakdownMatchId
		});

		var playerMatchData = {
			breakdownMetadata: breakdownMetadata,
			matchMetadata: data.matchMetadata,
			demoFileMetadata: data.demoFileMetadata,
			playerData: p
		};

		var pMatchData = new PlayerMatchData(playerMatchData);

		return Q(pMatchData.save());
	});

	var allThePromises = updateitemPromises.concat(newItemPromises);

	return Q.all(allThePromises);
};

var getSteamIdsForName = function(name) {
	// steam allows multiple people to have the same name....
	var deferred = Q.defer();

	Q(PlayerMatchData.distinct('playerData.SteamID', { 'playerData.Name' : name}).lean().exec()).then(function(data) {
		var names = data.map(function(d) {
			return {
				name: name,
				steamId: d
			};
		});
		deferred.resolve(names);
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var getMatchDataCountForSteamId = function(steamId) {
	var deferred = Q.defer();

	Q(PlayerMatchData.count({'playerData.SteamID': steamId}).lean().exec()).then(function(count) {
		deferred.resolve(count);
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var getPlayerFromMatchQuery = function(query, limit) {

	var deferred = Q.defer();

	var fields = [
		'playerData.SteamID',
		'playerData.Name'
	];

	var queryObj = {
		'playerData.Name': {
			'$regex': query,
			'$options': 'i'
		}
	};

	Q(PlayerMatchData.distinct('playerData.Name', queryObj).lean().exec()).then(function(nameData) {
		var outData = {};
		var steamIdPromises = [];

		var nameSubset = nameData.sort(function(a,b) { 
				return ((a.indexOf(query) === 0 && b.indexOf(query) !== 0) || a.length - b.length);
			}).slice(0, parseInt(limit)); // 10 is magical..

		for (var i = 0; i < nameSubset.length; i++) {
			var name = nameSubset[i];

			steamIdPromises.push(getSteamIdsForName(name));
		}

		Q.all(steamIdPromises).then(function(steamIds) {
			var concatArray = [];
			var countPromises = [];

			steamIds.map(function(s) { 
				s.map(function(t) {
					concatArray.push(t);
					countPromises.push(getMatchDataCountForSteamId(t.steamId));
				});
			});

			Q.all(countPromises).then(function(counts) {
				for (var j = 0; j < concatArray.length; j++) {
					var currentUser = concatArray[j];
					currentUser.count = counts[j];
				}

				var outArray = [];

				if (limit !== 0) { // it's a string, go ahead and let type coercion happen
					outArray = concatArray.slice(0, limit);
				} else {
					outArray = concatArray;
				}

				deferred.resolve(outArray);

			}, function(err) {
				deferred.reject(err);
			});
		}, function(err) {
			deferred.reject(err);
		});
	},
	function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

module.exports = {
	createPlayerData: createPlayerData,
	getCombinedMatchSummaryData: getCombinedMatchSummaryData,
	getMatchSummaryDataByUser: getMatchSummaryDataByUser,
	getMatchSummaryDataByMatchId: getMatchSummaryDataByMatchId,
	getMatchDetailsById: getMatchDetailsById,
	getPlayerFromMatchQuery: getPlayerFromMatchQuery
};