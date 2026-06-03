/* ============================================================
   INTELLICARD AI — QUIZ ARENA SYSTEM
   ============================================================ */

let quizCards = [];
let allDeckCards = []; // Master list of cards in active deck
let currentIndex = 0;
let score = 0;
let timerSeconds = 20;
let timerInterval = null;
let mode = 'mcq';
let deckId = null;
let incorrectCards = [];
let currentQuestionCorrectAnswer = '';
let currentQuestionCorrectBool = true; // For True/False statement
let answered = false;

document.addEventListener('DOMContentLoaded', () => {
  // Bind click listener to mode selector cards
  const modeCards = document.querySelectorAll('.mode-card');
  modeCards.forEach(card => {
    card.addEventListener('click', function() {
      modeCards.forEach(c => {
        c.classList.remove('selected');
        const rb = c.querySelector('input[type="radio"]');
        if (rb) rb.checked = false;
      });
      this.classList.add('selected');
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });
  
  // Highlight the first card by default
  const defaultChecked = document.querySelector('.mode-card input[type="radio"]:checked');
  if (defaultChecked) {
    defaultChecked.closest('.mode-card').classList.add('selected');
  }
});

/**
 * Triggered on setup form submit. Initiates quiz state.
 */
function startQuiz(event) {
  event.preventDefault();

  deckId = document.getElementById('deck-select').value;
  const modeInput = document.querySelector('.mode-card input[type="radio"]:checked');
  mode = modeInput ? modeInput.value : 'mcq';

  if (!deckId) {
    showToast('Please select a deck first.', 'error');
    return;
  }

  // Fetch cards for deck via API
  fetch(`/api/deck/${deckId}/cards`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.cards && data.cards.length > 0) {
        allDeckCards = data.cards;
        
        // Setup quiz cards: shuffle and select up to 10
        quizCards = [...data.cards];
        shuffleArray(quizCards);
        if (quizCards.length > 10) {
          quizCards = quizCards.slice(0, 10);
        }

        // Reset variables
        currentIndex = 0;
        score = 0;
        incorrectCards = [];

        // Show active play panel
        document.getElementById('quiz-setup-stage').style.display = 'none';
        document.getElementById('quiz-active-stage').style.display = 'block';
        document.getElementById('quiz-score-stage').style.display = 'none';

        loadQuestion();
      } else {
        showToast('This deck has no flashcards yet! Please upload content first.', 'error');
      }
    })
    .catch(() => {
      showToast('Error connecting to deck data.', 'error');
    });
}

/**
 * Loads the current question card state into UI
 */
function loadQuestion() {
  answered = false;
  clearInterval(timerInterval);
  
  const card = quizCards[currentIndex];
  
  // Update Question Meta
  document.getElementById('quiz-progress-badge').textContent = `Question ${currentIndex + 1} of ${quizCards.length}`;
  document.getElementById('question-category').textContent = card.topic || 'General';
  
  // Update Progress Bar
  const progressPct = ((currentIndex + 1) / quizCards.length) * 100;
  document.getElementById('quiz-progress-bar').style.width = `${progressPct}%`;
  
  // Reset Display Mode Interfaces
  document.getElementById('mcq-choices').style.display = 'none';
  document.getElementById('tf-choices').style.display = 'none';
  document.getElementById('fitb-interface').style.display = 'none';

  // Build Quiz Layout depending on Mode
  if (mode === 'mcq') {
    buildMcqQuestion(card);
  } else if (mode === 'tf') {
    buildTfQuestion(card);
  } else if (mode === 'fitb') {
    buildFitbQuestion(card);
  }

  // Update Indicator
  document.getElementById('quiz-score-indicator').textContent = `Current Score: ${score}/${currentIndex}`;

  // Start Timer
  startTimer();
}

/**
 * Renders multiple choice question interface
 */
function buildMcqQuestion(card) {
  document.getElementById('question-text').textContent = card.question;
  currentQuestionCorrectAnswer = card.answer;

  const choicesContainer = document.getElementById('mcq-choices');
  choicesContainer.innerHTML = '';
  choicesContainer.style.display = 'grid';

  // Pull wrong answers from other cards in the deck
  const wrongPool = allDeckCards
    .filter(c => c.id !== card.id)
    .map(c => c.answer);
  
  // Shuffle pool and select up to 3 distractors
  shuffleArray(wrongPool);
  let choices = wrongPool.slice(0, 3);
  
  // Append correct answer and shuffle
  choices.push(card.answer);
  
  // Add generic backups if deck is too small
  while (choices.length < 4) {
    choices.push(`Incorrect backup choice ${choices.length}`);
  }
  
  shuffleArray(choices);

  // Render choice buttons
  choices.forEach((choice, index) => {
    const letters = ['A', 'B', 'C', 'D'];
    const btn = document.createElement('button');
    btn.className = 'choice-card';
    btn.onclick = () => selectMcqAnswer(choice, btn);
    btn.innerHTML = `
      <span class="choice-letter">${letters[index]}</span>
      <span class="choice-val">${choice}</span>
    `;
    choicesContainer.appendChild(btn);
  });
}

/**
 * Renders True / False statements
 */
function buildTfQuestion(card) {
  // 50% chance of showing the correct pairing, 50% chance of matching question with a wrong answer
  currentQuestionCorrectBool = Math.random() >= 0.5;
  let answerToDisplay = card.answer;
  
  if (!currentQuestionCorrectBool) {
    const otherCards = allDeckCards.filter(c => c.id !== card.id);
    if (otherCards.length > 0) {
      shuffleArray(otherCards);
      answerToDisplay = otherCards[0].answer;
    } else {
      answerToDisplay = `Incorrect option: ${card.answer} (Negated)`;
    }
  }

  document.getElementById('question-text').innerHTML = `
    Does the following question map correctly to the given answer statement? <br/><br/>
    <strong style="color:var(--cyan)">Question:</strong> ${card.question} <br/>
    <strong style="color:var(--purple)">Provided Answer:</strong> ${answerToDisplay}
  `;

  const tfContainer = document.getElementById('tf-choices');
  tfContainer.style.display = 'grid';
  
  // Reset button designs
  const buttons = tfContainer.querySelectorAll('.choice-card');
  buttons.forEach(btn => {
    btn.className = 'choice-card';
    btn.disabled = false;
  });
}

/**
 * Renders text fill interface
 */
function buildFitbQuestion(card) {
  document.getElementById('question-text').textContent = card.question;
  currentQuestionCorrectAnswer = card.answer;

  const fitbContainer = document.getElementById('fitb-interface');
  fitbContainer.style.display = 'block';

  const input = document.getElementById('fitb-input');
  input.value = '';
  input.disabled = false;
  input.focus();
}

/**
 * Starts the countdown timer
 */
function startTimer() {
  timerSeconds = mode === 'fitb' ? 30 : 20; // More time for typing
  document.getElementById('quiz-timer').textContent = `${timerSeconds}s`;
  document.getElementById('quiz-timer').parentElement.style.color = 'var(--amber)';

  timerInterval = setInterval(() => {
    timerSeconds--;
    document.getElementById('quiz-timer').textContent = `${timerSeconds}s`;

    if (timerSeconds <= 5) {
      document.getElementById('quiz-timer').parentElement.style.color = 'var(--red)';
    }

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

/**
 * Handle user not selecting in time
 */
function handleTimeout() {
  answered = true;
  showToast('Time expired!', 'error');
  
  // Add to review list
  const card = quizCards[currentIndex];
  incorrectCards.push({
    question: card.question,
    yourAnswer: '[No answer - Timeout]',
    correctAnswer: mode === 'tf' ? (currentQuestionCorrectBool ? 'True' : 'False') : card.answer,
    hint: card.hint
  });

  // Reveal correct answer depending on mode
  revealCorrectAnswer();
  
  setTimeout(nextQuestion, 2000);
}

function selectMcqAnswer(choice, btn) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);

  const isCorrect = choice === currentQuestionCorrectAnswer;
  if (isCorrect) {
    score++;
    btn.classList.add('correct');
    showToast('Correct answer!', 'success');
  } else {
    btn.classList.add('incorrect');
    
    // Highlight correct choice
    const cards = document.querySelectorAll('.choice-card');
    cards.forEach(c => {
      const val = c.querySelector('.choice-val').textContent;
      if (val === currentQuestionCorrectAnswer) {
        c.classList.add('correct');
      }
    });

    showToast('Incorrect answer.', 'error');
    incorrectCards.push({
      question: quizCards[currentIndex].question,
