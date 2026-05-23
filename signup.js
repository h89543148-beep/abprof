document.getElementById('signupBtn').addEventListener('click', function() {

  var fullname = document.getElementById('fullname').value.trim();
  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value.trim();
  var confirmPassword = document.getElementById('confirmPassword').value.trim();

  if (!fullname || !username || !password || !confirmPassword) {
    document.getElementById('errorMsg').textContent = 'Sab fields bharo!';
    document.getElementById('errorMsg').style.display = 'block';
    return;
  }

  if (password.length < 6) {
    document.getElementById('errorMsg').textContent = 'Password 6 characters ka hona chahiye!';
    document.getElementById('errorMsg').style.display = 'block';
    return;
  }

  if (password !== confirmPassword) {
    document.getElementById('errorMsg').textContent = 'Passwords match nahi!';
    document.getElementById('errorMsg').style.display = 'block';
    return;
  }

  var db = firebase.database();
  db.ref('users/' + username).once('value').then(function(snapshot) {
    if (snapshot.exists()) {
      document.getElementById('errorMsg').textContent = 'Username pehle se hai!';
      document.getElementById('errorMsg').style.display = 'block';
    } else {
      db.ref('users/' + username).set({
        fullname: fullname,
        username: username,
        password: password,
        joinDate: new Date().toLocaleDateString()
      }).then(function() {
        document.getElementById('successMsg').textContent = 'Account ban gaya!';
        document.getElementById('successMsg').style.display = 'block';
        setTimeout(function() {
          window.location.href = '../login/login.html';
        }, 2000);
      });
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

var signupAttempts = 0;

function rateLimitSignup() {
    var now = Date.now();
    if (signupAttempts >= 3) {
        alert('Too many signup attempts! Try again later.');
        return false;
    }
    signupAttempts++;
    return true;
}

// ========== DEBOUNCE YOUR SIGNUP FUNCTION ==========
var signupDebounced = debounce(function() {
    if (!rateLimitSignup()) return;
    
    var username = document.getElementById('username').value;
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    
    // Your existing signup code here
}, 1000);

document.getElementById('signupBtn').onclick = signupDebounced;
firebase.auth().signInWithEmailAndPassword(email, password)
  .then(userCredential => {
    var user = {
      username: username,   // your existing field
      email: email,
      uid: userCredential.user.uid   // ← ADD THIS
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
  });