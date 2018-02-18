const Mongoose = require('mongoose')

module.exports = Mongoose.model('Friend', {
  steamId: String,
  username: String,
}).schema
