
let audioContext = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;

  if (!enabled && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function playEffect(type) {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const sounds = {
      slap: [190, 65, "square", 0.16],
      punch: [120, 45, "sawtooth", 0.20],
      kick: [100, 35, "triangle", 0.24],
      stick: [240, 55, "square", 0.22],
      combo: [180, 40, "sawtooth", 0.28],
      special: [300, 35, "sawtooth", 0.35],
      crown: [600, 900, "sine", 0.35]
    };

    const sound = sounds[type] || sounds.punch;

    oscillator.type = sound[2];

    oscillator.frequency.setValueAtTime(
      sound[0],
      ctx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      sound[1],
      ctx.currentTime + 0.15
    );

    gain.gain.setValueAtTime(
      sound[3],
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.22
    );

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.23);

  } catch (error) {
    console.error("Ses hatası:", error);
  }
}

export function speakCharacter(message) {
  if (!soundEnabled) return;

  if (!("speechSynthesis" in window)) {
    console.warn("Sesli konuşma desteklenmiyor.");
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);

  utterance.lang = "tr-TR";
  utterance.rate = 1.08;
  utterance.pitch = 1.15;
  utterance.volume = 1;

  speechSynthesis.speak(utterance);
}

export function playReaction(type) {
  const reactions = {
    slap: [
      "Ağ! Ne yapıyorsun!",
      "Yanağım acıdı!",
      "Ulan ne tokat attın!"
    ],

    punch: [
      "Ulan ne vuruyorsun!",
      "Burnum gitti!",
      "İmdat!"
    ],

    kick: [
      "Anaaa!",
      "Belim gitti!",
      "Yapma artık!"
    ],

    stick: [
      "İmdat sopa!",
      "Tamam pes ediyorum!",
      "Yeter artık!"
    ],

    combo: [
      "Peş peşe vurma!",
      "Yeter! Yeter!",
      "Bir dur be!"
    ],

    special: [
      "Ohaaa!",
      "Bu nasıl darbe!",
      "Ben gidiyorum!"
    ]
  };

  const list = reactions[type] || reactions.punch;

  const message = list[
    Math.floor(Math.random() * list.length)
  ];

  speakCharacter(message);

  return message;
}

export function stopAllSounds() {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}
