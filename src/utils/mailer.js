const Q = require('q')
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const settings = require('../settings')

module.exports = function sendEmail (to, subject, message) {
  var deferred = Q.defer()

  var transport = nodemailer.createTransport(smtpTransport({
    host: settings.EMAIL_SERVER,
    port: 465,
    secureConnection: true,
    auth: {
      user: settings.EMAIL_USER,
      pass: settings.EMAIL_PASS,
    },
  }))

  var mail = {
    from: settings.EMAIL_USER,
    to: to,
    subject: subject,
    html: message,
  }

  transport.sendMail(mail, function (err, resp) {
    if (err) {
      deferred.reject(err)
      return
    }

    transport.close()
    deferred.resolve()
  })

  return deferred.promise
}
