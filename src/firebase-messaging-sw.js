importScripts('https://www.gstatic.com/firebasejs/8.4.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.4.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyB9Zq6Ig7VOh0MbmlC3N1sGkI2bB_Rz5jc",
  authDomain: "ttl-tamtriluc.firebaseapp.com",
  projectId: "ttl-tamtriluc",
  storageBucket: "ttl-tamtriluc.firebasestorage.app",
  messagingSenderId: "430930577351",
  appId: "1:430930577351:web:34936c74fb1b6b14013be2",
  measurementId: "G-E2J5M1SVRJ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  return payload;
});
