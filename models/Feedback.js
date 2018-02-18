const mongoose = require('mongoose')
const Schema = mongoose.Schema
const User = mongoose.model('User')

const userSchema = User.schema

const feedbackSchema = new Schema({
  submitter: [userSchema],
  id: String,
  date: Date,
  subject: String,
  message: String,
  url: String,
})

feedbackSchema.add({replies: [feedbackSchema]})

module.exports = mongoose.model('Feedback', feedbackSchema)
