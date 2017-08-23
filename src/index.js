import dotenv from 'dotenv'
import express from 'express'
import passport from 'passport'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import session from 'express-session'
import flash from 'connect-flash'
import _settings from './settings'
import MongoStore from 'express-session-mongo'
import passportInit from 'setup/passport/init'
import routes from 'router/routes'
import 'source-map-support/register'
import path from 'path'
import ejs from 'ejs'
import engine from 'ejs-locals'

dotenv.config({path: 'settings.env'})
const settings = _settings()
console.log(process.env.APP_PORT)

mongoose.Promise = Promise

const app = express()

app.use(bodyParser.urlencoded({
  extended: false,
  limit: '4mb',
}))

app.use(bodyParser.json({
  limit: '4mb',
}))

app.use(session({
  secret: settings.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    ip: settings.MONGODB_IP,
    port: settings.MONGODB_PORT,
    db: settings.MONGODB_DATABASE,
  }),
}))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

passportInit(passport)
routes(app, passport)

// const mongooseConnectionString = 'mongodb://' + settings.MONGODB_IP + ':' + settings.MONGODB_PORT + '/' + settings.MONGODB_DATABASE
// mongoose.connect(mongooseConnectionString)
// console.log('Connected to db @ ' + mongooseConnectionString)
console.log(path.resolve(__dirname, 'views'))
app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'ejs')
app.engine('html', ejs.renderFile)
app.engine('ejs', engine)

const server = app.listen(settings.APP_PORT, function () {
  const host = server.address().address
  const port = server.address().port

  console.log('Operation Breakdown listening at http://%s:%s', host, port)
})
