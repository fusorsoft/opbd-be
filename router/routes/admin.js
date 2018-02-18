const express = require('express')
const router = express.Router() // eslint-disable-line

module.exports = function (passport, auth) {
  router.get('/', auth.isAuthenticated, auth.isAuthorized('admin'), (req, res) => {
    res.render('admin', {
      title: 'Admin',
      user: req.user,
    })
  })

  return router
}
