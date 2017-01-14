module.exports = {
  SECRET_TOKEN: '',
  HTTP_IP: process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1",
  HTTP_PORT: process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  DB_CONNECTION_STRING: process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME || process.env.AWS_MONGO_DB_URL || "mongodb://localhost/notinphilly",
  FACEBOOK_APP_ID: process.env.FACEBOOK_ID,
  FACEBOOK_SECRET: process.env.FACEBOOK_APP_SECRET,
  FACEBOOK_NAMESPACE: process.env.FACEBOOK_APP_NAMESPACE,
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL
};
