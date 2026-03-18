const storageKey = "habit-streak-tracker";
const habitsGrid = document.getElementById("habitsGrid");
const habitForm = document.getElementById("habitForm");
const habitNameInput = document.getElementById("habitNameInput");

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function loadHabits() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(storageKey, JSON.stringify(habits));
}

function calcStreak(history) {
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = todayKey(cursor);
    if (!history.includes(key)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calcBestStreak(history) {
  const sorted = [...history].sort();
  let best = 0;
  let current = 0;
  let previousDate = null;

  sorted.forEach((dateKey) => {
    const currentDate = new Date(`${dateKey}T00:00:00`);
    if (!previousDate) {
      current = 1;
    } else {
      const diffDays = Math.round((currentDate - previousDate) / 86400000);
      current = diffDays === 1 ? current + 1 : 1;
    }
    best = Math.max(best, current);
    previousDate = currentDate;
  });

  return best;
}

function buildHistoryPreview(history) {
  const days = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = todayKey(date);
    days.push({
      label: date.toLocaleDateString(undefined, { weekday: "narrow" }),
      done: history.includes(key)
    });
  }
  return days;
}

function renderHabits() {
  const habits = loadHabits();

  if (habits.length === 0) {
    habitsGrid.innerHTML = `<div class="empty-state">No habits yet. Add one above and start your streak.</div>`;
    return;
  }

  habitsGrid.innerHTML = habits.map((habit) => {
    const currentStreak = calcStreak(habit.history);
    const bestStreak = calcBestStreak(habit.history);
    const todayDone = habit.history.includes(todayKey());
    const historyPreview = buildHistoryPreview(habit.history);

    return `
      <article class="habit-card">
        <div class="habit-header">
          <h2 class="habit-name">${habit.name}</h2>
          <button class="secondary" type="button" data-delete="${habit.id}">Delete</button>
        </div>
        <div class="stat-row">
          <span class="stat">Current ${currentStreak}</span>
          <span class="stat">Best ${bestStreak}</span>
        </div>
        <div class="history-grid">
          ${historyPreview.map((day) => `<div class="history-day${day.done ? " done" : ""}">${day.label}</div>`).join("")}
        </div>
        <div class="habit-actions">
          <button type="button" data-toggle="${habit.id}">${todayDone ? "Uncheck today" : "Check off today"}</button>
        </div>
      </article>
    `;
  }).join("");

  habitsGrid.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const habits = loadHabits().map((habit) => {
        if (habit.id !== button.dataset.toggle) return habit;
        const key = todayKey();
        const history = habit.history.includes(key)
          ? habit.history.filter((item) => item !== key)
          : [...habit.history, key];
        return { ...habit, history };
      });
      saveHabits(habits);
      renderHabits();
    });
  });

  habitsGrid.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      saveHabits(loadHabits().filter((habit) => habit.id !== button.dataset.delete));
      renderHabits();
    });
  });
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = habitNameInput.value.trim();
  if (!name) return;
  const habits = loadHabits();
  habits.unshift({ id: crypto.randomUUID(), name, history: [] });
  saveHabits(habits);
  habitForm.reset();
  renderHabits();
});

renderHabits();
