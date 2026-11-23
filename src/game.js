
import {
  playEffect,
  playReaction,
  setSoundEnabled,
  stopAllSounds
} from "./audio.js";

import {
  processGift
} from "./gifts.js";

import {
  TEAMS
} from "./teams.js";

import {
  connectLive
} from "./live.js";

// OYUN DURUMU
let currentTeam = "fb";
let health = 100;
let soundEnabled = true;
let actionLocked = false;

// HTML ELEMANLARI
const fighter = document.getElementById("fighter");
const healthBar = document.getElementById("healthBar");
const speechBubble = document.getElementById("speechBubble");
const impactEffect = document.getElementById("impactEffect");
const announcement = document.getElementById("giftAnnouncement");
const teamName = document.getElementById("teamName");
const shirtName = document.getElementById("shirtName");
const lastGift = document.getElementById("lastGift");
const lastUser = document.getElementById("lastUser");

// CAN SİSTEMİ
function updateHealth(damage) {
  health = Math.max(0, health - damage);

  healthBar.style.width = `${health}%`;
  healthBar.dataset.health = String(health);

  if (health <= 20 && health > 0) {
    speechBubble.textContent = "Artık dayanamıyorum!";
  }

  if (health <= 0) {
    speechBubble.textContent = "Tamam, pes ediyorum!";
    announcement.textContent = "KARAKTER PES ETTİ!";
  }
}

function resetHealth() {
  health = 100;
  healthBar.style.width = "100%";
  healthBar.dataset.health = "100";

  speechBubble.textContent = "Yeniden hazırım!";
  announcement.textContent = "YENİ RAUNT!";
}

// ANİMASYON SİSTEMİ
const animations = {
  slap: {
    css: "hit",
    effect: "ŞAP!",
    sound: "slap",
    reaction: "slap",
    damage: 5
  },

  punch: {
    css: "punch",
    effect: "POW!",
    sound: "punch",
    reaction: "punch",
    damage: 7
  },

  lightPunch: {
    css: "punch",
    effect: "POW!",
    sound: "punch",
    reaction: "punch",
    damage: 3
  },

  kick: {
    css: "kick",
    effect: "BOOM!",
    sound: "kick",
    reaction: "kick",
    damage: 9
  },

  stick: {
    css: "special",
    effect: "💥 SOPA!",
    sound: "stick",
    reaction: "stick",
    damage: 13
  },

  combo: {
    css: "combo",
    effect: "ŞAP! ŞAP! ŞAP!",
    sound: "combo",
    reaction: "combo",
    damage: 12
  },

  specialPunch: {
    css: "special",
    effect: "👊 ÖZEL YUMRUK!",
    sound: "special",
    reaction: "special",
    damage: 14
  },

  bigHit: {
    css: "special",
    effect: "💥 BÜYÜK DARBE!",
    sound: "special",
    reaction: "special",
    damage: 22
  },

  special: {
    css: "special",
    effect: "⚡ ÖZEL SALDIRI!",
    sound: "special",
    reaction: "special",
    damage: 18
  }
};

// SALDIRI MOTORU
function animateAttack(type) {
  const config = animations[type];

  if (!config || actionLocked) return;

  if (health <= 0) {
    resetHealth();
  }

  actionLocked = true;

  fighter.classList.remove(
    "hit",
    "punch",
    "kick",
    "combo",
    "special"
  );

  void fighter.offsetWidth;

  fighter.classList.add(config.css);

  impactEffect.textContent = config.effect;

  announcement.textContent = config.effect;

  playEffect(config.sound);

  if (soundEnabled) {
    playReaction(config.reaction);
  }

  updateHealth(config.damage);

  setTimeout(() => {
    fighter.classList.remove(config.css);
    actionLocked = false;
  }, 850);
}

// ELLE SALDIRI BUTONLARI
const attackButtons = {
  slap: "slap",
  punch: "punch",
  kick: "kick",
  stick: "stick"
};

document.querySelectorAll("[data-attack]").forEach(button => {
  button.addEventListener("click", () => {
    const action = attackButtons[button.dataset.attack];

    if (action) {
      animateAttack(action);
    }
  });
});

// TAKIM SİSTEMİ
function setTeam(teamId) {
  const team = TEAMS[teamId];

  if (!team) return;

  currentTeam = teamId;
  window.currentTeam = currentTeam;

  fighter.classList.remove("fb", "gs", "bjk");
  fighter.classList.add(team.id);

  teamName.textContent = team.name;
  shirtName.textContent = team.shirt;

  const slogan = team.slogan;

  speechBubble.textContent = slogan;
  announcement.textContent = slogan;

  if (soundEnabled && "speechSynthesis" in window) {
    speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(slogan);

    voice.lang = "tr-TR";
    voice.rate = 1;
    voice.pitch = 1;

    speechSynthesis.speak(voice);
  }
}

// TAÇ İLE TAKIM DEĞİŞTİRME
function handleCrown() {
  const nextTeams = {
    fb: "gs",
    gs: "bjk",
    bjk: "fb"
  };

  const nextTeam = nextTeams[currentTeam];

  if (!nextTeam) return;

  playEffect("crown");
  setTeam(nextTeam);
}

// HEDİYE BİLDİRİMLERİ
function updateGiftInfo(event) {
  const username =
    event.username ||
    event.user ||
    "İzleyici";

  const giftName =
    event.giftName ||
    event.gift ||
    "Hediye";

  if (lastGift) {
    lastGift.textContent = giftName;
  }

  if (lastUser) {
    lastUser.textContent = username;
  }

  announcement.textContent =
    `${username} → ${giftName}`;
}

// TIKTOK HEDİYE MOTORU
function handleGift(event) {
  if (!event) return;

  const giftName = String(
    event.giftName || event.gift || ""
  ).toLocaleLowerCase("tr-TR");

  updateGiftInfo(event);

  if (
    giftName === "crown" ||
    giftName === "taç"
  ) {
    handleCrown();
    return;
  }

  const giftTypes = {
    rose: "slap",
    coffee: "lightPunch",
    evil: "lightPunch",
    bouquet: "combo",
    rosa: "specialPunch",
    wand: "bigHit",
    glasses: "special"
  };

  const giftId = event.gift;

  const action = giftTypes[giftId];

  if (action) {
    animateAttack(action);
    return;
  }

  processGift(event);
}

// DIŞ BAĞLANTIDAN HEDİYE ALMA
window.handleGiftEvent = handleGift;

window.addEventListener("tiktok-gift", event => {
  handleGift(event.detail);
});

// TAM EKRAN
const fullscreenButton =
  document.getElementById("fullscreenBtn");

fullscreenButton?.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error("Tam ekran hatası:", error);
  }
});

// SES AÇMA / KAPATMA
const soundButton =
  document.getElementById("soundBtn");

soundButton?.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  setSoundEnabled(soundEnabled);

  soundButton.textContent = soundEnabled
    ? "🔊 SES AÇIK"
    : "🔇 SES KAPALI";

  if (!soundEnabled) {
    stopAllSounds();
  }
});

// KLAVYE KONTROLLERİ
window.addEventListener("keydown", event => {
  const keys = {
    "1": "slap",
    "2": "punch",
    "3": "kick",
    "4": "stick"
  };

  const action = keys[event.key];

  if (action) {
    animateAttack(action);
  }
});

// MOBİL BAŞLANGIÇ
window.addEventListener("contextmenu", event => {
  event.preventDefault();
});

// İLK DURUM
healthBar.style.width = "100%";
healthBar.dataset.health = "100";

window.currentTeam = currentTeam;

// TIKTOK LIVE BAĞLANTISI
window.addEventListener("load", () => {
  connectLive();
});

console.log("TİKTOK DÖVÜŞ ARENASI HAZIR");
