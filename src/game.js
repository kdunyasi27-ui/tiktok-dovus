
import {
  playEffect,
  playReaction,
  setSoundEnabled,
  isSoundEnabled,
  stopAllSounds
} from "./audio.js";

import { processGift } from "./gifts.js";

import { TEAMS, changeTeam } from "./teams.js";

let currentTeam = "fb";
let health = 100;
let soundEnabled = true;
let actionLocked = false;

const fighter = document.getElementById("fighter");
const healthBar = document.getElementById("healthBar");
const speechBubble = document.getElementById("speechBubble");
const impactEffect = document.getElementById("impactEffect");
const announcement = document.getElementById("giftAnnouncement");

function updateHealth(damage) {
  health = Math.max(0, health - damage);

  healthBar.style.width = `${health}%`;
  healthBar.dataset.health = String(health);

  if (health <= 0) {
    speechBubble.textContent = "Tamam, pes ediyorum!";
    announcement.textContent = "KARAKTER PES ETTİ!";
    return;
  }

  if (health <= 20) {
    speechBubble.textContent = "Artık dayanamıyorum!";
  }
}

function resetHealth() {
  health = 100;
  healthBar.style.width = "100%";
  healthBar.dataset.health = "100";
  speechBubble.textContent = "Yeniden hazırım!";
  announcement.textContent = "YENİ RAUNT!";
}

function animateAttack(type, damage) {
  if (actionLocked) return;

  if (health <= 0) {
    resetHealth();
  }

  actionLocked = true;

  const animations = {
    slap: {
      css: "hit",
      effect: "ŞAP!",
      reaction: "slap",
      sound: "slap"
    },

    punch: {
      css: "punch",
      effect: "POW!",
      reaction: "punch",
      sound: "punch"
    },

    kick: {
      css: "kick",
      effect: "BOOM!",
      reaction: "kick",
      sound: "kick"
    },

    stick: {
      css: "special",
      effect: "💥",
      reaction: "stick",
      sound: "stick"
    },

    combo: {
      css: "combo",
      effect: "ŞAP! ŞAP! ŞAP!",
      reaction: "combo",
      sound: "combo"
    },

    special: {
      css: "special",
      effect: "⚡ ÖZEL SALDIRI!",
      reaction: "special",
      sound: "special"
    }
  };

  const attack = animations[type];

  if (!attack) {
    actionLocked = false;
    return;
  }

  fighter.classList.remove(
    "hit", "punch", "kick", "combo", "special"
  );

  void fighter.offsetWidth;

  fighter.classList.add(attack.css);

  impactEffect.textContent = attack.effect;

  playEffect(attack.sound);
  playReaction(attack.reaction);

  updateHealth(damage);

  announcement.textContent = attack.effect;

  setTimeout(() => {
    fighter.classList.remove(attack.css);
    actionLocked = false;
  }, 850);
}

const attackButtons = {
  slap: ["slap", 5],
  punch: ["punch", 7],
  kick: ["kick", 9],
  stick: ["stick", 13]
};

document.querySelectorAll("[data-attack]").forEach(button => {
  button.addEventListener("click", () => {
    const action = attackButtons[button.dataset.attack];

    if (action) {
      animateAttack(action[0], action[1]);
    }
  });
});

function setTeam(teamId) {
  const team = TEAMS[teamId];

  if (!team) return;

  currentTeam = teamId;

  fighter.classList.remove("fb", "gs", "bjk");
  fighter.classList.add(team.id);

  document.getElementById("teamName").textContent = team.name;
  document.getElementById("shirtName").textContent = team.shirt;

  const slogan =
    team.speech[Math.floor(Math.random() * team.speech.length)];

  speechBubble.textContent = slogan;
  announcement.textContent = slogan;

  if (soundEnabled) {
    const voice = new SpeechSynthesisUtterance(slogan);
    voice.lang = "tr-TR";
    voice.rate = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(voice);
  }
}

function handleCrown() {
  const nextTeam = {
    fb: "gs",
    gs: "bjk",
    bjk: "fb"
  }[currentTeam];

  if (!nextTeam) return;

  playEffect("crown");
  setTeam(nextTeam);
}

function handleGift(event) {
  if (!event) return;

  const giftName = event.giftName || event.gift || "";

  if (
    giftName.toLocaleLowerCase("tr-TR").includes("taç") ||
    giftName.toLowerCase().includes("crown")
  ) {
    handleCrown();
    return;
  }

  processGift(event);
}

window.addEventListener("tiktok-gift", event => {
  handleGift(event.detail);
});

window.handleGiftEvent = handleGift;

const fullscreenButton =
  document.getElementById("fullscreenBtn");

fullscreenButton.addEventListener("click", async () => {
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

const soundButton = document.getElementById("soundBtn");

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  setSoundEnabled(soundEnabled);

  soundButton.textContent = soundEnabled
    ? "🔊 SES AÇIK"
    : "🔇 SES KAPALI";

  if (!soundEnabled) {
    stopAllSounds();
  }
});

window.addEventListener("keydown", event => {
  if (event.key === "1") animateAttack("slap", 5);
  if (event.key === "2") animateAttack("punch", 7);
  if (event.key === "3") animateAttack("kick", 9);
  if (event.key === "4") animateAttack("stick", 13);
});

window.addEventListener("contextmenu", event => {
  event.preventDefault();
});

window.currentTeam = currentTeam;

console.log("TikTok Dövüş Arenası başlatıldı.");
