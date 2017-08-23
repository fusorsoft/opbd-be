import mongoose from 'mongoose'
import Friend from '../models/Friend.js'
import q from 'q'

const User = mongoose.model('User')
const MatchData = mongoose.model('PlayerMatchData')

function getUsers () {
  return q(User.aggregate([
    {
      $lookup: {
        from: 'sessions',
        localField: '_id',
        foreignField: 'passport.user',
        as: 'session',
      },
    },
    {
      $project: {
        'username': true,
        'steamID': true,
        'avatar': true,
        'roles': true,
        'email': true,
        'session.lastAccess': true,
      },
    },
  ]).exec())
}

function getUserInfoByUserId (userId) {
  const deferred = q.defer()

  const fields = [
    'steamID',
    'username',
    'avatar',
    'avatarMedium',
    'avatarFull',
  ].join(' ')

  q.all([
    q(User.findOne({ steamID: userId }, fields).lean().exec()),
    q(MatchData.findOne({'playerData.SteamID': userId}, 'playerData.Name')
      .sort({created_at: -1}).lean().exec()),
  ]).then((data) => {
    if (data[0]) {
      deferred.resolve(data[0])
    } else {
      deferred.resolve({
        username: data[1].playerData[0].Name,
        steamID: userId,
      })
    }

    deferred.resolve(data[0])
  })

  return deferred.promise
}

function getFriends (userId) {
  const deferred = q.defer()

  q(User.findOne({'steamID': userId}, 'username friends').lean().exec())
    .then((data) => {
      const friendData = data.friends.map(f => {
        return {
          steamID: f.steamId,
          username: f.username,
        }
      })

      deferred.resolve({
        username: data.username,
        friends: friendData,
      })
    }, function (err) {
      deferred.reject(err)
    })

  return deferred.promise
}

function addFriend (userId, friendId, friendName) {
  const deferred = q.defer()

  User.findOne({
    'steamID': userId,
  }, (err, user) => {
    if (err) {
      deferred.reject(err)
    }

    const friend = new Friend()
    friend.steamId = friendId
    friend.username = friendName

    if (user.friends.find(f => f.steamId === userId)) {
      const conflictUri = 'users/' + userId + '/friends/' + friendId

      deferred.reject({
        'conflictUri': conflictUri,
        'message': 'Already exists in friends list',
      })
    }

    user.friends.push(friend)

    user.save(err => {
      if (err) {
        deferred.reject({'message': 'unable to add friend'})
      }

      deferred.resolve()
    })
  })

  return deferred.promise
}

function removeFriend (userId, friendId) {
  return q(User.findOneAndUpdate(
    { 'steamID': userId },
    { $pull: { 'friends': { 'steamId': friendId } } }
  ).exec())
}

function setEmailAddress (steamId, email) {
  return q(User.findOneAndUpdate(
    {
      'steamID': steamId,
    },
    {
      'email': email,
      'contactOnRelease': true,
    }
  ).exec())
}

function updateRoles (steamId, roles) {
  const deferred = q.defer()
  const allowedRoles = ['admin', 'user', 'visitor']

  for (let i = 0, j = roles.length; i < j; i++) {
    if (allowedRoles.indexOf(roles[i]) === -1) {
      deferred.reject({'message': 'unknown role: ' + roles[i]})
    }
  }

  q(User.findOne(
    {
      'steamID': steamId,
    }
  ).exec()).then(user => {
    user.roles = roles

    return q(user.save().exec())
  }, err => {
    deferred.reject(err)
  })
  deferred.resolve('ok')

  return deferred.promise
}

function getTopUsers (limit) {
  return q(MatchData.aggregate([
    {
      $group: {
        _id: '$playerData.SteamID',
        count: { $sum: 1 },
        name: { $last: '$playerData.Name' },
      },
    },
    {
      $sort: { 'count': -1 },
    },
    {
      $limit: limit,
    },
    {
      $unwind: '$_id',
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'steamID',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        'name': true,
        'count': true,
        'user.avatar': true,
        'user.avatarFull': true,
        'user.avatarMedium': true,
        'user.username': true,
      },
    },
  ]).exec())
}

export default {
  getUsers,
  getUserInfoByUserId,
  getFriends,
  addFriend,
  removeFriend,
  setEmailAddress,
  updateRoles,
  getTopUsers,
}
