const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const EmailConfirmationSchema = new Schema({
  email: String,
  token: String,
  date: [Date],
  steamId: String,
})

module.exports = Mongoose.model('EmailConfirmation', EmailConfirmationSchema)
