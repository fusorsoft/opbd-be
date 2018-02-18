const express = require('express')
const Feedback = require('../../../data/Feedback.js')
const router = express.Router() // eslint-disable-line

module.exports = function (passport, auth) {
  router.post('/feedback', auth.isAuthenticated, function (req, res) {
    Feedback.sendFeedback(
      req.user,
      req.body.subject,
      req.body.message,
      req.body.url)
      .then(() => {
        res.status(201).end()
      }, function (err) {
        res.status(500).send(err).end()
      })
  })

  return router
}
