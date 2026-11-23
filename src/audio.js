
let audioContext = null;
let soundEnabled = true;
let activeThemeTimers = [];

const TEAM_VOICES = {
  fb: {
    intro: "Dikkat! Sahaya Fenerbahçe çıkıyor! Yaşa Fenerbahçe! Sarı lacivert!",
    chant: "Fenerbahçe! Fenerbahçe! En büyük Fenerbahçe!",
    notes: [392, 440, 523, 440, 392, 330, 392, 523]
  },
  gs: {
    intro: "Dikkat! Sahaya Galatasaray çıkıyor! Cim Bom Bom! Şampiyon Galatasaray!",
    chant: "Galatasaray! Galatasaray! Cimbom!",
    notes: [330, 392, 440, 523, 440, 392, 330, 392]
  },
  bjk: {
    intro: "Dikkat! Sahaya Beşiktaş çıkıyor! Kara Kartal! Şanlı Beşiktaş!",
    chant: "Beşiktaş! Beşiktaş! Kara Kartal!",
    notes: [294, 349, 392, 440, 392, 349, 294, 392]
  }
};

function getAudioContext() {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(console.warn);
  }

  return audioContext;
}

export function unlockAudio() {
  const ctx = getAudioContext();

  if (!ctx) return false;

  if (ctx.state === "suspended") {
    ctx.resume().catch(console.warn);
  }

  return true;
}

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);

  if (!soundEnabled) {
    stopAllSounds();
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

function tone(frequency, duration = 0.15, type = "sawtooth", volume = 0.12) {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function noiseHit(duration = 0.12, volume = 0.2) {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}

export function playEffect(type) {
  if (!soundEnabled) return;

  switch (type) {
    case "slap":
      noiseHit(0.13, 0.28);
      tone(150, 0.12, "square", 0.12);
      break;

    case "punch":
      noiseHit(0.16, 0.3);
      tone(90, 0.18, "sawtooth", 0.16);
      break;

    case "kick":
      noiseHit(0.2, 0.32);
      tone(65, 0.2, "triangle", 0.2);
      break;

    case "stick":
      noiseHit(0.2, 0.35);
      tone(260, 0.16, "square", 0.16);
      break;

    case "combo":
      noiseHit(0.12, 0.3);
      setTimeout(() => noiseHit(0.12, 0.3), 140);
      setTimeout(() => noiseHit(0.12, 0.3), 280);
      break;

    case "special":
      tone(300, 0.2, "sawtooth", 0.22);
      tone(180, 0.28, "triangle", 0.2);
      break;

    case "crown":
      tone(600, 0.25, "sine", 0.2);
      setTimeout(() => tone(800, 0.3, "sine", 0.2), 180);
      break;

    default:
      tone(120, 0.15);
  }
}

export function speakCharacter(message) {
  if (!soundEnabled || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "tr-TR";
  utterance.rate = 1.02;
  utterance.pitch = 1.12;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const turkishVoice = voices.find(voice =>
    voice.lang.toLowerCase().startsWith("tr")
  );

  if (turkishVoice) {
    utterance.voice = turkishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function playTeamIntro(teamId) {
  if (!soundEnabled) return;

  const team = TEAM_VOICES[teamId];
  if (!team) return;

  stopTeamTheme();

  const ctx = getAudioContext();
  if (!ctx) return;

  // Özgün, kısa tribün melodisi; gerçek kulüp marşı kaydı değildir.
  team.notes.forEach((note, index) => {
    const timer = setTimeout(() => {
      if (soundEnabled) {
        tone(note, 0.24, "triangle", 0.13);
        tone(note / 2, 0.28, "sine", 0.07);
      }
    }, index * 240);

    activeThemeTimers.push(timer);
  });

  const speechTimer = setTimeout(() => {
    speakCharacter(team.intro);
  }, 2100);

  activeThemeTimers.push(speechTimer);
}

export function playTeamChant(teamId) {
  const team = TEAM_VOICES[teamId];
  if (!team) return;

  speakCharacter(team.chant);
}

export function stopTeamTheme() {
  activeThemeTimers.forEach(clearTimeout);
  activeThemeTimers = [];
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
      "Anaaa! Belim gitti!",
      "Yapma artık!",
      "Yere yıkıldım!"
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
      "Ohaaa! Bu nasıl darbe!",
      "Ben gidiyorum!",
      "İmdat!"
    ]
  };

  const list = reactions[type] || reactions.punch;
  const message = list[Math.floor(Math.random() * list.length)];

  speakCharacter(message);
  return message;
}

export function stopAllSounds() {
  stopTeamTheme();

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
