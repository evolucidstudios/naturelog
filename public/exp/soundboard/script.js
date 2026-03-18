const soundSlots = [
  { name: "Air Horn", frequency: 180, color: "#ff5ca8" },
  { name: "Laser", frequency: 620, color: "#8b5cf6" },
  { name: "Boop", frequency: 420, color: "#14b8a6" },
  { name: "Ding", frequency: 520, color: "#f59e0b" },
  { name: "Buzz", frequency: 110, color: "#ef4444" },
  { name: "Blip", frequency: 700, color: "#22c55e" },
  { name: "Drop", frequency: 260, color: "#38bdf8" },
  { name: "Bongo", frequency: 145, color: "#fb7185" },
  { name: "Glow", frequency: 480, color: "#a3e635" },
  { name: "Zap", frequency: 760, color: "#f97316" },
  { name: "Thunk", frequency: 130, color: "#f472b6" },
  { name: "Ping", frequency: 540, color: "#2dd4bf" }
];

const board = document.getElementById("board");
const stopAllButton = document.getElementById("stopAllButton");
const activeNodes = [];
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.55);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.58);
  activeNodes.push(oscillator);
}

function stopAllSounds() {
  while (activeNodes.length > 0) {
    const node = activeNodes.pop();
    try { node.stop(); } catch {}
  }
}

soundSlots.forEach((slot) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sound-button";
  button.style.background = `linear-gradient(135deg, ${slot.color}, rgba(255,255,255,0.22))`;
  button.textContent = slot.name;
  button.addEventListener("click", async () => {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    playTone(slot.frequency);
  });
  board.appendChild(button);
});

stopAllButton.addEventListener("click", stopAllSounds);
