
import {
  playEffect,
  playReaction,
  playTeamIntro,
  unlockAudio,
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
const soundButton = document.getElementById("soundBtn");

const ATTACK_DURATION = 850;

function updateHealth(damage) {
  const amount = Math.max(0, Number(damage) || 0);
  health = Math.max(0, health - amount);

  if (healthBar) {
    healthBar.style.width = `${health}%`;
    healthBar.dataset.health = String(health);
  }

  if (health <= 20 && health > 0) {
    if (speechBubble) {
      speechBubble.textContent = "Artık dayanamıyorum!";
    }

    if (soundEnabled) {
      playReaction("special");
    }
  }

  if (health <= 0) {
    if (speechBubble) {
      speechBubble.textContent = "Tamam, pes ediyorum!";
    }

    if (announcement) {
      announcement.textContent = "KARAKTER PES ETTİ!";
    }

    if (soundEnabled) {
      playReaction("stick");
    }
  }
}

function resetHealth() {
  health = 100;

  if (healthBar) {
    healthBar.style.width = "100%";
    healthBar.dataset.health = "100";
  }

  if (speechBubble) {
    speechBubble.textContent = "Yeniden hazırım!";
  }

  if (announcement) {
    announcement.textContent = "YENİ RAUNT!";
  }
}

window.applyGiftDamage = updateHealth;

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

function animateAttack(type) {
  const config = animations[type];

  if (!config || actionLocked || !fighter) return;

  unlockAudio();

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

  if (impactEffect) {
    impactEffect.textContent = config.effect;
    impactEffect.style.opacity = "1";
  }

  if (announcement) {
    announcement.textContent = config.effect;
  }

  if (soundEnabled) {
    playEffect(config.sound);
    playReaction(config.reaction);
  }

  updateHealth(config.damage);

  setTimeout(() => {
    fighter.classList.remove(config.css);

    if (impactEffect) {
      impactEffect.style.opacity = "0";
    }

    actionLocked = false;
  }, ATTACK_DURATION);
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

    if (action) {
      animateAttack(action);
    }
  });
});

function setTeam(teamId) {
  const team = TEAMS[teamId];

  if (!team || !fighter) {
    console.warn("Bilinmeyen takım:", teamId);
    return false;
  }

  const changed = currentTeam !== teamId;

  currentTeam = teamId;
  window.currentTeam = currentTeam;

  fighter.classList.remove("fb", "gs", "bjk");
  fighter.classList.add(team.id);

  if (teamName) {
    teamName.textContent = team.name;
  }

  if (shirtName) {
    shirtName.textContent = team.shirt;
  }

  if (speechBubble) {
    speechBubble.textContent = team.slogan;
  }

  if (announcement) {
    announcement.textContent = team.slogan;
  }

  if (changed && soundEnabled) {
    unlockAudio();
    playTeamIntro(teamId);
  }

  return true;
}

window.setGameTeam = setTeam;

function handleGift(event) {
  if (!event) return;

  try {
    processGift(event);
  } catch (error) {
    console.error("Hediye işleme hatası:", error);
  }
}

window.handleGiftEvent = handleGift;

window.addEventListener("tiktok-gift", event => {
  handleGift(event.detail);
});

document
  .getElementById("fullscreenBtn")
  ?.addEventListener("click", async () => {
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

soundButton?.addEventListener("click", () => {
  if (!soundEnabled) {
    soundEnabled = true;

    unlockAudio();
    setSoundEnabled(true);

    soundButton.textContent = "🔊 SES AÇIK";

    playTeamIntro(currentTeam);
  } else {
    soundEnabled = false;

    setSoundEnabled(false);
    stopAllSounds();

    soundButton.textContent = "🔇 SES KAPALI";
  }
});

window.addEventListener("keydown", event => {
  if (event.repeat) return;

  const keys = {
    "1": "slap",
    "2": "punch",
    "3": "kick",
    "4": "stick"
  };

  if (keys[event.key]) {
    animateAttack(keys[event.key]);
  }
});

window.addEventListener("contextmenu", event => {
  event.preventDefault();
});

if (healthBar) {
  healthBar.style.width = "100%";
  healthBar.dataset.health = "100";
}

window.currentTeam = currentTeam;

// İlk takımın görünümünü ayarla; ses için kullanıcı etkileşimini bekle.
setTeam("fb");

window.addEventListener("load", connectLive);

console.log("TİKTOK DÖVÜŞ ARENASI HAZIR");
