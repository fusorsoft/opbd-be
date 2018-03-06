const express = require('express')
const q = require('q')
const DataTask = require('../../../data/DataTask.js')
const MatchData = require('../../../data/MatchData.js')

const router = express.Router() // eslint-disable-line

module.exports = function (passport, auth) {
  const createAddPlayerDataTaskAndRespond = function (userId, res) {
    const deferred = q.defer()

    DataTask.create(userId, 'Starting')
      .then(function (task) {
        res.status(202).json({
          taskUrl: '/api/tasks/' + task.task,
        }).end()

        const taskId = task.Id
        deferred.resolve(taskId)
      }, function () {
        res.status(500).end()
      })

    return deferred.promise
  }

  const addPlayerData = function (req, res, data, userId) {
    createAddPlayerDataTaskAndRespond(userId, res)
      .then(function (newTaskId) {
        return MatchData.createPlayerData(data, userId)
      })
      .then(function () {
        // success, update task
        console.log('success')
      }, function () {
        // fail
        console.log('fail')
      })
  }

  router.get('/summary/:type/:id', (req, res) => {
    const queryId = req.params.id
    const queryField = req.params.type

    if (queryField !== 'user' && queryField !== 'match') {
      res.status(400).json({
        message: 'Invalid query type ' + queryField,
      }).end()
    }

    if (req.query.with) {
      MatchData.getCombinedMatchSummaryData(queryId, req.query.with)
        .then(function (intersection) {
          res.status(200).json(intersection).end()
        }, function (err) {
          res.status(500).json({
            error: err,
          }).end()
        })
    } else {
      var op = null

      if (queryField === 'user') {
        op = MatchData.getMatchSummaryDataByUser
      } else {
        op = MatchData.getMatchSummaryDataByMatchId
      }

      op(queryId).then(function (data) {
        // console.log('success: ' + query);
        res.status(200).json(data).end()
      }, function (err) {
        console.log('err: ' + err)
        res.status(500).end()
      })
    }
  })

  router.get('/details/:playerMatchId', (req, res) => {
    MatchData.getMatchDetailsById(req.params.playerMatchId)
      .then(function (data) {
        res.status(200).json(data).end()
      }, function (err) {
        console.log('err: ' + err)
        res.status(500).end()
      })
  })

  router.get('/players', (req, res) => {
    const query = req.query.query
    const limit = req.query.limit

    if (!query || !limit) {
      res.status(400).json({'message': 'Missing parameter'}).end()
      return
    }

    MatchData.getPlayerFromMatchQuery(query, limit).then(function (data) {
      res.status(200).json(data).end()
    },
    function () {
      res.status(500).json().end()
    })
  })

  router.post('/', auth.isAuthenticated, (req, res) => {
    addPlayerData(req, res, req.body, req.user.steamID)
  })

  router.post('/fromClient/', auth.apiTokenValid, (req, res) => {
    addPlayerData(req, res, req.body, req.get('OP-User-Id'))
  })

  return router
}
