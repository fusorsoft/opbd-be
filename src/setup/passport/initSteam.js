import passportSteam from 'passport-steam'
import UserModel from '../../models/User'
import settings from '../../settings'
import uuid from 'node-uuid'

const SteamStrategy = passportSteam.Strategy

export default function (passport) {
  passport.use(
    new SteamStrategy({
      returnURL: settings.APP_URL + '/User/Login/Steam/Return',
      realm: settings.APP_URL,
      apiKey: settings.STEAM_API_KEY,
    },
    function (identifier, profile, done) {
      UserModel.findOne({
        openId: identifier,
      }, function (err, user) {
        if (err) {
          console.log('Error in Steam login: ' + err)
          return done(err)
        }

        var p = profile._json

        if (user) {
          /* update user properties... */

          user.username = p.personaname
          user.avatar = p.avatar
          user.avatarMedium = p.avatarmedium
          user.avatarFull = p.avatarfull

          user.save()

          return done(null, user)
        }

        // new user...
        var newUser = new UserModel()

        // set the user's local credentials

        newUser.username = p.personaname
        newUser.openId = identifier
        newUser.email = ''
        newUser.steamID = p.steamid
        newUser.apiToken = uuid.v4()
        newUser.avatar = p.avatar
        newUser.avatarMedium = p.avatarmedium
        newUser.avatarFull = p.avatarfull
        newUser.roles.push('visitor')

        // save the user
        newUser.save(function (err) {
          if (err) {
            console.log('Error in Saving user: ' + err)
            throw err
          }
          console.log('User Registration succesful')
          return done(null, newUser)
        })
      })
    }
    ))
}

// profile:
/*
{ provider: 'steam',
  _json:
   { steamid: '11111111111111111111',
     communityvisibilitystate: 3,
     profilestate: 1,
     personaname: 'Steam Name',
     lastlogoff: 1459946399,
     profileurl: 'http://steamcommunity.com/id/whatever/',
     avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/17/17bb48c798f5bfa76ed8347bf6dccc3fde37415f.jpg',
     avatarmedium: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/17/17bb48c798f5bfa76ed8347bf6dccc3fde37415f_medium.jpg',
     avatarfull: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/17/17bb48c798f5bfa76ed8347bf6dccc3fde37415f_full.jpg',
     personastate: 3,
     primaryclanid: '1111111111111111',
     timecreated: 1105499680,
     personastateflags: 0 },
  id: '1111111111111111',
  displayName: 'Steam Name',
  photos:
   [ { value: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/17/17bb48c798f5bfa76ed8347bf6dccc3fde37415f.jpg' },
     { value: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/17/17bb48c798f5bfa76ed8347bf6dccc3fde37415f_medium.jpg' },
     { value: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/17/17bb48c798f5bfa76ed8347bf6dccc3fde37415f_full.jpg' } ] }
*/
