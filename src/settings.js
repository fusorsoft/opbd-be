module.exports = function () {
  return {
    APP_PORT: process.env.APP_PORT,
    MONGODB_CONNECTION_STRING: process.env.MONGODB_CONNECTION_STRING,
    APP_URL: process.env.APP_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    STEAM_API_KEY: process.env.STEAM_API_KEY,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_SERVER: process.env.EMAIL_SERVER,
  }
}
