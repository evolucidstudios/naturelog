const storageKey = "would-you-rather-game";
const builtIns = [
  ["Fight one horse-sized duck", "Battle one hundred duck-sized horses"],
  ["Have perfect memory", "Need only four hours of sleep"],
  ["Only eat tacos forever", "Only eat pasta forever"],
  ["Always sing your thoughts", "Always dance when you walk"],
  ["Live in a treehouse", "Live on a boat"],
  ["Have a rewind button", "Have a pause button"],
  ["Give up your phone for a month", "Give up streaming for a month"],
  ["Be able to talk to dogs", "Be able to talk to birds"],
  ["Vacation in the mountains", "Vacation by the ocean"],
  ["Be funny in every conversation", "Be calm in every argument"]
];
const questionPrompt = document.getElementById("questionPrompt");
const progressLabel = document.getElementById("progressLabel");
const optionAButton = document.getElementById("optionAButton");
const optionBButton = document.getElementById("optionBButton");
let currentQuestion = null;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{"custom":[],"answered":0}');
  } catch {
    return { custom: [], answered: 0 };
  }
}
function saveState(state) { localStorage.setItem(storageKey, JSON.stringify(state)); }
function allQuestions() {
  const state = loadState();
  return [...builtIns.map((pair, index) => ({ id: `built-${index}`, a: pair[0], b: pair[1] })), ...state.custom];
}
function nextQuestion() {
  const pool = allQuestions();
  currentQuestion = pool[Math.floor(Math.random() * pool.length)];
  questionPrompt.textContent = "Would you rather...";
  optionAButton.textContent = currentQuestion.a;
  optionBButton.textContent = currentQuestion.b;
  progressLabel.textContent = `${loadState().answered} answered`;
}
function answerQuestion() {
  const state = loadState();
  state.answered += 1;
  saveState(state);
  nextQuestion();
}
optionAButton.addEventListener("click", answerQuestion);
optionBButton.addEventListener("click", answerQuestion);
document.getElementById("customQuestionForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const state = loadState();
  state.custom.unshift({
    id: crypto.randomUUID(),
    a: document.getElementById("optionAInput").value.trim(),
    b: document.getElementById("optionBInput").value.trim()
  });
  saveState(state);
  event.target.reset();
  nextQuestion();
});
nextQuestion();
