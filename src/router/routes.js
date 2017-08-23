// this first import is simply to ensure that the schema is registered with
// mongoose before something tries to access it...
import PlayerMatchData from '../models/PlayerMatchData' // eslint-disable-line
import auth from './auth'
import emailConfirmation from '../data/EmailConfirmation.js'
import userRoutes from './routes/user'
import adminRoutes from './routes/admin'
import matchDataApiRoutes from './routes/api/matchdata'
import usersApiRoutes from './routes/api/users'
import breakdownApiRoutes from './routes/api/breakdown'
import adminApiRoutes from './routes/api/admin'

export default function (app, passport) {
  app.use('/User', userRoutes(passport, auth))
  app.use('/Admin', adminRoutes(passport, auth))
  app.use('/_api/matchdata', matchDataApiRoutes(passport, auth))
  app.use('/_api/users', usersApiRoutes(passport, auth))
  app.use('/_api/breakdown', breakdownApiRoutes(passport, auth))
  app.use('/_api/admin', adminApiRoutes(passport, auth))

  app.get('/', (req, res) => {
    res.render('index', {
      title: 'Home',
      user: req.user,
    })
  })

  app.get('/about', (req, res) => {
    res.render('about', {
      title: 'About Operation Breakdown',
      user: req.user,
    })
  })

  app.get('/privacy', (req, res) => {
    res.render('privacy', {
      title: 'Privacy Policy',
      user: req.user,
    })
  })

  app.get('/news', (req, res) => {
    res.render('news', {
      title: 'News',
      user: req.user,
    })
  })

  app.get('/client', auth.isAuthenticated, auth.isAuthorized('user'), (req, res) => {
    res.render('client', {
      title: 'Client',
      user: req.user,
    })
  })

  app.get('/credits', (req, res) => {
    res.render('credits', {
      title: 'Credits',
      user: req.user,
    })
  })

  app.get('/donate', (req, res) => {
    res.render('donate', {
      title: 'Donate',
      user: req.user,
    })
  })

  app.get('/signin', (req, res) => {
    res.render('signin', {
      title: 'Sign In',
      user: req.user,
    })
  })

  app.get('/beta', (req, res) => {
    res.render('beta', {
      title: 'Closed Beta',
      user: req.user,
    })
  })

  app.get('/emailConfirmed', (req, res) => {
    res.render('emailConfirmed', {
      title: 'Email Confirmed',
      user: req.user,
    })
  })

  app.get('/confirmEmail', (req, res) => {
    if (!req.query.token) {
      res.status(400).json({message: 'Bad Token'}).end()
    }

    emailConfirmation.confirmEmail(req.query.token).then(function () {
      res.status(204).redirect('/emailConfirmed')
    }, function (err) {
      if (err === 'Bad token') {
        res.status(400).redirect('/error')
      } else {
        res.status(500).redirect('/error')
      }
    })
  })
}
