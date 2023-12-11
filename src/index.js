const express = require('express')
const passport = require('passport')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash')
const _settings = require('./settings')
const passportInit = require('./setup/passport/init')
const routes = require('./router/routes')
const path = require('path')
const ejs = require('ejs')
const engine = require('ejs-locals')
const MongoStore = require('connect-mongo')
const os = require('os')

const settings = _settings()

mongoose.Promise = Promise

const app = express()

app.use(bodyParser.urlencoded({
  extended: false,
  limit: '4mb',
}))

app.use(bodyParser.json({
  limit: '4mb',
}))

mongoose.connect(settings.MONGODB_CONNECTION_STRING)
  .then(() => {
    console.log('Connected to db @ ' + settings.MONGODB_CONNECTION_STRING)
    app.use(session({
      secret: settings.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: settings.MONGODB_CONNECTION_STRING,
      }),
    }))

    app.use(passport.initialize())
    app.use(passport.session())

    app.use(flash())

    passportInit(passport)
    routes(app, passport)
  })
  .catch(err => {
    console.error('error connecting to mongo @ ', settings.MONGODB_CONNECTION_STRING)
    console.error(err)
  })

app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'ejs')
app.engine('html', ejs.renderFile)
app.engine('ejs', engine)

const server = app.listen(settings.APP_PORT, function () {
  const hostname = os.hostname()
  const host = server.address().address
  const port = server.address().port

  console.log('Operation Breakdown listening at http://%s:%s (%s)', host, port, hostname)
})
