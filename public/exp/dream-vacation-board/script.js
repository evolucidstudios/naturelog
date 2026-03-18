const storageKey = "dream-vacation-board";
const destinationForm = document.getElementById("destinationForm");
const board = document.getElementById("board");

function loadTrips() {
  try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
}
function saveTrips(trips) { localStorage.setItem(storageKey, JSON.stringify(trips)); }
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Image read failed"));
    reader.readAsDataURL(file);
  });
}
function renderTrips() {
  const trips = loadTrips();
  if (trips.length === 0) {
    board.innerHTML = `<div class="empty-state">No destinations saved yet.</div>`;
    return;
  }
  board.innerHTML = trips.map((trip) => `
    <article class="destination-card">
      <img src="${trip.image}" alt="${trip.name}" />
      <div class="destination-body">
        <div class="badge-row">
          <span class="badge">${"★".repeat(Number(trip.rating))}</span>
          ${trip.mostWanted ? `<span class="badge">Most wanted</span>` : ""}
        </div>
        <h2>${trip.name}</h2>
        <p>${trip.notes || "No notes yet."}</p>
        <button data-delete="${trip.id}" type="button">Delete</button>
      </div>
    </article>
  `).join("");
  board.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      saveTrips(loadTrips().filter((trip) => trip.id !== button.dataset.delete));
      renderTrips();
    });
  });
}

destinationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = document.getElementById("destinationImage").files?.[0];
  if (!file) return;
  const trips = loadTrips();
  trips.unshift({
    id: crypto.randomUUID(),
    name: document.getElementById("destinationName").value.trim(),
    image: await readFile(file),
    notes: document.getElementById("destinationNotes").value.trim(),
    rating: document.getElementById("destinationRating").value,
    mostWanted: document.getElementById("destinationWanted").checked
  });
  saveTrips(trips);
  destinationForm.reset();
  renderTrips();
});

renderTrips();
