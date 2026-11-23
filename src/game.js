
import {
  playEffect,
  playReaction,
  setSoundEnabled,
  stopAllSounds
} from "./audio.js";

import { processGift } from "./gifts.js";
import { TEAMS } from "./teams.js";
import { connectLive } from "./live.js";

let currentTeam = "fb";
let health = 100;
let soundEnabled = true;
let actionLocked = false;

const fighter = document.getElementById("fighter");
const healthBar = document.getElementById("healthBar");
const speechBubble = document.getElementById("speechBubble");
const impactEffect = document.getElementById("impactEffect");
const announcement = document.getElementById("giftAnnouncement");
const teamName = document.getElementById("teamName");
const shirtName = document.getElementById("shirtName");

function updateHealth(damage) {
  health = Math.max(0, health - Number(damage || 0));

  if (healthBar) {
    healthBar.style.width = `${health}%`;
    healthBar.dataset.health = String(health);
  }

  if (health <= 20 && health > 0 && speechBubble) {
    speechBubble.textContent = "Artık dayanamıyorum!";
  }

  if (health <= 0) {
    if (speechBubble) speechBubble.textContent = "Tamam, pes ediyorum!";
    if (announcement) announcement.textContent = "KARAKTER PES ETTİ!";
  }
}

function resetHealth() {
  health = 100;
  if (healthBar) {
    healthBar.style.width = "100%";
    healthBar.dataset.health = "100";
  }
  if (speechBubble) speechBubble.textContent = "Yeniden hazırım!";
  if (announcement) announcement.textContent = "YENİ RAUNT!";
}

window.applyGiftDamage = updateHealth;

const animations = {
  slap: { css: "hit", effect: "ŞAP!", sound: "slap", reaction: "slap", damage: 5 },
  punch: { css: "punch", effect: "POW!", sound: "punch", reaction: "punch", damage: 7 },
  lightPunch: { css: "punch", effect: "POW!", sound: "punch", reaction: "punch", damage: 3 },
  kick: { css: "kick", effect: "BOOM!", sound: "kick", reaction: "kick", damage: 9 },
  stick: { css: "special", effect: "💥 SOPA!", sound: "stick", reaction: "stick", damage: 13 },
  combo: { css: "combo", effect: "ŞAP! ŞAP! ŞAP!", sound: "combo", reaction: "combo", damage: 12 },
  specialPunch: { css: "special", effect: "👊 ÖZEL YUMRUK!", sound: "special", reaction: "special", damage: 14 },
  bigHit: { css: "special", effect: "💥 BÜYÜK DARBE!", sound: "special", reaction: "special", damage: 22 },
  special: { css: "special", effect: "⚡ ÖZEL SALDIRI!", sound: "special", reaction: "special", damage: 18 }
};

function animateAttack(type) {
  const config = animations[type];
  if (!config || actionLocked || !fighter) return;

  if (health <= 0) resetHealth();

  actionLocked = true;
  fighter.classList.remove("hit", "punch", "kick", "combo", "special");
  void fighter.offsetWidth;
  fighter.classList.add(config.css);

  if (impactEffect) impactEffect.textContent = config.effect;
  if (announcement) announcement.textContent = config.effect;

  playEffect(config.sound);
  if (soundEnabled) playReaction(config.reaction);
  updateHealth(config.damage);

  setTimeout(() => {
    fighter.classList.remove(config.css);
    actionLocked = false;
  }, 850);
}

const attackButtons = {
  slap: "slap",
  punch: "punch",
  kick: "kick",
  stick: "stick"
};

document.querySelectorAll("[data-attack]").forEach(button => {
  button.addEventListener("click", () => {
    const action = attackButtons[button.dataset.attack];
    if (action) animateAttack(action);
  });
});

function setTeam(teamId) {
  const team = TEAMS[teamId];
  if (!team || !fighter) return false;

  currentTeam = teamId;
  window.currentTeam = currentTeam;

  fighter.classList.remove("fb", "gs", "bjk");
  fighter.classList.add(team.id);

  if (teamName) teamName.textContent = team.name;
  if (shirtName) shirtName.textContent = team.shirt;
  if (speechBubble) speechBubble.textContent = team.slogan;
  if (announcement) announcement.textContent = team.slogan;

  if (soundEnabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(team.slogan);
    voice.lang = "tr-TR";
    voice.rate = 1;
    voice.pitch = 1;
    window.speechSynthesis.speak(voice);
  }

  return true;
}

window.setGameTeam = setTeam;

function handleGift(event) {
  if (event) processGift(event);
}

window.handleGiftEvent = handleGift;
window.addEventListener("tiktok-gift", event => {
  handleGift(event.detail);
});

document.getElementById("fullscreenBtn")?.addEventListener("click", async () => {
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

document.getElementById("soundBtn")?.addEventListener("click", event => {
  soundEnabled = !soundEnabled;
  setSoundEnabled(soundEnabled);
  event.currentTarget.textContent = soundEnabled ? "🔊 SES AÇIK" : "🔇 SES KAPALI";
  if (!soundEnabled) stopAllSounds();
});

window.addEventListener("keydown", event => {
  const keys = { "1": "slap", "2": "punch", "3": "kick", "4": "stick" };
  if (keys[event.key]) animateAttack(keys[event.key]);
});

window.addEventListener("contextmenu", event => event.preventDefault());

if (healthBar) {
  healthBar.style.width = "100%";
  healthBar.dataset.health = "100";
}

window.currentTeam = currentTeam;
window.addEventListener("load", connectLive);

console.log("TİKTOK DÖVÜŞ ARENASI HAZIR");
