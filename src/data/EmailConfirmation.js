import q from 'q'
import uuid from 'node-uuid'
import EmailConfirmation from '../models/EmailConfirmation.js'
import Mailer from '../utils/mailer.js'
import User from './User.js'

function _get24HoursAgo () {
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(new Date().getHours() - 24)

  return twentyFourHoursAgo
}

function getDateCountForFieldToday (field, val) {
  const deferred = q.defer()

  const twentyFourHoursAgo = _get24HoursAgo()

  const initialMatchQ = {
    '$match': {
      'date': {
        '$elemMatch': {
          '$gte': twentyFourHoursAgo,
        },
      },
    },
  }

  initialMatchQ.$match[field] = val

  EmailConfirmation.aggregate(
    [
      initialMatchQ,
      { '$unwind': '$date' },
      { '$match': {
        'date': { '$gte': twentyFourHoursAgo },

      }},
      {
        '$group': {
          '_id': null,
          'count': { '$sum': 1 },
        },
      },
    ],
    function (err, count) {
      if (err) {
        deferred.reject(err)
      }

      const finalCount = count.length > 0 ? count[0].count : 0

      deferred.resolve(finalCount)
    }
  )

  return deferred.promise
}

function getTryCountToEmailToday (email) {
  return getDateCountForFieldToday('email', email)
}

function getTryCountBySteamIdToday (steamId) {
  return getDateCountForFieldToday('steamId', steamId)
}

function create (email, steamId) {
  const deferred = q.defer()

  const emailConfirmation = new EmailConfirmation()

  emailConfirmation.email = email
  emailConfirmation.steamId = steamId
  emailConfirmation.date = [new Date()]
  emailConfirmation.token = uuid.v4()

  emailConfirmation.save().then(function () {
    deferred.resolve(emailConfirmation.token)
  }, function (err) {
    deferred.reject(err)
  })

  return deferred.promise
}

function getOldestOrNewestEmailSentToday (field, value, oldest) {
  const deferred = q.defer()
  const twentyFourHoursAgo = _get24HoursAgo()

  const initialMatchQ = {
    '$match': {
      'date': {
        '$elemMatch': {
          '$gte': twentyFourHoursAgo,
        },
      },
    },
  }

  initialMatchQ.$match[field] = value

  EmailConfirmation.aggregate(
    [
      initialMatchQ,
      { '$unwind': '$date' },
      { '$sort': { 'date': oldest ? 1 : -1 } },
      { '$limit': 1 },
    ],
    function (err, data) {
      if (err) {
        deferred.reject(err)
      }

      deferred.resolve(data[0])
    }
  )

  return deferred.promise
}

function getOldestEmailSentTodayByUser (steamId) {
  return getOldestOrNewestEmailSentToday('steamId', steamId, true)
}

function getOldestEmailSentToday (email) {
  return getOldestOrNewestEmailSentToday('email', email, true)
}

function getMostRecentEmailSentToday (email) {
  return getOldestOrNewestEmailSentToday('email', email, false)
}

function updateTryDate (email, steamId) {
  const deferred = q.defer()

  EmailConfirmation.findOneAndUpdate(
    {
      email: email,
      steamId: steamId,
    },
    {
      $push: { 'date': new Date() },
    }
  ).then(function (doc) {
    deferred.resolve(doc.token)
  }, function (err) {
    deferred.reject(err)
  })

  return deferred.promise
}

function getTryForEmailSteamIdCombo (email, steamId) {
  const deferred = q.defer()

  q(EmailConfirmation.findOne(
    {
      steamId: steamId,
      email: email,
    }
  ).lean().exec()).then(function (count) {
    deferred.resolve(count)
  }, function (err) {
    deferred.rejeect(err)
  })

  return deferred.promise
}

function sendConfirmationEmail (email, userName, token) {
  const subject = userName + ', please confirm your email address with Operation Breakdown'
  const style = [
    'background-color: #374146',
    'padding: 3em 0',
    'text-align: center',
    'color: rgba(255, 255, 255, 0.5)',
    'margin-top: 5em'].join(';')
  const message =
`<link href="https://fonts.googleapis.com/css?family=Raleway" rel="stylesheet" type="text/css">
<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" type="text/css">
<div style="text-align:center;padding: 3em 0px;background-color: #374146;">
<img src="http://www.operation-breakdown.com/assets/images/opbreakdownlogo-horizontal.png"/>
</div>
<h1 style="font-family: Raleway, Helvetica, Tahoma, Sans-serif;">
  Hello ${userName},
</h1>
<div style="font-family: Open Sans, Arial, Sans-serif;">
<p>Please confirm your email address with Operation Breakdown.</p>
<p><a href="http://www.operation-breakdown.com/confirmEmail?token=${token}">Click here to confirm</a>.
If the link doesn't work, paste the following link in to your browser:</p>
<p>http://www.operation-breakdown.com/confirmEmail?token=${token}</p>
<p><em>If you didn't sign up, you can safely ignore this email, we're sorry for
the inconvenience.</em></p>
<div style="${style}">
<p><a style="color: #54606d;" href="mailto:contact@operation-breakdown.com">
Contact Us</a> | <a style="color: #54606d;" href="http://www.operation-breakdown.com/privacy">Privacy Policy</a></p>
<p style="font-size: 0.7em;">&copy; 2016 Fusorsoft, LLC.
Operation Breakdown is not associated with Valve Corp.</p></div></div>`

  Mailer.sendEmail(email, subject, message)
}

export function confirmEmail (token) {
  const deferred = q.defer()

  const query = {
    'token': token,
  }

  q(EmailConfirmation.findOne(query).exec()).then(function (confirmation) {
    if (!confirmation) {
      deferred.reject('Bad token')
    }

    User.setEmailAddress(confirmation.steamId, confirmation.email)
      .then(function () {
        confirmation.remove()
        deferred.resolve()
      })
  }, function (err) {
    deferred.reject(err)
  })

  return deferred.promise
}

export function setConfirmation (email, steamId, userName) {
  const deferred = q.defer()

  // get all try count by current steamId..
  // and all tries to a given email.

  if (!email || !steamId) {
    // empty values falsy, require both to be present
    deferred.reject({error: 'email and steam id required'})
    return deferred.promise
  }

  q.all(
    [
      getTryCountBySteamIdToday(steamId),
      getTryCountToEmailToday(email),
      getTryForEmailSteamIdCombo(email, steamId),
      getMostRecentEmailSentToday(email),
      getOldestEmailSentToday(email),
      getOldestEmailSentTodayByUser(steamId),
    ]).then(function (counts) {
    const countForSteamId = counts[0]
    const countForEmail = counts[1]
    const tryForCombo = counts[2]
    const newestEmail = counts[3]
    const oldestEmail = counts[4]

    const error = []

    const inTheLast3Mins =
      (new Date().getTime() - newestEmail.date.getTime()) / 60000 < 3
    if (newestEmail && inTheLast3Mins) {
      // "if the most recent try to this email was in the last 3 minutes"
      error.push({
        message: 'Too soon to retry',
        // three minutes from now
        resolvesAt: new Date(newestEmail.date.getTime() + 180000),
      })
    }

    const oneDayFromNow =
      new Date(new Date().setDate(oldestEmail.date.getDate() + 1))

    if (countForEmail > 5) {
      error.push({
        message: 'Too many tries to this email',
        // 24 hours from the oldest one sent in the last 24 hours
        resolvesAt: oneDayFromNow,
      })
    }

    if (countForSteamId > 5) {
      error.push({
        message: 'Too many tries for this user',
        resolvesAt: oneDayFromNow,
      })
    }

    if (error.length > 0) {
      deferred.reject(error)
      return deferred.promise
    }

    if (tryForCombo !== null) {
      // add current time
      updateTryDate(email, steamId).then(function (token) {
        sendConfirmationEmail(email, userName, token)
        deferred.resolve('updated')
      }, function (err) {
        deferred.reject(err)
      })
    } else {
      // add new...

      create(email, steamId).then(function (token) {
        sendConfirmationEmail(email, userName, token)
        deferred.resolve('created')
      }, function (err) {
        deferred.reject(err)
      })
    }
  })

  return deferred.promise
}
