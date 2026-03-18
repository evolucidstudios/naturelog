const storageKey = "daily-photo-journal-entries";

const entryForm = document.getElementById("entryForm");
const photoInput = document.getElementById("photoInput");
const captionInput = document.getElementById("captionInput");
const timeline = document.getElementById("timeline");
const clearAllButton = document.getElementById("clearAllButton");

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function renderTimeline() {
  const entries = loadEntries();

  if (entries.length === 0) {
    timeline.innerHTML = `<div class="empty-state">No photo notes yet. Save one from today.</div>`;
    return;
  }

  timeline.innerHTML = entries
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((entry) => `
      <article class="entry">
        <p class="entry-date">${formatDate(entry.date)}</p>
        <div class="entry-card">
          <img src="${entry.image}" alt="Journal entry" />
          <div class="entry-body">
            <p>${entry.caption}</p>
            <button class="delete-button" type="button" data-id="${entry.id}">Delete entry</button>
          </div>
        </div>
      </article>
    `)
    .join("");

  timeline.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextEntries = loadEntries().filter((entry) => entry.id !== button.dataset.id);
      saveEntries(nextEntries);
      renderTimeline();
    });
  });
}

entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = photoInput.files?.[0];
  const caption = captionInput.value.trim();

  if (!file || !caption) {
    return;
  }

  const image = await readFileAsDataUrl(file);
  const entries = loadEntries();

  entries.push({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    caption,
    image
  });

  saveEntries(entries);
  entryForm.reset();
  renderTimeline();
});

clearAllButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderTimeline();
});

renderTimeline();
