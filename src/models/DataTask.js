import mongoose from 'mongoose'

export default mongoose.model('DataTask', {
  id: String,
  initiator: String,
  status: String,
  start: Date,
  complete: Date,
})
