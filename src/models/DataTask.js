const mongoose = require('mongoose')

module.exports = mongoose.model('DataTask', {
  id: String,
  initiator: String,
  status: String,
  start: Date,
  complete: Date,
})
