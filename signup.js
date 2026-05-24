function showMessage(id, text) {
  var el = document.getElementById(id);
  el.textContent = text;
  el.style.display = 'block';
}

function hideMessages() {
  document.getElementById('errorMsg').style.display = 'none';
  document.getElementById('successMsg').style.display = 'none';
}

document.getElementById('signupBtn').addEventListener('click', function () {
  hideMessages();

  var fullname = document.getElementById('fullname').value.trim();
  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value.trim();
  var confirmPassword = document.getElementById('confirmPassword').value.trim();

  if (!fullname || !username || !password || !confirmPassword) {
    showMessage('errorMsg', 'Sab fields bharo!');
    return;
  }

  if (password.length < 6) {
    showMessage('errorMsg', 'Password 6 characters ka hona chahiye!');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('errorMsg', 'Passwords match nahi!');
    return;
  }

  var db = firebase.database();

  db.ref('users/' + username)
    .once('value')
    .then(function (snapshot) {
      if (snapshot.exists()) {
        showMessage('errorMsg', 'Username pehle se hai!');
        return;
      }

      return db.ref('users/' + username).set({
        fullname: fullname,
        username: username,
        password: password,
        joinDate: new Date().toLocaleDateString(),
        createdAt: Date.now()
      });
    })
    .then(function (result) {
      if (result === undefined) return;
      showMessage('successMsg', 'Account ban gaya! Redirecting...');
      setTimeout(function () {
        window.location.href = 'login.html';
      }, 1500);
    })
    .catch(function (err) {
      showMessage('errorMsg', 'Error: ' + err.message);
    });
});
