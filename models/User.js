const mongoose = require('mongoose')
const FriendSchema = require('./Friend')

const Schema = mongoose.Schema

const userSchema = new Schema({
  username: String,
  email: String,
  contactOnRelese: Boolean,
  steamID: String,
  apiToken: String,
  openId: String,
  friends: [FriendSchema],
  avatar: String,
  avatarMedium: String,
  avatarFull: String,
  friendlyUrl: String,
  roles: [String],
})

module.exports = mongoose.model('User', userSchema)
