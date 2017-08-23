import Mongoose from 'mongoose'

export default Mongoose.model('Friend', {
  steamId: String,
  username: String,
}).schema
