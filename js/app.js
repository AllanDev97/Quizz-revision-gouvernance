/* =============================================================
   Quiz Normes ISO — Moteur multi-normes
   ============================================================= */

// ── État global ─────────────────────────────────────────────
let allQuestions     = [];
let sessionQuestions = [];
let currentIndex     = 0;
let score            = 0;
let sessionErrors    = [];
let userAnswers      = [];     // stocke les réponses données par question
let selectedTheme    = 'all';
let currentNorm      = null;   // ex: "iso27005"

// ── Définition des normes ────────────────────────────────────
const NORMS = {
  'iso27005': {
    label:    'ISO/IEC 27005:2022',
    subtitle: 'Gestion des risques de sécurité de l\'information',
    file:     'data/iso27005.json',
  },
  'iso27001': {
    label:    'ISO/IEC 27001:2022',
    subtitle: 'Système de Management de la Sécurité de l\'Information',
    file:     'data/iso27001.json',
  },
  'iso22301': {
    label:    'ISO 22301:2019',
    subtitle: 'Continuité d\'activité',
    file:     'data/iso22301.json',
  },
  'exam-blanc-27001': {
    label:    'Examen blanc 27001',
    subtitle: 'Fournit par Mr WOLF',
    file:     'data/exam-blanc-27001.json',
  },
  'devsecops': {
    label:    'DevSecOps',
    subtitle: 'DevOps Security Manager',
    file:     'data/devsecops.json',
  },
};

// ── Libellés thèmes par norme ────────────────────────────────
const THEME_LABELS = {
  // ISO 27005
  'fondamentaux':        'Fondamentaux & concepts',
  'presentation-27005':  'Présentation ISO 27005',
  'definitions':         'Terminologie clé',
  'composantes-risque':  'Composantes du risque',
  'contexte':            'Établissement du contexte',
  'identification':      'Identification des risques',
  'estimation':          'Estimation des risques',
  'evaluation':          'Évaluation des risques',
  'traitement':          'Traitement des risques',
  'acceptation':         'Acceptation du risque',
  'communication':       'Communication & concertation',
  'surveillance':        'Surveillance & revue',
  'smsi':                'Alignement SMSI / 27001',
  'certification-esd':   'Certification ESD',
  // ISO 27001
  'contexte-org':        'Contexte de l\'organisation',
  'leadership':          'Leadership',
  'planification':       'Planification',
  'support':             'Support',
  'operation':           'Opération',
  'evaluation-perf':     'Évaluation des performances',
  'amelioration':        'Amélioration',
  'annexe-a':            'Annexe A — Contrôles',
  // ISO 22301
  'Cadrage et terminologie':    'Cadrage et terminologie',
  'PCA et Entreprise':          'PCA et Entreprise',
  'Fonctionnement':             'Fonctionnement',
  'Étude norme ISO 22301':      'Étude norme ISO 22301',
  'Contexte de l\'organisation':'Contexte de l\'organisation',
  'Leadership':                 'Leadership',
  'Planification':              'Planification',
  'Support':                    'Support',
  'Évaluation des performances':'Évaluation des performances',
  'Amélioration':               'Amélioration',
  // Examen blanc
  'examen-blanc':        'Examen blanc (Mr WOLF)',
  // DevSecOps
  'introduction':        'Introduction & Référentiels',
  'vulnerabilites-web':  'Vulnérabilités Web',
  // Communs
  'examen':              'Simulation d\'examen',
  'all':                 'Tout réviser',
  'errors':              'Mes erreurs',
};

const DIFFICULTY_LABELS = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' };
const TYPE_LABELS = { mcq: 'QCM', true_false: 'Vrai/Faux', flashcard: 'Flashcard', multiple: 'Réponses multiples' };

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNormScreen();

  document.getElementById('btn-back-norms').addEventListener('click', () => {
    allQuestions = [];
    currentNorm  = null;
    buildNormScreen();
    show('screen-norms');
  });
});

// ── Écran choix norme ────────────────────────────────────────
function buildNormScreen() {
  document.querySelectorAll('.norm-card:not(.norm-card--soon)').forEach(card => {
    const norm    = card.dataset.norm;
    const file    = card.dataset.file;
    const countEl = document.getElementById('count-' + norm);

    fetch(file)
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) {
          const themes = [...new Set(data.map(q => q.theme))].length;
          countEl.textContent = data.length + ' questions · ' + themes + ' thèmes';
        } else {
          countEl.textContent = 'Questions à venir';
          card.classList.add('norm-card--soon');
        }
        card.addEventListener('click', () => {
          if (!card.classList.contains('norm-card--soon')) loadNorm(norm);
        });
      })
      .catch(() => {
        countEl.textContent = 'Fichier introuvable';
        card.classList.add('norm-card--soon');
      });
  });
}

// ── Chargement d'une norme ───────────────────────────────────
function loadNorm(norm) {
  currentNorm = norm;
  const meta  = NORMS[norm];

  fetch(meta.file)
    .then(r => r.json())
    .then(data => {
      allQuestions = data;
      document.getElementById('norm-title-header').textContent    = meta.label;
      document.getElementById('norm-subtitle-header').textContent = meta.subtitle;
      show('screen-home');
      buildHomeScreen();
    })
    .catch(() => toast('Impossible de charger ' + meta.file));
}

// ── Écran Accueil thèmes ────────────────────────────────────
function buildHomeScreen() {
  const scores   = getStoredScores();
  const errorIds = getStoredErrors();
  const themes   = [...new Set(allQuestions.map(q => q.theme))];

  document.getElementById('home-stats').textContent =
    allQuestions.length + ' questions · ' +
    themes.length + ' thèmes · ' +
    errorIds.length + ' erreur(s) enregistrée(s)';

  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';

  grid.appendChild(makeThemeCard('all', allQuestions.length, scores['all'] ?? null, 'all-card'));
  if (errorIds.length > 0) {
    grid.appendChild(makeThemeCard('errors', errorIds.length, null, 'errors-card'));
  }

  themes.forEach(theme => {
    const count = allQuestions.filter(q => q.theme === theme).length;
    grid.appendChild(makeThemeCard(theme, count, scores[theme] ?? null, ''));
  });

  grid.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const t = card.dataset.theme;
      if (t === 'errors') startErrorMode();
      else startQuiz(t);
    });
  });
}

function makeThemeCard(theme, count, score, extraClass) {
  const card   = document.createElement('div');
  card.className     = 'theme-card ' + extraClass;
  card.dataset.theme = theme;

  let inner = `<div class="card-title">${label(theme)}</div>
               <div class="card-count">${count} question${count > 1 ? 's' : ''}</div>`;

  if (score !== null) {
    inner += `<div class="mini-progress">
                <div class="mini-progress-fill" style="width:${score}%"></div>
              </div>
              <div class="score-badge">${score}%</div>`;
  }
  card.innerHTML = inner;
  return card;
}

// ── Démarrage Quiz ───────────────────────────────────────────
function startQuiz(theme) {
  selectedTheme = theme;

  const pool     = theme === 'all' ? allQuestions : allQuestions.filter(q => q.theme === theme);
  const countVal = document.getElementById('question-count').value;
  const maxN     = countVal === 'all' ? pool.length : parseInt(countVal);
  sessionQuestions = shuffle([...pool]).slice(0, Math.min(maxN, pool.length));

  currentIndex  = 0;
  score         = 0;
  sessionErrors = [];
  userAnswers   = [];

  show('screen-quiz');
  document.getElementById('quiz-theme-label').textContent = label(theme);
  showQuestion();
}

function startErrorMode() {
  const errorIds = getStoredErrors();
  if (errorIds.length === 0) { toast('Aucune erreur enregistrée !'); return; }

  selectedTheme    = 'errors';
  sessionQuestions = shuffle(allQuestions.filter(q => errorIds.includes(q.id)));
  currentIndex     = 0;
  score            = 0;
  sessionErrors    = [];
  userAnswers      = [];

  show('screen-quiz');
  document.getElementById('quiz-theme-label').textContent = 'Mes erreurs';
  showQuestion();
}

// ── Affichage Question ───────────────────────────────────────
function showQuestion() {
  const q     = sessionQuestions[currentIndex];
  const total = sessionQuestions.length;

  document.getElementById('quiz-counter').textContent       = `Q ${currentIndex + 1} / ${total}`;
  document.getElementById('progress-fill').style.width      = `${(currentIndex / total) * 100}%`;

  // Bouton Précédent
  const btnPrev = document.getElementById('btn-prev');
  if (currentIndex > 0) {
    btnPrev.classList.remove('hidden');
    const btnPrevClone = btnPrev.cloneNode(true);
    btnPrev.parentNode.replaceChild(btnPrevClone, btnPrev);
    btnPrevClone.addEventListener('click', () => {
      currentIndex--;
      showQuestion();
    });
  } else {
    btnPrev.classList.add('hidden');
  }

  const meta = document.getElementById('question-meta');
  meta.innerHTML = `
    <span class="tag tag-type">${TYPE_LABELS[q.type] || q.type}</span>
    <span class="tag tag-difficulty-${q.difficulty}">${DIFFICULTY_LABELS[q.difficulty] || ''}</span>
    <span class="tag tag-source">${q.source}</span>`;

  document.getElementById('question-text').textContent = q.question;
  document.getElementById('feedback').classList.add('hidden');

  const list = document.getElementById('options-list');
  list.innerHTML = '';

  const previousAnswer = userAnswers[currentIndex];

  if (q.type === 'flashcard') {
    if (previousAnswer) {
      // Déjà vu : afficher directement le feedback
      showFeedback(q, null);
    } else {
      const btn = document.createElement('button');
      btn.className   = 'btn-reveal';
      btn.textContent = 'Révéler la réponse';
      btn.addEventListener('click', () => {
        userAnswers[currentIndex] = { answered: true };
        showFeedback(q, null);
      });
      list.appendChild(btn);
    }
    return;
  }

  const btnValidate = document.getElementById('btn-validate');

  if (q.type === 'multiple') {
    btnValidate.classList.add('hidden');
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className   = 'option-btn option-btn--multi';
      btn.textContent = opt;
      btn.dataset.index = i;

      if (previousAnswer) {
        // Déjà répondu : afficher l'état final
        btn.disabled = true;
        const correctIndices = [...q.answers].sort();
        if (correctIndices.includes(i))                         btn.classList.add('correct');
        else if (previousAnswer.selectedIndices.includes(i))    btn.classList.add('incorrect');
      } else {
        btn.addEventListener('click', () => btn.classList.toggle('selected'));
      }
      list.appendChild(btn);
    });

    if (previousAnswer) {
      showFeedback(q, previousAnswer.correct);
    } else {
      btnValidate.classList.remove('hidden');
      const cloned = btnValidate.cloneNode(true);
      btnValidate.parentNode.replaceChild(cloned, btnValidate);
      cloned.addEventListener('click', () => handleMultipleValidate(q));
    }
  } else {
    btnValidate.classList.add('hidden');
    const correctIdx = getCorrectIndex(q);
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className   = 'option-btn';
      btn.textContent = opt;

      if (previousAnswer) {
        btn.disabled = true;
        if (i === correctIdx)                        btn.classList.add('correct');
        else if (i === previousAnswer.selectedIndex) btn.classList.add('incorrect');
      } else {
        btn.addEventListener('click', () => handleAnswer(q, i));
      }
      list.appendChild(btn);
    });

    if (previousAnswer) {
      showFeedback(q, previousAnswer.correct);
    }
  }
}

// ── Gestion Réponse ──────────────────────────────────────────
function getCorrectIndex(q) {
  // Support both `answer` (int) and `answers` (array) fields
  if (q.answer !== undefined) return q.answer;
  if (q.answers && q.answers.length === 1) return q.answers[0];
  return null;
}

function handleAnswer(q, selectedIndex) {
  const correctIdx = getCorrectIndex(q);
  const correct = selectedIndex === correctIdx;
  userAnswers[currentIndex] = { selectedIndex, correct };
  if (correct) score++;
  else if (!sessionErrors.includes(q.id)) sessionErrors.push(q.id);

  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === correctIdx)         btn.classList.add('correct');
    else if (i === selectedIndex) btn.classList.add('incorrect');
  });

  showFeedback(q, correct);
}

function handleMultipleValidate(q) {
  const selectedBtns = document.querySelectorAll('.option-btn--multi.selected');
  const selectedIndices = [...selectedBtns].map(b => parseInt(b.dataset.index)).sort();
  const correctIndices  = [...q.answers].sort();

  const correct = JSON.stringify(selectedIndices) === JSON.stringify(correctIndices);
  userAnswers[currentIndex] = { selectedIndices, correct };
  if (correct) score++;
  else if (!sessionErrors.includes(q.id)) sessionErrors.push(q.id);

  document.querySelectorAll('.option-btn--multi').forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove('selected');
    const idx = parseInt(btn.dataset.index);
    if (correctIndices.includes(idx))       btn.classList.add('correct');
    else if (selectedIndices.includes(idx)) btn.classList.add('incorrect');
  });

  document.getElementById('btn-validate').classList.add('hidden');
  showFeedback(q, correct);
}

function showFeedback(q, correct) {
  const feedbackEl      = document.getElementById('feedback');
  const feedbackText    = document.getElementById('feedback-text');
  const explanationText = document.getElementById('explanation-text');

  if (correct === null) {
    feedbackText.textContent = '';
    feedbackText.className   = '';
  } else if (correct) {
    feedbackText.textContent = '✓ Correct !';
    feedbackText.className   = 'correct';
  } else {
    feedbackText.textContent = '✗ Incorrect';
    feedbackText.className   = 'incorrect';
    if (!sessionErrors.includes(q.id)) sessionErrors.push(q.id);
  }

  explanationText.textContent = q.explanation;
  feedbackEl.classList.remove('hidden');

  const btnNext      = document.getElementById('btn-next');
  const btnNextClone = btnNext.cloneNode(true);
  btnNext.parentNode.replaceChild(btnNextClone, btnNext);

  const isLast = currentIndex >= sessionQuestions.length - 1;
  btnNextClone.textContent = isLast ? 'Voir les résultats →' : 'Question suivante →';
  btnNextClone.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex < sessionQuestions.length) showQuestion();
    else showResults();
  });
}

// ── Résultats ────────────────────────────────────────────────
function showResults() {
  const total = sessionQuestions.length;
  const pct   = total > 0 ? Math.round((score / total) * 100) : 0;

  document.getElementById('progress-fill').style.width = '100%';
  saveScore(pct);
  saveErrors(sessionErrors);

  const cls = pct >= 75 ? 'great' : pct >= 50 ? 'ok' : 'low';
  document.getElementById('score-circle').className = `score-circle ${cls}`;
  const pctEl = document.getElementById('score-pct');
  pctEl.className   = `score-pct ${cls}`;
  pctEl.textContent = pct + '%';

  document.getElementById('score-detail').textContent  = `${score} bonne(s) réponse(s) sur ${total}`;
  document.getElementById('score-message').textContent = scoreMessage(pct);

  document.getElementById('btn-retry').onclick = () => startQuiz(selectedTheme === 'errors' ? 'all' : selectedTheme);

  const btnReview = document.getElementById('btn-review-errors');
  if (sessionErrors.length > 0) {
    btnReview.classList.remove('hidden');
    btnReview.textContent = `Réviser mes erreurs de session (${sessionErrors.length})`;
    btnReview.onclick = () => {
      sessionQuestions = shuffle(allQuestions.filter(q => sessionErrors.includes(q.id)));
      selectedTheme = 'errors';
      currentIndex = 0; score = 0; sessionErrors = [];
      show('screen-quiz');
      document.getElementById('quiz-theme-label').textContent = 'Révision des erreurs';
      showQuestion();
    };
  } else {
    btnReview.classList.add('hidden');
  }

  document.getElementById('btn-home-from-results').onclick = () => {
    buildHomeScreen();
    show('screen-home');
  };

  const errorsListEl = document.getElementById('results-errors-list');
  const errorsItems  = document.getElementById('results-errors-items');

  if (sessionErrors.length > 0) {
    errorsListEl.classList.remove('hidden');
    errorsItems.innerHTML = '';
    sessionQuestions.filter(q => sessionErrors.includes(q.id)).forEach(q => {
      const div = document.createElement('div');
      div.className = 'error-item';
      let correct;
      if (q.type === 'flashcard') correct = '(voir explication)';
      else if (q.answers) correct = q.answers.map(i => q.options[i]).join(' | ');
      else correct = q.options[q.answer];
      div.innerHTML = `<div class="error-q">${q.question}</div>
                       <div class="error-expl"><strong>Bonne réponse :</strong> ${correct}<br>${q.explanation}</div>`;
      errorsItems.appendChild(div);
    });
  } else {
    errorsListEl.classList.add('hidden');
  }

  show('screen-results');
}

// ── Persistance localStorage (clé par norme) ────────────────
function storageKey(key) {
  return currentNorm ? `${currentNorm}_${key}` : key;
}
function getStoredErrors() { return JSON.parse(localStorage.getItem(storageKey('quiz_errors')) || '[]'); }
function getStoredScores() { return JSON.parse(localStorage.getItem(storageKey('quiz_scores')) || '{}'); }

function saveScore(pct) {
  const scores = getStoredScores();
  if (scores[selectedTheme] === undefined || pct > scores[selectedTheme]) {
    scores[selectedTheme] = pct;
    localStorage.setItem(storageKey('quiz_scores'), JSON.stringify(scores));
  }
}
function saveErrors(ids) {
  if (!ids.length) return;
  const stored = getStoredErrors();
  localStorage.setItem(storageKey('quiz_errors'), JSON.stringify([...new Set([...stored, ...ids])]));
}

// ── Utilitaires ──────────────────────────────────────────────
function show(screenId) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function label(theme) { return THEME_LABELS[theme] || theme.replace(/-/g, ' '); }

function scoreMessage(pct) {
  if (pct === 100) return 'Parfait ! Maîtrise totale.';
  if (pct >= 80)   return 'Excellent ! Très bonne maîtrise du sujet.';
  if (pct >= 60)   return 'Bien ! Quelques points à consolider.';
  if (pct >= 40)   return 'En progression. Révisez les notions manquées.';
  return 'À retravailler. Relisez le cours et recommencez.';
}

function toast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ── Commandes console ────────────────────────────────────────
window.clearErrors = () => { localStorage.removeItem(storageKey('quiz_errors')); toast('Erreurs effacées !'); buildHomeScreen(); };
window.clearAll    = () => { localStorage.removeItem(storageKey('quiz_errors')); localStorage.removeItem(storageKey('quiz_scores')); toast('Progression réinitialisée !'); buildHomeScreen(); };
