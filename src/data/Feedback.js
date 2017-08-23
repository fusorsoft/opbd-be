import uuid from 'node-uuid'
import Feedback from '../models/Feedback.js'

const sendFeedback = function (user, subject, message, url) {
  const feedback = new Feedback()

  feedback.id = uuid.v4() // generate a new guid
  feedback.submitter = user
  feedback.date = Date.now()
  feedback.subject = subject
  feedback.message = message
  feedback.url = url

  return feedback.save()
}

export default {
  sendFeedback: sendFeedback,
}
