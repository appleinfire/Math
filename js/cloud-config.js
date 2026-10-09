// Firebase project used for family sync. These values identify the project; they are not secrets.
// Access to data is controlled by firestore.rules (a family's data is reachable only with its code + PIN).
// Set MQ.CLOUD_CONFIG = null to run the app without any cloud sync.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  MQ.CLOUD_CONFIG = {
    apiKey: 'AIzaSyAn0Pl1zrsT_OWZSfzgjnFHjAv4RTZowgI',
    authDomain: 'math-accc7.firebaseapp.com',
    projectId: 'math-accc7',
    storageBucket: 'math-accc7.firebasestorage.app',
    messagingSenderId: '932850319929',
    appId: '1:932850319929:web:0e1393157b84030f0b83e8',
  };
})();
