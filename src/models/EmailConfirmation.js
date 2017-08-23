import Mongoose from 'mongoose'
const Schema = Mongoose.Schema

const EmailConfirmationSchema = new Schema({
  email: String,
  token: String,
  date: [Date],
  steamId: String,
})

export default Mongoose.model('EmailConfirmation', EmailConfirmationSchema)
