import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  SteamID: String,
}, {
  strict: false,
})

module.exports = mongoose.model('PlayerData', schema)
