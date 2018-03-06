const express = require('express')
const router = express.Router() // eslint-disable-line

module.exports = function (passport, auth) {
  router.get('/Logout', (req, res) => {
    // allow logout on GET because why not
    req.logOut()
    req.session.destroy()
    res.redirect('/')
  })

  // steam/openID
  router.get('/Login/Steam', passport.authenticate('steam'), (req, res) => {
    // The request will be redirected to Steam for authentication, so
    // this function will not be called.
  })

  router.get('/Login/Steam/Return', function (req, res, next) {
    passport.authenticate('steam', function (err, user, info) {
      // failureRedirect: '/sign'
      var redirectUrl = '/User/' + user.steamID

      if (err) { return next(err) }
      if (!user) { return res.redirect('/signin') }

      if (req.session.redirectUrl) {
        redirectUrl = req.session.redirectUrl
        req.session.redirectUrl = null
      }

      req.logIn(user, function (err) {
        if (err) { return next(err) }
      })

      res.redirect(redirectUrl)
    })(req, res, next)
  })

  router.get('/:userid/Profile', auth.isAuthenticated, (req, res) => {
    var userid = req.params.userid

    res.render('profile', {
      title: 'Profile',
      user: req.user,
      userid: userid,
    })
  })

  router.get('/:userid', (req, res) => {
    var userid = req.params.userid
    req.session.lastVisit = new Date()
    res.render('matchData', {
      title: 'Match Data',
      user: req.user,
      userid: userid,
    })
  })

  return router
}
