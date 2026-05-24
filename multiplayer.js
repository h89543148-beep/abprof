var firebaseConfig = {
  apiKey: "AIzaSyD7RwL8kwQ91P1vcPhXnxFNFIDQsWdUfhE",
  authDomain: "ad-hoc-d078c.firebaseapp.com",
  databaseURL: "https://ad-hoc-d078c-default-rtdb.firebaseio.com",
  projectId: "ad-hoc-d078c",
  storageBucket: "ad-hoc-d078c.firebasestorage.app",
  messagingSenderId: "485452494263",
  appId: "1:485452494263:web:edacb32bc6f1ed597a6432"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// ==================== GAME STATE ====================
var oor = null;  // Temporary fix
var currentUser = null;
var roomCode = null;
var playerRole = null;
var questions = [];
var currentQuestion = 0;
var myScore = 0;
var opponentScore = 0;
var timer = null;
var timeLeft = 30;
var answered = false;
var bothAnswered = false;
var selectedCategory = 'general';

// ==================== RATE LIMITING ====================
var requestLog = {};

function rateLimit(action, maxRequests, timeWindow) {
  var now = Date.now();
  if (!requestLog[action]) requestLog[action] = [];
  requestLog[action] = requestLog[action].filter(function(t) {
    return now - t < timeWindow;
  });
  if (requestLog[action].length >= maxRequests) {
    showError('Too many attempts! Wait a moment.', false);
    return false;
  }
  requestLog[action].push(now);
  return true;
}

// ==================== DEBOUNCE ====================
function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this;
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      func.apply(context, args);
    }, wait);
  };
}

// ==================== CACHING ====================
function getCachedQuestions(category) {
  var cached = localStorage.getItem('cache_questions_' + category);
  if (cached) {
    var parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < 300000) {
      return parsed.data;
    }
  }
  return null;
}

function setCachedQuestions(category, questionsData) {
  localStorage.setItem('cache_questions_' + category, JSON.stringify({
    data: questionsData,
    timestamp: Date.now()
  }));
}

// ==================== SKELETON LOADING ====================
function showSkeletonLoader() {
  var qEl = document.getElementById('questionText');
  if (qEl) {
    qEl.innerHTML = '<div class="skeleton skeleton-question"></div>';
  }
  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    opts[i].innerHTML = '<div class="skeleton skeleton-option"></div>';
    opts[i].disabled = true;
  }
}

// ==================== ERROR HANDLING ====================
function showError(msg, isCritical) {
  var err = document.getElementById('errorMsg');
  if (!err) return;
  err.textContent = msg;
  err.className = 'error-msg show';
  if (isCritical) {
    err.classList.add('critical');
    var oldBtn = err.querySelector('button');
    if (oldBtn) oldBtn.remove();
    var btn = document.createElement('button');
    btn.textContent = '🔄 Retry';
    btn.onclick = function() { location.reload(); };
    err.appendChild(btn);
  }
  setTimeout(function() {
    err.classList.remove('show');
  }, 5000);
}

// ==================== SMART OFFLINE DETECTION ====================
var connectionLostTimeout = null;
var isFirstLoad = true;

window.addEventListener('online', function() {
  showError('✅ Back online!', false);
});

window.addEventListener('offline', function() {
  showError('📡 No internet connection!', true);
});

if (db.ref) {
  db.ref('.info/connected').on('value', function(snap) {
    if (snap.val() === false) {
      // First load mein error mat dikhao
      if (!isFirstLoad) {
        connectionLostTimeout = setTimeout(function() {
          showError('🔌 Server connection lost! Checking...', false);
        }, 3000);
      }
    } else {
      if (connectionLostTimeout) {
        clearTimeout(connectionLostTimeout);
        connectionLostTimeout = null;
      }
    }
    isFirstLoad = false;
  });
}
// ==================== GET QUESTIONS BY CATEGORY ====================
function getQuestionsByCategory() {
  var cached = getCachedQuestions(selectedCategory);
  if (cached && cached.length > 0) {
    return shuffleArray(cached).slice(0, 10);
  }
  
  var allQuestions = [];
  if (selectedCategory === 'general') {
    allQuestions = window.generalQuestions || [];
  } else if (selectedCategory === 'science') {
    allQuestions = window.scienceQuestions || [];
  } else if (selectedCategory === 'math') {
    allQuestions = window.mathQuestions || [];
  } else if (selectedCategory === 'custom') {
    allQuestions = window.customQuestions || [];
  }
  
  if (allQuestions.length === 0) {
    allQuestions = window.generalQuestions || [];
  }
  
  if (allQuestions.length > 0) {
    setCachedQuestions(selectedCategory, allQuestions);
  }
  
  return shuffleArray(allQuestions).slice(0, 10);
}

function getCategoryName(cat) {
  var names = {
    'general': '📚 General Knowledge',
    'science': '🔬 Science',
    'math': '📐 Mathematics',
    'custom': '⚡ Custom Quiz'
  };
  return names[cat] || '📚 Quiz';
}

// ==================== PAGE LOAD ====================
window.onload = function() {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../login/login.html';
    return;
  }
  
  selectedCategory = localStorage.getItem('quizCategory') || 'general';
  
  var savedTheme = localStorage.getItem('quizTheme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
  }
  
  // WAIT FOR QUESTIONS TO LOAD
  var attempts = 0;
  var waitForQ = setInterval(function() {
    attempts++;
    if (window.generalQuestions && window.generalQuestions.length > 0) {
      clearInterval(waitForQ);
      
      var createRoomBtn = document.getElementById('createRoomBtn');
      var joinRoomBtn = document.getElementById('joinRoomBtn');
      var cancelBtn = document.getElementById('cancelBtn');
      var copyBtn = document.getElementById('copyBtn');
      
      if (createRoomBtn) createRoomBtn.onclick = debounce(createRoom, 1000);
      if (joinRoomBtn) joinRoomBtn.onclick = debounce(joinRoom, 1000);
      if (cancelBtn) cancelBtn.onclick = cancelRoom;
      if (copyBtn) copyBtn.onclick = copyCode;
      
      var categoryDisplay = document.getElementById('selectedCategory');
      if (categoryDisplay) {
        categoryDisplay.textContent = getCategoryName(selectedCategory);
      }
    }
    if (attempts > 30) {
      clearInterval(waitForQ);
      alert('Questions load nahi hue — reload karo!');
    }
  }, 200);
};
// ==================== CREATE ROOM ====================
function createRoom() {
  if (!rateLimit('createRoom', 3, 30000)) return;
  
  var btn = document.getElementById('createRoomBtn');
  if (!btn) {
    console.error("Create room button not found!");
    return;
  }
  
  btn.textContent = '⏳ Ban raha hai...';
  btn.disabled = true;
  
  // Generate 6-digit room code
  roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  playerRole = 'player1';
  questions = getQuestionsByCategory();
  
  if (!questions || questions.length === 0) {
    showError('Questions load nahi hue!', false);
    btn.textContent = 'Room Banao';
    btn.disabled = false;
    return;
  }
  
  var roomData = {
    player1: currentUser.username,
    player1Id: currentUser.uid || currentUser.username,
    player2: null,
    player2Id: null,
    status: 'waiting',
    currentQuestion: 0,
    player1Score: 0,
    player2Score: 0,
    player1Answered: false,
    player2Answered: false,
    category: selectedCategory,
    questions: questions.map(function(q) {
      return {
        question: q.question,
        options: q.options,
        correct: q.correct
      };
    }),
    createdAt: Date.now()
  };
  
  db.ref('rooms/' + roomCode).set(roomData)
    .then(function() {
      console.log("✅ Room created:", roomCode);
      showScreen('waitingScreen');
      var displayCode = document.getElementById('displayRoomCode');
      if (displayCode) displayCode.textContent = roomCode;
      
      var player1Name = document.getElementById('player1Name');
      if (player1Name) player1Name.textContent = currentUser.username;
      
      var roomCat = document.getElementById('roomCategory');
      if (roomCat) roomCat.textContent = getCategoryName(selectedCategory);
      
      listenRoom();
    })
    .catch(function(err) {
      console.error("Room creation error:", err);
      showError('Room nahi bana: ' + err.message, false);
      btn.textContent = 'Room Banao';
      btn.disabled = false;
    });
}

// ==================== JOIN ROOM ====================
function joinRoom() {
  if (!rateLimit('joinRoom', 5, 60000)) return;
  
  var codeInput = document.getElementById('roomCodeInput');
  if (!codeInput) return;
  
  var code = codeInput.value.trim().toUpperCase();
  if (code.length !== 6) {
    showError('6 digit ka code likho!', false);
    return;
  }
  
  var btn = document.getElementById('joinRoomBtn');
  btn.textContent = '⏳ Join ho raha hai...';
  btn.disabled = true;
  
  db.ref('rooms/' + code).once('value').then(function(snapshot) {
    if (!snapshot.exists()) {
      showError('Room nahi mila!', false);
      btn.textContent = 'Join Karo';
      btn.disabled = false;
      return;
    }
    
    var room = snapshot.val();
    if (room.status !== 'waiting') {
      showError('Game already started!', false);
      btn.textContent = 'Join Karo';
      btn.disabled = false;
      return;
    }
    
    if (room.player1 === currentUser.username) {
      showError('Apne room mein join nahi kar sakte!', false);
      btn.textContent = 'Join Karo';
      btn.disabled = false;
      return;
    }
    
    roomCode = code;
    playerRole = 'player2';
    questions = room.questions;
    selectedCategory = room.category;
    
    db.ref('rooms/' + roomCode).update({
      player2: currentUser.username,
      player2Id: currentUser.uid || currentUser.username,
      status: 'ready'
    }).then(function() {
      showScreen('waitingScreen');
      document.getElementById('displayRoomCode').textContent = roomCode;
      document.getElementById('player1Name').textContent = room.player1;
      document.getElementById('player2Name').textContent = currentUser.username;
      var statusEl = document.getElementById('player2Status');
      if (statusEl) statusEl.innerHTML = '✅ Ready';
      var roomCat = document.getElementById('roomCategory');
      if (roomCat) roomCat.textContent = getCategoryName(room.category);
      listenRoom();
    });
  });
}

// ==================== ROOM LISTENER ====================
function listenRoom() {
  var roomRef = db.ref('rooms/' + roomCode);
  roomRef.on('value', function(snapshot) {
    if (!snapshot.exists()) {
      alert('Room band ho gaya!');
      window.location.reload();
      return;
    }
    
    var room = snapshot.val();
    
    // Start game when both players ready
    if (room.player2 && playerRole === 'player1' && room.status === 'ready') {
      var p2NameEl = document.getElementById('player2Name');
      var p2StatusEl = document.getElementById('player2Status');
      var waitingMsgEl = document.getElementById('waitingMsg');
      if (p2NameEl) p2NameEl.textContent = room.player2;
      if (p2StatusEl) p2StatusEl.innerHTML = '✅ Ready';
      if (waitingMsgEl) waitingMsgEl.textContent = 'Game starting...';
      
      setTimeout(function() {
        db.ref('rooms/' + roomCode).update({
          status: 'playing',
          currentQuestion: 0,
          player1Answered: false,
          player2Answered: false
        });
      }, 2000);
    }// After line: showScreen('quizScreen');
// Load opponent's style
if (room.player2 && playerRole === 'player1') {
  window.getUserEquipped(room.player2).then(style => applyOpponentStyle(style));
} else if (room.player1 && playerRole === 'player2') {
  window.getUserEquipped(room.player1).then(style => applyOpponentStyle(style));
}
    // ... inside listenRoom function ...

// Start quiz screen
if (room.status === 'playing') {
  var quizScreen = document.getElementById('quizScreen');
  // ✅ FIXED: Removed spaces in &&
  if (quizScreen && quizScreen.classList.contains('hidden')) {
    var p1NameEl = document.getElementById('p1Name');
    var p2NameEl = document.getElementById('p2Name');
    // ✅ FIXED: Removed space in document
    var quizCatEl = document.getElementById('quizCategoryName');
    
    if (p1NameEl) p1NameEl.textContent = room.player1;
    if (p2NameEl) p2NameEl.textContent = room.player2;
    // ✅ FIXED: Removed space in textContent
    if (quizCatEl) quizCatEl.textContent = getCategoryName(room.category);
    
    showScreen('quizScreen');
    
    // ✅ FIXED: Removed spaces in &&
    if (room.questions && room.questions.length > 0) {
      questions = room.questions;
    }
    
    currentQuestion = room.currentQuestion || 0;
    // ✅ FIXED: Removed space in player2Score
    myScore = playerRole === 'player1' ? (room.player1Score || 0) : (room.player2Score || 0);
    opponentScore = playerRole === 'player1' ? (room.player2Score || 0) : (room.player1Score || 0);
    updateScores();
    loadQuestion();
  }
}

// Handle question change
// ✅ FIXED: Removed spaces in &&
if (room.status === 'playing' && room.currentQuestion !== currentQuestion) {
  currentQuestion = room.currentQuestion;
  answered = false;
  bothAnswered = false;
  clearInterval(timer);
  
  // ✅ FIXED: Removed spaces in &&
  if (room.questions && room.questions[currentQuestion]) {
    loadQuestion();
  }
}

// Update scores
if (room.status === 'playing') {
  if (playerRole === 'player1') {
    myScore = room.player1Score || 0;
    opponentScore = room.player2Score || 0;
  } else {
    myScore = room.player2Score || 0;
    opponentScore = room.player1Score || 0;
  }
  updateScores();
  
  // Check if both answered
  // ✅ FIXED: Removed spaces in &&
  if (room.player1Answered && room.player2Answered && !bothAnswered) {
    bothAnswered = true;
    setTimeout(function() {
      moveToNextQuestion(room);
    }, 2000);
  }
}

// Game finished
if (room.status === 'finished') {
  // ✅ FIXED: Removed space in showResult
  showResult(room);
}

// ==================== MOVE TO NEXT QUESTION ====================
function moveToNextQuestion(room) {
  var nextQuestion = (room.currentQuestion || 0) + 1;
  
  if (nextQuestion >= questions.length) {
    db.ref('rooms/' + roomCode).update({
      status: 'finished',
      player1FinalScore: room.player1Score || 0,
      player2FinalScore: room.player2Score || 0
    });
  } else {
    db.ref('rooms/' + roomCode).update({
      currentQuestion: nextQuestion,
      player1Answered: false,
      player2Answered: false
    });
  }
}

// ==================== UPDATE SCORES DISPLAY ====================
function updateScores() {
  var p1ScoreEl = document.getElementById('p1Score');
  var p2ScoreEl = document.getElementById('p2Score');
  
  if (!p1ScoreEl || !p2ScoreEl) return;
  
  if (playerRole === 'player1') {
    p1ScoreEl.textContent = myScore;
    p2ScoreEl.textContent = opponentScore;
  } else {
    p1ScoreEl.textContent = opponentScore;
    p2ScoreEl.textContent = myScore;
  }
}

// ==================== LOAD QUESTION ====================
function loadQuestion() {
  showSkeletonLoader();
  if (timer) clearInterval(timer);
  answered = false;
  
  var opponentStatusEl = document.getElementById('opponentStatus');
  if (opponentStatusEl) {
    opponentStatusEl.innerHTML = '👤 Waiting for opponent...';
  }
  
  if (currentQuestion >= questions.length) {
    return;
  }
  
  setTimeout(function() {
    var q = questions[currentQuestion];
    if (!q) return;
    
    var questionTextEl = document.getElementById('questionText');
    var qNumEl = document.getElementById('qNum');
    if (questionTextEl) questionTextEl.textContent = q.question;
    if (qNumEl) qNumEl.textContent = (currentQuestion + 1) + '/' + questions.length;
    
    var opts = document.querySelectorAll('.option-btn');
    for (var i = 0; i < opts.length; i++) {
      opts[i].innerHTML = q.options[i];
      opts[i].className = 'option-btn';
      opts[i].disabled = false;
      opts[i].onclick = (function(idx) {
        return function() { checkAnswer(idx); };
      })(i);
    }
    
    startTimer();
  }, 300);
}

// ==================== TIMER ====================
function startTimer() {
  timeLeft = 30;
  var timerTextEl = document.getElementById('timerText');
  var timerCircleEl = document.getElementById('timerCircle');
  
  if (timerTextEl) timerTextEl.textContent = timeLeft;
  if (timerCircleEl) timerCircleEl.className = 'timer-circle';
  clearInterval(timer);
  
  timer = setInterval(function() {
    timeLeft--;
    if (timerTextEl) timerTextEl.textContent = timeLeft;
    
    if (timerCircleEl) {
      if (timeLeft <= 15 && timeLeft > 5) {
        timerCircleEl.className = 'timer-circle warning';
      }
      if (timeLeft <= 5) {
        timerCircleEl.className = 'timer-circle danger';
      }
    }
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      timeUp();
    }
  }, 1000);
}

// ==================== TIME UP ====================
function timeUp() {
  if (answered) return;
  answered = true;
  clearInterval(timer);
  
  var q = questions[currentQuestion];
  if (!q) return;
  
  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    opts[i].disabled = true;
    if (i === q.correct) {
      opts[i].classList.add('correct');
    }
  }
  
  var update = {};
  update[playerRole === 'player1' ? 'player1Answered' : 'player2Answered'] = true;
  db.ref('rooms/' + roomCode).update(update);
  
  var opponentStatusEl = document.getElementById('opponentStatus');
  if (opponentStatusEl) {
    opponentStatusEl.innerHTML = '⏰ Time up! Waiting for opponent...';
  }
}

// ==================== CHECK ANSWER (Debounced) ====================
var checkAnswerDebounced = debounce(function(selected) {
  if (answered) return;
  answered = true;
  clearInterval(timer);
  
  var q = questions[currentQuestion];
  if (!q) return;
  
  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    opts[i].disabled = true;
    if (i === q.correct) {
      opts[i].classList.add('correct');
    }
  }
  
  if (selected === q.correct) {
    myScore += 10;
    if (opts[selected]) opts[selected].classList.add('correct');
  } else {
    if (opts[selected]) opts[selected].classList.add('wrong');
  }
  
  var update = {};
  update[playerRole === 'player1' ? 'player1Score' : 'player2Score'] = myScore;
  update[playerRole === 'player1' ? 'player1Answered' : 'player2Answered'] = true;
  db.ref('rooms/' + roomCode).update(update);
  
  updateScores();
  
  var opponentStatusEl = document.getElementById('opponentStatus');
  if (opponentStatusEl) {
    opponentStatusEl.innerHTML = '✅ Answer submitted! Waiting for opponent...';
  }
}, 500);

function checkAnswer(selected) {
  if (selected === undefined || selected === -1) {
    timeUp();
  } else {
    checkAnswerDebounced(selected);
  }
}

// ==================== SHOW RESULT ====================
function showResult(room) {
  clearInterval(timer);
  
  var resultScreen = document.getElementById('resultScreen');
  if (!resultScreen || !resultScreen.classList.contains('hidden')) {
    return;
  }
  
  showScreen('resultScreen');
  
  var p1Score = room.player1FinalScore || room.player1Score || 0;
  var p2Score = room.player2FinalScore || room.player2Score || 0;
  
  var finalP1NameEl = document.getElementById('finalP1Name');
  var finalP2NameEl = document.getElementById('finalP2Name');
  var finalP1ScoreEl = document.getElementById('finalP1Score');
  var finalP2ScoreEl = document.getElementById('finalP2Score');
  var resultIconEl = document.getElementById('resultIcon');
  var resultTitleEl = document.getElementById('resultTitle');
  
  if (finalP1NameEl) finalP1NameEl.textContent = room.player1 || 'Player 1';
  if (finalP2NameEl) finalP2NameEl.textContent = room.player2 || 'Player 2';
  if (finalP1ScoreEl) finalP1ScoreEl.textContent = p1Score;
  if (finalP2ScoreEl) finalP2ScoreEl.textContent = p2Score;
  
  var myFinal = playerRole === 'player1' ? p1Score : p2Score;
  var oppFinal = playerRole === 'player1' ? p2Score : p1Score;
  
  if (resultIconEl && resultTitleEl) {
    if (myFinal > oppFinal) {
      resultIconEl.textContent = '🏆';
      resultTitleEl.textContent = 'Tum Jeet Gaye! 🎉';
      
      // ✅ ADD WINSH HERE - JAB PLAYER JEETE
      if (typeof earnWinsh !== 'undefined') {
        earnWinsh(50, 'Match jeetne par! 🎉');
      }
      updateNavbarWinsh();
      
    } else if (myFinal < oppFinal) {
      resultIconEl.textContent = '😔';
      resultTitleEl.textContent = 'Tum Haar Gaye!';
    } else {
      resultIconEl.textContent = '🤝';
      resultTitleEl.textContent = 'Match Draw!';
    }
  }
  
  db.ref('rooms/' + roomCode).remove();
}

// ✅ YEH FUNCTION ADD KARO
function updateNavbarWinsh() {
  var user = JSON.parse(localStorage.getItem('currentUser'));
  if (user && user.winsh) {
    var winshEl = document.getElementById('navbarWinsh');
    if (winshEl) winshEl.innerHTML = '💎 ' + user.winsh;
  }
}
// ==================== HELPER FUNCTIONS ====================
function cancelRoom() {
  if (roomCode) {
    db.ref('rooms/' + roomCode).remove();
  }
  window.location.reload();
}

function copyCode() {
  if (!roomCode) return;
  navigator.clipboard.writeText(roomCode).then(function() {
    var copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
      copyBtn.textContent = '✅ Copied!';
      setTimeout(function() {
        copyBtn.textContent = '📋 Copy Karo';
      }, 2000);
    }
  });
}

function showScreen(screenId) {
  var screens = ['lobbyScreen', 'waitingScreen', 'quizScreen', 'resultScreen'];
  screens.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  var screenEl = document.getElementById(screenId);
  if (screenEl) screenEl.classList.remove('hidden');
}

// ==================== SHUFFLE ARRAY ====================
function shuffleArray(array) {
  var arr = array.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}// Jab game start ho, opponent ka style load karo
function loadOpponentStyle(opponentId) {
  var db = firebase.database();
  db.ref('users/' + opponentId + '/equipped').once('value', function(snap) {
    var equipped = snap.val() || {};
    
    // Opponent ka border apply karo
    if (equipped.border) {
      var border = getBorderStyle(equipped.border);
      document.getElementById('opponentCard').style.border = border;
    }
    
    // Opponent ka badge apply karo
    if (equipped.badge) {
      document.getElementById('opponentBadge').innerHTML = getBadgeIcon(equipped.badge);
    }
  });
}
function applyOpponentStyle(style) {
  const opponentCard = document.querySelector('.player-card.waiting');
  if (!opponentCard) return;
  
  if (style.border) {
    const colors = { 'green-neon':'#00ff88', 'fire':'#ff4400', 'gold':'#ffd700' };
    opponentCard.style.border = `3px solid ${colors[style.border] || '#e94560'}`;
    opponentCard.style.boxShadow = `0 0 15px ${colors[style.border] || '#e94560'}`;
  }
  if (style.badge) {
    const badges = { 'rookie':'🌱 Rookie', 'pro':'⭐ Pro', 'master':'🎓 Master' };
    document.getElementById('opponentBadge').innerHTML = badges[style.badge] || '🏆 Player';
  }
}// ==================== END OF FILE ====================
// Make sure all functions are closed
if (typeof module !== 'undefined') { module.exports = {}; }

// Close any pending brackets
}  // This closes any unclosed function