const express = require('express')
const User = require('../../../data/User.js')
const EmailConfirmation = require('../../../data/EmailConfirmation.js')

const router = express.Router() // eslint-disable-line

module.exports = function (passport, auth) {
  router.get('/top', (req, res) => {
    const limit = parseInt(req.query.limit)

    if (!Number.isInteger(limit)) {
      res.status(400).json({
        'error': 'limit must be an integral value',
      }).end()
    }

    User.getTopUsers(limit).then(function (data) {
      res.status(200).json(data).end()
    }, function (err) {
      console.error('Error getting top users', err)
      res.status(500).json({
        'error': 'error retrieving top users',
        'i': err,
      }).end()
    })
  })

  // get friend information for the specified user...
  router.get('/:userid/friends', (req, res) => {
    User.getFriends(req.params.userid)
      .then(function (friendData) {
        res.status(200).json(friendData).end()
      }, function () {
        res.status(500).json({
          'error': 'error retrieving information for user',
        }).end()
      })
  })

  router.get('/:userid', (req, res) => {
    User.getUserInfoByUserId(req.params.userid).then(function (data) {
      if (data === null) {
        res.status(204).end()
      } else {
        res.status(200).json(data).end()
      }
    }, function () {
      res.status(500).json({
        'error': 'error retrieving information for user',
      }).end()
    })
  })

  router.get('/', auth.apiIsAuthenticated, (req, res) => {
    User.getUserInfoByUserId(req.user.steamID).then(function (d) {
      res.status(200).json(d).end()
    }, function () {
      res.status(500).json({
        'error': 'error retrieving information for current user',
      }).end()
    })
  })

  router.post('/:userid/friends', auth.apiIsAuthenticated, (req, res) => {
    if (req.user.steamID !== req.params.userid) {
      res.status(403).json({
        'message': 'cannot add to another user\'s friends list ya dingus',
      }).end()
    } else {
      User.addFriend(req.params.userid, req.body.steamId, req.body.name)
        .then(function (data) {
          res.status(201).json({
            'message': 'friend added',
          }).end()
        }, function (error) {
          if (error.location) {
            res.status(409).set('Location', error.conflictUri).json({
              error: 'Already exists in friends list',
            }).end()
          } else {
            res.status(500).json({
              error: 'Error adding friend',
            }).end()
          }
        })
    }
  })

  router.post('/:userid/email', auth.apiIsAuthenticated, (req, res) => {
    if (req.user.steamID !== req.params.userid) {
      res.status(403).json({
        'message': 'Cannot modify another user\'s email',
      }).end()
    } else {
      EmailConfirmation.setConfirmation(
        req.body.email,
        req.params.userid,
        req.user.username
      ).then(function (outcome) {
        if (outcome === 'updated') {
          res.status(204).end()
        } else if (outcome === 'created') {
          res.status(201).end()
        }
      }, function (err) {
        let status = null

        // check if this is a rate limit error...
        let limitedIndex = -1
        const isLimited = err.some(function (e, index) {
          if (e.message.indexOf('Too many tries') > -1) {
            limitedIndex = index
            return true
          }
        })

        if (isLimited) {
          status = 429
          res.set('Retry-After', err[limitedIndex].resolvesAt)
        } else {
          status = 400
        }
        res.status(status).json(err).end()
      })
    }
  })

  router.post('/:userid/roles', auth.isAuthenticated, auth.isAuthorized('admin'), (req, res) => {
    const userid = req.params.userid
    const roles = req.body.roles
    User.updateRoles(userid, roles).then(function () {
      res.status(204).end()
    }, function (err) {
      let status = 500

      if (err.message && err.message.indexOf('unknown role') > -1) {
        status = 400
      }
      res.status(status).json(err).end()
    })
  })

  router.delete('/:userid/friends/:friendId', auth.apiIsAuthenticated, (req, res) => {
    if (req.user.steamID !== req.params.userid) {
      res.status(401).json({
        'message': 'cannot remove someone else\'s friends',
      }).end()
    } else {
      User.removeFriend(req.params.userid, req.params.friendId)
        .then(function () {
          res.status(204).end()
        }, function () {
          res.status(500).end()
        })
    }
  })

  return router
}
