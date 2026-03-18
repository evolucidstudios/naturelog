const storageKey = "random-challenge-generator";
const categories = ["all", "creative", "funny", "outside", "family", "quick"];
const builtInChallenges = [
  ["creative", "Draw your breakfast without looking at the page."], ["funny", "Narrate your next chore like a dramatic sports event."], ["outside", "Walk until you find the weirdest leaf of the day."], ["family", "Ask someone to tell you their funniest old story."], ["quick", "Clean one drawer in five minutes."],
  ["creative", "Take one object and invent a fake commercial for it."], ["funny", "Send a friend the most formal text possible about snacks."], ["outside", "Find three shades of green in ten minutes."], ["family", "Build the world's smallest blanket fort."], ["quick", "Do 20 jumping jacks right now."],
  ["creative", "Write a four-line poem about your shoes."], ["funny", "Speak in a pirate voice for the next two minutes."], ["outside", "Take a picture of a cloud that looks like something."], ["family", "Let someone else choose tonight's dessert."], ["quick", "Put away ten things immediately."],
  ["creative", "Make a tiny playlist for your current mood."], ["funny", "Create a fake award for somebody in the room."], ["outside", "Spot one bird and look it up later."], ["family", "Play one round of rock-paper-scissors tournament style."], ["quick", "Drink a full glass of water."],
  ["creative", "Sketch a logo for an imaginary company."], ["funny", "Try to describe a banana like it's a rare artifact."], ["outside", "Find a tree you have never really looked at before."], ["family", "Ask everyone their favorite comfort food."], ["quick", "Stretch for three minutes."],
  ["creative", "Make up a challenge and give it a dramatic title."], ["funny", "Do your best movie-trailer voice for daily life."], ["outside", "Walk one block farther than usual."], ["family", "Swap favorite songs for 10 minutes."], ["quick", "Wipe down one messy surface."],
  ["creative", "Take a photo of something ordinary and make it look cinematic."], ["funny", "Invent a terrible slogan for toothpaste."], ["outside", "Stand outside and listen carefully for one full minute."], ["family", "Choose a random old photo and talk about it."], ["quick", "Send one thank-you text."]
];

const categorySelect = document.getElementById("categorySelect");
const customCategory = document.getElementById("customCategory");
const resultCategory = document.getElementById("resultCategory");
const resultTitle = document.getElementById("resultTitle");
const favoritesList = document.getElementById("favoritesList");
const customForm = document.getElementById("customForm");
const customText = document.getElementById("customText");
let currentChallenge = null;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{"custom":[],"favorites":[]}');
  } catch {
    return { custom: [], favorites: [] };
  }
}
function saveState(state) { localStorage.setItem(storageKey, JSON.stringify(state)); }
function allChallenges() {
  const state = loadState();
  return [
    ...builtInChallenges.map(([category, text]) => ({ id: `${category}:${text}`, category, text })),
    ...state.custom
  ];
}
function renderSelects() {
  const options = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  categorySelect.innerHTML = options;
  customCategory.innerHTML = categories.filter((item) => item !== "all").map((category) => `<option value="${category}">${category}</option>`).join("");
}
function generateChallenge() {
  const category = categorySelect.value;
  const pool = allChallenges().filter((challenge) => category === "all" || challenge.category === category);
  currentChallenge = pool[Math.floor(Math.random() * pool.length)] || null;
  if (!currentChallenge) {
    resultCategory.textContent = "Nothing saved there yet";
    resultTitle.textContent = "Add a custom challenge first.";
    return;
  }
  resultCategory.textContent = currentChallenge.category;
  resultTitle.textContent = currentChallenge.text;
}
function renderFavorites() {
  const state = loadState();
  if (state.favorites.length === 0) {
    favoritesList.innerHTML = `<p>No favorites saved yet.</p>`;
    return;
  }
  favoritesList.innerHTML = state.favorites.map((item) => `<div class="favorite-item"><strong>${item.category}</strong><br />${item.text}</div>`).join("");
}

document.getElementById("generateButton").addEventListener("click", generateChallenge);
document.getElementById("favoriteButton").addEventListener("click", () => {
  if (!currentChallenge) return;
  const state = loadState();
  if (!state.favorites.some((item) => item.id === currentChallenge.id)) {
    state.favorites.unshift(currentChallenge);
    saveState(state);
    renderFavorites();
  }
});
customForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = customText.value.trim();
  if (!text) return;
  const state = loadState();
  state.custom.unshift({ id: crypto.randomUUID(), category: customCategory.value, text });
  saveState(state);
  customForm.reset();
  renderFavorites();
});

renderSelects();
renderFavorites();
