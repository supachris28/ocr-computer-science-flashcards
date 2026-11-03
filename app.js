const ASSET_VERSION = '20261103-01';

const sections = [
  { id: '1.1', paper: 1, title: 'Systems architecture', cardCount: 21 },
  { id: '1.2', paper: 1, title: 'Memory and storage', cardCount: 53 },
  { id: '1.3', paper: 1, title: 'Computer networks, connections and protocols', cardCount: 36 },
  { id: '1.4', paper: 1, title: 'Network security', cardCount: 20 },
  { id: '1.5', paper: 1, title: 'Systems software', cardCount: 14 },
  { id: '1.6', paper: 1, title: 'Ethical, legal, cultural and environmental impacts of digital technology', cardCount: 21 },
  { id: '2.1', paper: 2, title: 'Algorithms', cardCount: 27 },
  { id: '2.2', paper: 2, title: 'Programming fundamentals', cardCount: 32 },
  { id: '2.3', paper: 2, title: 'Producing robust programs', cardCount: 16 },
  { id: '2.4', paper: 2, title: 'Boolean logic', cardCount: 14 },
  { id: '2.5', paper: 2, title: 'Programming languages and Integrated Development Environments', cardCount: 13 }
];

const sectionSummary = document.querySelector('#selection-summary');
const syllabusToggle = document.querySelector('#toggle-syllabus-index');
const syllabusContent = document.querySelector('#syllabus-picker-content');
const paperOneList = document.querySelector('#paper-one-sections');
const paperTwoList = document.querySelector('#paper-two-sections');
const flashcard = document.querySelector('#flashcard');
const emptyState = document.querySelector('#empty-state');
const question = document.querySelector('#card-question');
const answer = document.querySelector('#answer-text');
const answerPanel = document.querySelector('#card-answer');
const questionCode = document.querySelector('#card-question-code');
const marksPill = document.querySelector('#card-marks');
const markSchemePanel = document.querySelector('#mark-scheme');
const markSchemeList = document.querySelector('#mark-scheme-list');
const markSchemeHint = document.querySelector('#mark-scheme-hint');
const rejectPanel = document.querySelector('#mark-reject');
const rejectList = document.querySelector('#mark-reject-list');
const examTip = document.querySelector('#exam-tip');
const examTipText = document.querySelector('#exam-tip-text');
const selfScore = document.querySelector('#self-score');
const topic = document.querySelector('#card-topic');
const number = document.querySelector('#card-number');
const progressCopy = document.querySelector('#progress-copy');
const progressBar = document.querySelector('#progress-bar');
const revealButton = document.querySelector('#reveal-button');
const nextButton = document.querySelector('#next-button');
const thinkHint = document.querySelector('#think-hint');
const sessionNote = document.querySelector('#session-note');

let enabledSections = new Set(sections.map((section) => section.id));
const loadedCards = new Map();
let deck = [];
let currentCard = null;
let completed = 0;
let roundSize = 0;
let loadingRequest = 0;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function renderSectionIndex() {
  for (const section of sections) {
    const label = document.createElement('label');
    label.className = 'section-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabledSections.has(section.id);
    checkbox.dataset.section = section.id;
    checkbox.setAttribute('aria-label', `Include ${section.id} ${section.title}`);
    const copy = document.createElement('span');
    copy.className = 'section-copy';
    const title = document.createElement('span');
    title.className = 'section-title';
    title.innerHTML = `<span class="section-code">${section.id}</span> ${section.title}`;
    const cardCount = document.createElement('span');
    cardCount.className = 'section-card-count';
    cardCount.textContent = `${section.cardCount} ${section.cardCount === 1 ? 'card' : 'cards'}`;
    copy.append(title, cardCount);
    label.append(checkbox, copy);
    (section.paper === 1 ? paperOneList : paperTwoList).append(label);
  }
}

function selectedSectionIds() {
  return [...enabledSections];
}

function selectedCards() {
  return selectedSectionIds().flatMap((id) => loadedCards.get(id) || []);
}

function updateSelectionSummary() {
  const active = enabledSections.size;
  const cardCount = selectedSectionIds().reduce((total, id) => {
    const section = sections.find((item) => item.id === id);
    return total + (section?.cardCount || 0);
  }, 0);
  sectionSummary.textContent = `${active} of ${sections.length} sections · ${cardCount} ${cardCount === 1 ? 'card' : 'cards'}`;
}

function updateProgress() {
  progressCopy.textContent = `CARD ${completed + 1} OF ${roundSize}`;
  progressBar.style.width = roundSize ? `${(completed / roundSize) * 100}%` : '0%';
}

function setLoadingState(isLoading) {
  revealButton.disabled = isLoading;
  nextButton.disabled = isLoading;
  flashcard.classList.toggle('is-loading', isLoading);
  if (isLoading) question.textContent = 'Loading selected cards…';
}

function loadSection(id) {
  if (loadedCards.has(id)) return Promise.resolve(loadedCards.get(id));
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `cards/${id}.js?v=${ASSET_VERSION}`;
    script.dataset.cardSection = id;
    script.onload = () => {
      const cards = window.J277CardSections?.[id];
      if (!cards) {
        reject(new Error(`Card section ${id} did not register any cards.`));
        return;
      }
      loadedCards.set(id, cards.map((card) => ({ ...card, section: id })));
      resolve(loadedCards.get(id));
    };
    script.onerror = () => reject(new Error(`Unable to load card section ${id}.`));
    document.head.append(script);
  });
}

async function loadSelectedSections() {
  const requestId = ++loadingRequest;
  setLoadingState(true);
  try {
    await Promise.all(selectedSectionIds().map(loadSection));
    if (requestId !== loadingRequest) return;
    showNextCard();
  } catch (error) {
    if (requestId !== loadingRequest) return;
    flashcard.hidden = true;
    emptyState.hidden = false;
    sessionNote.hidden = true;
    emptyState.querySelector('h2').textContent = 'Cards could not be loaded';
    emptyState.querySelector('p').textContent = error.message;
  } finally {
    if (requestId === loadingRequest) setLoadingState(false);
  }
}

function showNextCard() {
  const pool = selectedCards();
  if (pool.length === 0) {
    flashcard.hidden = true;
    emptyState.hidden = false;
    sessionNote.hidden = true;
    progressCopy.textContent = 'NO SECTIONS SELECTED';
    progressBar.style.width = '0%';
    return;
  }
  if (completed === roundSize || deck.length === 0) {
    completed = 0;
    roundSize = pool.length;
    deck = shuffle(pool);
    if (currentCard && deck.length > 1 && deck[deck.length - 1] === currentCard) {
      [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
    }
  }
  currentCard = deck.pop();
  flashcard.hidden = false;
  emptyState.hidden = true;
  sessionNote.hidden = false;
  renderQuestion(currentCard);
  renderAnswer(currentCard);
  topic.textContent = currentCard.topic;
  number.textContent = currentCard.section;
  answerPanel.hidden = true;
  revealButton.hidden = false;
  nextButton.hidden = true;
  thinkHint.hidden = false;
  updateProgress();
}

function marksLabel(marks) {
  return `${marks} ${marks === 1 ? 'mark' : 'marks'}`;
}

function isLevelled(card) {
  return (card.markScheme || []).some((point) => /^Level \d/.test(point));
}

function renderQuestion(card) {
  const [prompt, ...code] = card.question.split('\n\n');
  question.textContent = prompt;
  questionCode.textContent = code.join('\n\n');
  questionCode.hidden = code.length === 0;
  marksPill.hidden = !card.marks;
  if (card.marks) marksPill.textContent = `[${marksLabel(card.marks)}]`;
}

function fillList(list, items, checkable) {
  list.replaceChildren(...items.map((item, index) => {
    const li = document.createElement('li');
    if (!checkable) {
      li.textContent = item;
      return li;
    }
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = `mark-point-${index}`;
    box.dataset.markPoint = String(index);
    const text = document.createElement('span');
    text.textContent = item;
    label.append(box, text);
    li.append(label);
    return li;
  }));
}

function updateSelfScore() {
  if (!currentCard?.marks || isLevelled(currentCard)) {
    selfScore.hidden = true;
    return;
  }
  const ticked = markSchemeList.querySelectorAll('[data-mark-point]:checked').length;
  const score = Math.min(ticked, currentCard.marks);
  selfScore.hidden = false;
  selfScore.textContent = ticked > currentCard.marks
    ? `${score} / ${currentCard.marks} · capped at the maximum for this question`
    : `${score} / ${currentCard.marks}`;
}

function renderAnswer(card) {
  answer.textContent = card.answer;
  answer.classList.toggle('is-code', card.answer.includes('\n'));
  const scheme = card.markScheme || [];
  markSchemePanel.hidden = scheme.length === 0;
  const levelled = isLevelled(card);
  fillList(markSchemeList, scheme, !levelled);
  markSchemeHint.textContent = levelled
    ? 'Marked by level: read the descriptors and decide which best fits your answer.'
    : `Tick each point you made. Each point is worth 1 mark, up to ${marksLabel(card.marks)}.`;
  const reject = card.reject || [];
  rejectPanel.hidden = reject.length === 0;
  fillList(rejectList, reject, false);
  examTip.hidden = !card.examTip;
  examTipText.textContent = card.examTip || '';
  updateSelfScore();
}

function updateSections() {
  enabledSections = new Set(Array.from(document.querySelectorAll('[data-section]:checked'), (input) => input.dataset.section));
  updateSelectionSummary();
  completed = 0;
  deck = [];
  currentCard = null;
  loadSelectedSections();
}

function setAllSections(enabled) {
  document.querySelectorAll('[data-section]').forEach((input) => { input.checked = enabled; });
  updateSections();
}

renderSectionIndex();
updateSelectionSummary();
document.querySelector('.syllabus-picker').addEventListener('change', (event) => {
  if (event.target.matches('[data-section]')) updateSections();
});
document.querySelector('#select-all').addEventListener('click', () => setAllSections(true));
document.querySelector('#select-none').addEventListener('click', () => setAllSections(false));
syllabusToggle.addEventListener('click', () => {
  const expanded = syllabusToggle.getAttribute('aria-expanded') !== 'true';
  syllabusToggle.setAttribute('aria-expanded', String(expanded));
  syllabusContent.hidden = !expanded;
});

revealButton.addEventListener('click', () => {
  answerPanel.hidden = false;
  revealButton.hidden = true;
  nextButton.hidden = false;
  thinkHint.hidden = true;
  completed += 1;
  progressBar.style.width = `${(completed / roundSize) * 100}%`;
  nextButton.focus();
});

nextButton.addEventListener('click', showNextCard);
markSchemeList.addEventListener('change', updateSelfScore);
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !event.repeat && !event.target.matches('button, a, input')) {
    event.preventDefault();
    if (answerPanel.hidden && !flashcard.hidden) revealButton.click();
  }
});

loadSelectedSections();
