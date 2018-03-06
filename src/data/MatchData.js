const uuid = require('node-uuid')
const q = require('q')
const BreakdownMetadata = require('../models/BreakdownMetadata.js')
const PlayerMatchData = require('../models/PlayerMatchData.js')

const matchSummaryFields = [
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
  'playerData.WeaponData.Weapon',
  'playerData.WeaponData.HeadShots',
  'playerData.WeaponData.ShotsFired',
  'playerData.WeaponData.HeadshotKills',
  'playerData.WeaponData.Kills',
  'playerData.WeaponData.ShotsHit',
  'demoFileMetadata.Created',
  'matchMetadata.MapName',
  'breakdownMetadata.breakdownMatchId',
]

const getMatchDetailsById = function (playerMatchId) {
  return PlayerMatchData.findById(playerMatchId).lean().exec()
}

const getMatchSummaryData = function (query) {
  return PlayerMatchData.find(query, matchSummaryFields.join(' ')).lean().exec()
}

const getMatchSummaryDataByUser = function (playerId) {
  const query = { 'playerData.SteamID': playerId }
  return getMatchSummaryData(query)
}

const getMatchSummaryDataByMatchId = function (matchId) {
  const query = { 'breakdownMetadata.breakdownMatchId': matchId }
  return getMatchSummaryData(query)
}

const getCombinedMatchSummaryData = function (player1, player2) {
  const deferred = q.defer()

  const p1Query = { 'playerData.SteamID': player1 }
  const p2Query = { 'playerData.SteamID': player2 }

  q.all([
    PlayerMatchData.find(p1Query, matchSummaryFields.join(' ')).lean().exec(),
    PlayerMatchData.find(
      p2Query,
      'breakdownMetadata.breakdownMatchId playerData.MatchTeam'
    ).lean().exec(),
  ])
    .then((data) => {
      const userMatches = data[0]
      const withMatches = data[1]
      const lookup = {}
      const intersection = []

      withMatches.map((w) => {
        // lookup object's keys will be used to compute intersection, nothing
        // special about 1
        lookup[w.breakdownMetadata.breakdownMatchId] = w.playerData[0].MatchTeam
      })

      for (let userMatch of userMatches) {
        var currentId = userMatch.breakdownMetadata.breakdownMatchId

        var matchWithFriend = {
          friend: player2,
          match: userMatch,
        }

        if (lookup[currentId] &&
            userMatch.playerData[0].MatchTeam === lookup[currentId]) {
          intersection.push(matchWithFriend)
        }
      }
      deferred.resolve(intersection)
    })

  return deferred.promise
}

const getMatchData = function (server, map, fileHash) {
  const query = {
    'matchMetadata.MapName': map,
    'demoFileMetadata.FileHash': fileHash,
    'matchMetadata.ServerName': server,
  }

  return q(PlayerMatchData.find(query).lean().exec())
}

const createPlayerData = function (data, userId) {
  const deferred = q.defer()

  getMatchData(
    data.matchMetadata.ServerName,
    data.matchMetadata.MapName,
    data.demoFileMetadata.FileHash
  ).then(function (existingData) {
    return saveMatchData(existingData, data, userId)
  }).then(function () {
    deferred.resolve()
  })

  return deferred.promise
}

const saveMatchData = function (existingData, data, userId) {
  const newItems = data.playerData
  const thisBreakdownMatchId = uuid.v4()

  const newItemPromises = newItems.map(function (p) {
    // map all submitted player data to an array of promises
    const breakdownMetadata = new BreakdownMetadata({
      submitter: '' + userId,
      corroborators: [],
      breakdownMatchId: thisBreakdownMatchId,
    })

    const playerMatchData = {
      breakdownMetadata: breakdownMetadata,
      matchMetadata: data.matchMetadata,
      demoFileMetadata: data.demoFileMetadata,
      playerData: p,
    }

    const pMatchData = new PlayerMatchData(playerMatchData)

    return q(pMatchData.save())
  })

  return q.all(newItemPromises)
}

const getSteamIdsForName = function (name) {
  // steam allows multiple people to have the same name....
  const deferred = q.defer()

  q(PlayerMatchData.distinct('playerData.SteamID', {'playerData.Name': name}).lean().exec())
    .then(function (data) {
      const names = data.map((d) => {
        return {
          name: name,
          steamId: d,
        }
      })
      deferred.resolve(names)
    }, function (err) {
      deferred.reject(err)
    })

  return deferred.promise
}

const getMatchDataCountForSteamId = function (steamId) {
  return q(PlayerMatchData.count({'playerData.SteamID': steamId}).lean().exec())
}

const getPlayerFromMatchQuery = function (query, limit) {
  const deferred = q.defer()

  const queryObj = {
    'playerData.Name': {
      '$regex': query,
      '$options': 'i',
    },
  }

  q(PlayerMatchData.distinct('playerData.Name', queryObj).lean().exec()).then((nameData) => {
    const nameSubset = nameData.sort(function (a, b) {
      return (a.length - b.length)
    }).slice(0, parseInt(limit)) // 10 is magical..

    const steamIdPromises = nameSubset.map(name => getSteamIdsForName(name))

    q.all(steamIdPromises).then(steamIds => {
      const concatArray = []
      const countPromises = []

      steamIds.forEach((s) => {
        s.forEach((t) => {
          concatArray.push(t)
          countPromises.push(getMatchDataCountForSteamId(t.steamId))
        })
      })

      q.all(countPromises).then(counts => {
        for (let j = 0; j < concatArray.length; j++) {
          const currentUser = concatArray[j]
          currentUser.count = counts[j]
        }

        let outArray

        if (limit !== 0) {
          // it's a string, go ahead and let type coercion happen
          outArray = concatArray.slice(0, limit)
        } else {
          outArray = concatArray
        }

        deferred.resolve(outArray)
      }, function (err) {
        deferred.reject(err)
      })
    }, function (err) {
      deferred.reject(err)
    })
  },
  function (err) {
    deferred.reject(err)
  })

  return deferred.promise
}

module.exports = {
  createPlayerData,
  getCombinedMatchSummaryData,
  getMatchSummaryDataByUser,
  getMatchSummaryDataByMatchId,
  getMatchDetailsById,
  getPlayerFromMatchQuery,
}
