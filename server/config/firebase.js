// server-render-kflight/server/config/firebase.js

const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require("./KFOTPFirebase.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase App Initialized:", admin.apps.length);

}

module.exports = admin;
