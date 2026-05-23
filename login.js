document.getElementById('loginBtn').addEventListener('click', function() {

  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value.trim();

  if (!username || !password) {
    document.getElementById('errorMsg').textContent = 'Sab bharo!';
    document.getElementById('errorMsg').style.display = 'block';
    return;
  }

  var db = firebase.database();
  db.ref('users/' + username).once('value').then(function(snapshot) {
    if (!snapshot.exists()) {
      document.getElementById('errorMsg').textContent = 'Username galat hai!';
      document.getElementById('errorMsg').style.display = 'block';
    } else {
      var user = snapshot.val();
      if (user.password !== password) {
        document.getElementById('errorMsg').textContent = 'Password galat hai!';
        document.getElementById('errorMsg').style.display = 'block';
      } else {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = '../Index.html';
      }
    }
  }).catch(function(err) {
    document.getElementById('errorMsg').textContent = 'Error: ' + err.message;
    document.getElementById('errorMsg').style.display = 'block';
  });

});// ========== ADD AT TOP ==========
function debounce(func, wait) {
    var timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}

var loginAttempts = 0;
var lastAttemptTime = 0;

function rateLimitLogin() {
    var now = Date.now();
    if (now - lastAttemptTime < 5000 && loginAttempts >= 3) {
        alert('Too many attempts! Wait 5 seconds.');
        return false;
    }
    if (now - lastAttemptTime > 5000) {
        loginAttempts = 0;
    }
    loginAttempts++;
    lastAttemptTime = now;
    return true;
}

// ========== DEBOUNCE YOUR LOGIN FUNCTION ==========
var loginDebounced = debounce(function() {
    if (!rateLimitLogin()) return;
    
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    
    // Your existing login code here
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            // existing success code
        })
        .catch(function(error) {
            // existing error code
        });
}, 1000);

// Change onclick
document.getElementById('loginBtn').onclick = loginDebounced;
firebase.auth().signInWithEmailAndPassword(email, password)
  .then(userCredential => {
    var user = {
      username: username,   // your existing field
      email: email,
      uid: userCredential.user.uid   // ← ADD THIS
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
  });