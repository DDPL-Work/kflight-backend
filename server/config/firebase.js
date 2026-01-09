// server-render-kflight/server/config/firebase.js

// const admin = require("firebase-admin");
// const path = require("path");

// const serviceAccount = require("./KFOTPFirebase.json");

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   console.log("🔥 Firebase App Initialized:", admin.apps.length);

// }

// module.exports = admin;

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  console.log("🔥 Firebase App Initialized");
}

module.exports = admin;
