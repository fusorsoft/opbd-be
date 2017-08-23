import express from 'express'
import User from '../../../data/User.js'

const router = express.Router() // eslint-disable-line

export default function (passport, auth) {
  router.get('/users', auth.isAuthenticated, auth.isAuthorized('admin'), (req, res) => {
    User.getUsers().then(function (data) {
      res.status(200).send(data).end()
    }, function (err) {
      res.status(500).send(err).end()
    })
  })

  return router
}
