// ================================
// AB-PROF - FIREBASE CONFIG
// ================================

// Firebase configuration object
var firebaseConfig = {
  apiKey: "AIzaSyD7RwL8kwQ91P1vcPhXnxFNFIDQsWdUfhE",
  authDomain: "ad-hoc-d078c.firebaseapp.com",
  databaseURL: "https://ad-hoc-d078c-default-rtdb.firebaseio.com",
  projectId: "ad-hoc-d078c",
  storageBucket: "ad-hoc-d078c.firebasestorage.app",
  messagingSenderId: "485452494263",
  appId: "1:485452494263:web:edacb32bc6f1ed597a6432"
};

// Initialize Firebase (only once)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized successfully!");
} else if (typeof firebase === 'undefined') {
  console.error("❌ Firebase library not loaded! Check script order.");
}

// ========== USER WINSH STRUCTURE ==========
// Jab user signup kare to default winsh set karo
function initializeUserWinsh(userId) {
  var db = firebase.database();
  db.ref('users/' + userId).set({
    winsh: 100,
    styles: {
      borders: [],
      badges: [],
      themes: [],
      titles: [],
      avatars: []
    },
    equipped: {
      border: null,
      badge: null,
      theme: null,
      title: null,
      avatar: null
    }
  });
}

// Make functions globally available
window.initializeUserWinsh = initializeUserWinsh;