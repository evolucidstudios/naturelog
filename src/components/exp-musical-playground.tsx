"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type SoundMode = {
  id: string;
  name: string;
  root: string;
  frequencies: number[];
};

type TonePad = {
  id: string;
  label: string;
  note: string;
  frequency: number;
  hue: string;
  accent: string;
  delay: string;
  rotation: string;
};

const HUES = [
  ["#0da7b8", "#61c7d9"],
  ["#0e9ba8", "#55c6e0"],
  ["#1a86a8", "#688ce0"],
  ["#148fa1", "#42d0c8"],
  ["#207fb0", "#5c8fd7"],
  ["#13829c", "#4dc5c5"],
  ["#2d72ab", "#45b7d1"],
  ["#0e8f95", "#4aa9d8"],
  ["#3575ab", "#4bc4d2"],
  ["#1f8ca8", "#6c90d1"],
  ["#0f9c93", "#59b8da"],
  ["#1d6f9d", "#74b7cb"],
] as const;

const ROTATIONS = ["-6deg", "4deg", "-2deg", "5deg", "-4deg", "3deg", "-1deg", "4deg", "-5deg", "3deg", "-3deg", "6deg"];

const SOUND_MODES: SoundMode[] = [
  {
    id: "pentatonic-bloom",
    name: "Pentatonic Bloom",
    root: "C",
    frequencies: [130.81, 146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25, 587.33],
  },
  {
    id: "glass-tide",
    name: "Glass Tide",
    root: "D",
    frequencies: [146.83, 164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25],
  },
  {
    id: "sun-circuit",
    name: "Sun Circuit",
    root: "A",
    frequencies: [110.0, 123.47, 146.83, 164.81, 220.0, 246.94, 293.66, 329.63, 440.0, 493.88, 587.33, 659.25],
  },
  {
    id: "moon-metal",
    name: "Moon Metal",
    root: "E",
    frequencies: [164.81, 185.0, 220.0, 246.94, 277.18, 329.63, 369.99, 440.0, 493.88, 554.37, 659.25, 739.99],
  },
  {
    id: "desert-lights",
    name: "Desert Lights",
    root: "G",
    frequencies: [98.0, 123.47, 146.83, 196.0, 220.0, 246.94, 293.66, 392.0, 440.0, 493.88, 587.33, 783.99],
  },
  {
    id: "blue-orbit",
    name: "Blue Orbit",
    root: "F",
    frequencies: [174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99],
  },
  {
    id: "neon-rain",
    name: "Neon Rain",
    root: "Bb",
    frequencies: [116.54, 146.83, 174.61, 233.08, 261.63, 293.66, 349.23, 466.16, 523.25, 587.33, 698.46, 932.33],
  },
];

function createAudioContext() {
  const AudioContextClass =
    globalThis.AudioContext ||
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  return AudioContextClass ? new AudioContextClass() : null;
}

function noteNameFromFrequency(frequency: number) {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midiNumber = Math.round(12 * Math.log2(frequency / 440) + 69);
  const octave = Math.floor(midiNumber / 12) - 1;
  return `${noteNames[((midiNumber % 12) + 12) % 12]}${octave}`;
}

function formatStatus(label: string, mode: string) {
  return `${mode}: ${label}`;
}

function buildPads(mode: SoundMode) {
  return mode.frequencies.map((frequency, index) => ({
    id: `${mode.id}-${index}`,
    label: String(index + 1).padStart(2, "0"),
    note: noteNameFromFrequency(frequency),
    frequency,
    hue: HUES[index % HUES.length][0],
    accent: HUES[index % HUES.length][1],
    delay: `${index * 35}ms`,
    rotation: ROTATIONS[index % ROTATIONS.length],
  })) satisfies TonePad[];
}

export function ExpMusicalPlayground() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [activePad, setActivePad] = useState<string | null>(null);
  const [modeId, setModeId] = useState(SOUND_MODES[0].id);
  const [status, setStatus] = useState("Touch a shape and let it ring.");
  const mode = SOUND_MODES.find((item) => item.id === modeId) ?? SOUND_MODES[0];
  const pads = useMemo(() => buildPads(mode), [mode]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const playPad = async (pad: TonePad) => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) {
      setStatus("Audio is not available on this device.");
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;
    const masterGain = audioContext.createGain();
    const shimmerGain = audioContext.createGain();
    const lowGain = audioContext.createGain();
    const bodyOscillator = audioContext.createOscillator();
    const shimmerOscillator = audioContext.createOscillator();
    const lowOscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();

    bodyOscillator.type = "sawtooth";
    bodyOscillator.frequency.setValueAtTime(pad.frequency, now);

    shimmerOscillator.type = "triangle";
    shimmerOscillator.frequency.setValueAtTime(pad.frequency * 2, now);

    lowOscillator.type = "sine";
    lowOscillator.frequency.setValueAtTime(pad.frequency / 2, now);

    lfo.type = "sine";
    lfo.frequency.setValueAtTime(5.5, now);
    lfoGain.gain.setValueAtTime(18, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.setValueAtTime(2.4, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.15);

    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    lowGain.gain.setValueAtTime(0.09, now);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    bodyOscillator.connect(filter);
    shimmerOscillator.connect(shimmerGain);
    lowOscillator.connect(lowGain);
    filter.connect(masterGain);
    shimmerGain.connect(masterGain);
    lowGain.connect(masterGain);
    masterGain.connect(audioContext.destination);

    lfo.start(now);
    bodyOscillator.start(now);
    lowOscillator.start(now);
    shimmerOscillator.start(now);

    lfo.stop(now + 2.2);
    bodyOscillator.stop(now + 2.2);
    lowOscillator.stop(now + 2.0);
    shimmerOscillator.stop(now + 1.4);

    setActivePad(pad.id);
    setStatus(formatStatus(pad.note, mode.name));

    window.setTimeout(() => {
      setActivePad((current) => (current === pad.id ? null : current));
    }, 260);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.18),transparent_18%),radial-gradient(circle_at_top_right,rgba(57,104,171,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(14,155,168,0.12),transparent_26%),linear-gradient(155deg,#040812_0%,#08131f_24%,#0d2333_52%,#09131d_100%)] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl flex-col">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8adfeb]/58">
              Musical Experiment
            </p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/74 sm:text-base">
              Seven sound worlds. Same shapes. Different glow.
            </p>
          </div>
          <Link
            href="/exp/index.html"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#7fc9d9]/18 bg-white/6 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8f4f8] backdrop-blur transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            Back home
          </Link>
        </header>

        <section className="relative mt-6 flex-1 overflow-hidden rounded-[34px] border border-[#7bb8c7]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur sm:p-6">
          <div className="pointer-events-none absolute -left-16 top-6 h-48 w-48 rounded-full bg-[#1aa8ba]/14 blur-3xl" />
          <div className="pointer-events-none absolute right-[-3rem] top-1/3 h-56 w-56 rounded-full bg-[#3c6cae]/14 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-3rem] left-1/4 h-60 w-60 rounded-full bg-[#0e8f95]/12 blur-3xl" />

          <div className="relative flex h-full flex-col">
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8ed5df]/62">
                    Scale
                  </span>
                  <select
                    value={mode.id}
                    onChange={(event) => {
                      const nextMode =
                        SOUND_MODES.find((item) => item.id === event.target.value) ?? SOUND_MODES[0];
                      setModeId(nextMode.id);
                      setStatus(`${nextMode.name} ready.`);
                    }}
                    className="h-11 rounded-full border border-[#79b4c3]/16 bg-[rgba(255,255,255,0.06)] px-4 pr-10 text-sm font-medium text-white outline-none backdrop-blur"
                  >
                    {SOUND_MODES.map((soundMode) => (
                      <option key={soundMode.id} value={soundMode.id} className="bg-[#08131f] text-white">
                        {soundMode.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs text-white/80">
                  {mode.root} root · {status}
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pads.map((pad) => {
                const isActive = activePad === pad.id;

                return (
                  <button
                    key={pad.id}
                    type="button"
                    onPointerDown={() => {
                      void playPad(pad);
                    }}
                    className="group relative aspect-square overflow-hidden rounded-[28px] border border-white/10 text-left transition-all duration-200 active:scale-[0.97]"
                    style={{
                      transform: `rotate(${pad.rotation})`,
                      animation: `floatIn 0.7s ease-out ${pad.delay} both`,
                      background: `linear-gradient(145deg, ${pad.accent}16 0%, ${pad.hue}bb 50%, #050b14 100%)`,
                      boxShadow: isActive
                        ? `0 0 0 1px ${pad.accent}, 0 0 18px ${pad.accent}, 0 20px 48px ${pad.hue}33`
                        : `0 0 10px ${pad.hue}14, 0 18px 36px rgba(0,0,0,0.34)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_34%),linear-gradient(180deg,transparent,rgba(1,8,22,0.58))]" />
                    <div className="absolute inset-3 rounded-[22px] border border-white/10" />
                    <div
                      className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: pad.accent, boxShadow: `0 0 10px ${pad.accent}` }}
                    />
                    <div className="absolute right-4 top-4 text-[10px] font-semibold tracking-[0.16em] text-white/58">
                      {pad.label}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/52">
                        Tone
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">{pad.note}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
