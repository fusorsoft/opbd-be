import UserModel from '../models/User'

const isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  req.session.redirectUrl = req.originalUrl

  res.status(401).redirect('/signin')
}

const isAuthorized = function (role) {
  return function (req, res, next) {
    UserModel.findOne({
      'steamID': req.user.steamID,
    }, (err, user) => {
      if (err) { res.status(500).end() }
      if (user && user.roles.indexOf(role) > -1) {
        return next()
      } else {
        if (role === 'user') {
          res.status(403).redirect('/beta')
        } else {
          res.status(403).end()
        }
      }
    })
  }
}

const apiIsAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.status('401').send({
    'Message': 'Unauthorized',
  })
}

const apiTokenValid = function (req, res, next) {
  const id = req.get('OP-User-Id')
  const apiToken = req.get('OP-Api-Token')

  UserModel.findOne({
    'steamID': id,
    'apiToken': apiToken,
  }, function (err, user) {
    if (err) { res.status(500).end() }
    if (user) {
      return next()
    } else {
      res.status(401).end()
    }
  })
}

export default {
  isAuthenticated,
  apiIsAuthenticated,
  apiTokenValid,
  isAuthorized,
}
