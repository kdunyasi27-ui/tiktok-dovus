
import { playEffect, playReaction } from "./audio.js";
import { changeTeam } from "./teams.js";

export const GIFT_ACTIONS = {
  rose: {
    names: ["gül", "rose"],
    action: "slap",
    damage: 5,
    label: "TOKAT"
  },

  coffee: {
    names: ["kahve", "coffee"],
    action: "lightPunch",
    damage: 3,
    label: "HAFİF YUMRUK"
  },

  evil: {
    names: ["nazar boncuğu", "nazar", "evil eye"],
    action: "lightPunch",
    damage: 3,
    label: "HAFİF YUMRUK"
  },

  bouquet: {
    names: ["buket", "bouquet"],
    action: "combo",
    damage: 12,
    label: "SERİ TOKAT"
  },

  rosa: {
    names: ["rosa"],
    action: "specialPunch",
    damage: 14,
    label: "ÖZEL YUMRUK"
  },

  wand: {
    names: ["asa", "magic wand"],
    action: "bigHit",
    damage: 22,
    label: "BÜYÜK DARBE"
  },

  glasses: {
    names: ["gözlük", "glasses"],
    action: "special",
    damage: 18,
    label: "ÖZEL SALDIRI"
  },

  crown: {
    names: ["taç", "crown"],
    action: "teamChange",
    damage: 0,
    label: "TAKIM DEĞİŞTİR"
  }
};

function normalize(value = "") {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function findGift(giftName) {
  const name = normalize(giftName);

  return Object.entries(GIFT_ACTIONS).find(
    ([, gift]) =>
      gift.names.some(alias => normalize(alias) === name)
  );
}

function animate(id, className, effectText) {
  const fighter = document.getElementById("fighter");
  const impact = document.getElementById("impactEffect");

  if (!fighter) return;

  fighter.classList.remove(
    "hit", "punch", "kick", "combo", "special"
  );

  void fighter.offsetWidth;

  fighter.classList.add(className);

  if (impact) {
    impact.textContent = effectText;
  }

  setTimeout(() => {
    fighter.classList.remove(className);
  }, 850);
}

function updateHealth(damage) {
  const bar = document.getElementById("healthBar");

  if (!bar) return;

  const current = Number(bar.dataset.health ?? 100);
  const next = Math.max(0, current - damage);

  bar.dataset.health = String(next);
  bar.style.width = `${next}%`;

  if (next === 0) {
    const bubble = document.getElementById("speechBubble");

    if (bubble) {
      bubble.textContent = "Pes ediyorum!";
    }
  }
}

function showGift(giftName, username) {
  const giftElement = document.getElementById("lastGift");
  const userElement = document.getElementById("lastUser");
  const announcement = document.getElementById("giftAnnouncement");

  if (giftElement) giftElement.textContent = giftName;
  if (userElement) userElement.textContent = username;

  if (announcement) {
    announcement.textContent =
      `${username} → ${giftName}`;
  }
}

function executeAction(action) {
  const actions = {
    slap: {
      animation: "hit",
      effect: "ŞAP!",
      sound: "slap",
      reaction: "slap"
    },

    lightPunch: {
      animation: "punch",
      effect: "POW!",
      sound: "punch",
      reaction: "punch"
    },

    combo: {
      animation: "combo",
      effect: "ŞAP! ŞAP! ŞAP!",
      sound: "combo",
      reaction: "combo"
    },

    specialPunch: {
      animation: "special",
      effect: "BOOOM!",
      sound: "special",
      reaction: "special"
    },

    bigHit: {
      animation: "special",
      effect: "💥 BÜYÜK DARBE!",
      sound: "special",
      reaction: "special"
    },

    special: {
      animation: "special",
      effect: "⚡ ÖZEL SALDIRI!",
      sound: "special",
      reaction: "special"
    }
  };

  const config = actions[action];

  if (!config) return;

  animate(
    "fighter",
    config.animation,
    config.effect
  );

  playEffect(config.sound);
  playReaction(config.reaction);
}

export function processGift(event) {
  if (!event) return false;

  const giftName =
    event.giftName ||
    event.gift ||
    event.name ||
    "";

  const username =
    event.username ||
    event.user ||
    "İzleyici";

  const match = findGift(giftName);

  if (!match) {
    console.warn("Tanımlanmamış hediye:", giftName);
    return false;
  }

  const [giftId, config] = match;

  showGift(giftName, username);

  if (config.action === "teamChange") {
    changeTeam(window.currentTeam || "fb");
    window.currentTeam = getNextTeamId(window.currentTeam || "fb");
    return true;
  }

  executeAction(config.action);
  updateHealth(config.damage);

  return true;
}

function getNextTeamId(current) {
  return {
    fb: "gs",
    gs: "bjk",
    bjk: "fb"
  }[current] || "fb";
}

window.processGift = processGift;
