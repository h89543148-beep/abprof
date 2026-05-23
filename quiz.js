var currentQuestion = 0;
var score = 0;
var timer = null;
var timeLeft = 30;
var questions = [];
var answered = false;

window.onload = function() {
  var currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../login/login.html';
    return;
  }

  var category = localStorage.getItem('quizCategory') || 'general';
  document.getElementById('categoryName').textContent = category;

  if (category === 'general') questions = window.generalQuestions;
  else if (category === 'science') questions = window.scienceQuestions;
  else if (category === 'math') questions = window.mathQuestions;
  else if (category === 'custom') questions = window.customQuestions;

  questions = questions.sort(function() { return Math.random() - 0.5; }).slice(0, 10);
  loadQuestion();
};

function loadQuestion() {
  answered = false;
  document.getElementById('nextBtn').style.display = 'none';
  var q = questions[currentQuestion];
  document.getElementById('questionText').textContent = q.question;
  document.getElementById('questionCount').textContent = 'Question ' + (currentQuestion+1) + '/10';
  document.getElementById('progressFill').style.width = (currentQuestion/10*100) + '%';

  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    opts[i].textContent = q.options[i];
    opts[i].className = 'option-btn';
    opts[i].disabled = false;
    opts[i].onclick = (function(idx) {
      return function() { checkAnswer(idx); };
    })(i);
  }
  startTimer();
}

function startTimer() {
  timeLeft = 30;
  document.getElementById('timerText').textContent = timeLeft;
  document.getElementById('timerCircle').className = 'timer-circle';
  clearInterval(timer);
  timer = setInterval(function() {
    timeLeft--;
    document.getElementById('timerText').textContent = timeLeft;
    if (timeLeft <= 15 && timeLeft > 5) document.getElementById('timerCircle').className = 'timer-circle warning';
    if (timeLeft <= 5) document.getElementById('timerCircle').className = 'timer-circle danger';
    if (timeLeft <= 0) { clearInterval(timer); timeUp(); }
  }, 1000);
}

function timeUp() {
  answered = true;
  var q = questions[currentQuestion];
  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    opts[i].disabled = true;
    if (i === q.correct) opts[i].classList.add('correct');
  }
  document.getElementById('nextBtn').style.display = 'block';
}

function checkAnswer(selected) {
  if (answered) return;
  answered = true;
  clearInterval(timer);
  var q = questions[currentQuestion];
  var opts = document.querySelectorAll('.option-btn');
  for (var i = 0; i < opts.length; i++) {
    opts[i].disabled = true;
    if (i === q.correct) opts[i].classList.add('correct');
  }
  if (selected === q.correct) {
    score += 10;
    document.getElementById('scoreCount').textContent = 'Score: ' + score;
  } else {
    opts[selected].classList.add('wrong');
  }
  document.getElementById('nextBtn').style.display = 'block';
}

document.getElementById('nextBtn').addEventListener('click', function() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    loadQuestion();
  } else {
    clearInterval(timer);
    var percentage = Math.round((score / 100) * 100);
    localStorage.setItem('quizResult', JSON.stringify({
      score: score,
      total: 100,
      percentage: percentage,
      category: localStorage.getItem('quizCategory')
    }));
    window.location.href = '../result/result.html';
  }
});

document.getElementById('quitBtn').addEventListener('click', function() {
  clearInterval(timer);
  window.location.href = '../Index.html';
});