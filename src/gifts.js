
import { playEffect, playReaction } from "./audio.js";
import { getNextTeam } from "./teams.js";

export const GIFT_ACTIONS = {
  rose: { names: ["gül", "rose"], action: "slap", damage: 5 },
  coffee: { names: ["kahve", "coffee"], action: "lightPunch", damage: 3 },
  evil: { names: ["nazar boncuğu", "nazar", "evil eye", "evil"], action: "lightPunch", damage: 3 },
  bouquet: { names: ["buket", "bouquet"], action: "combo", damage: 12 },
  rosa: { names: ["rosa"], action: "specialPunch", damage: 14 },
  wand: { names: ["asa", "magic wand", "wand"], action: "bigHit", damage: 22 },
  glasses: { names: ["gözlük", "glasses"], action: "special", damage: 18 },
  crown: { names: ["taç", "crown"], action: "teamChange", damage: 0 }
};

function normalize(value = "") {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function findGift(giftName, giftId = "") {
  const candidates = [giftId, giftName].map(normalize).filter(Boolean);

  for (const [id, gift] of Object.entries(GIFT_ACTIONS)) {
    if (candidates.includes(normalize(id))) return [id, gift];
    if (gift.names.some(alias => candidates.includes(normalize(alias)))) {
      return [id, gift];
    }
  }

  return null;
}

function animate(className, effectText) {
  const fighter = document.getElementById("fighter");
  const impact = document.getElementById("impactEffect");
  if (!fighter) return;

  fighter.classList.remove("hit", "punch", "kick", "combo", "special");
  void fighter.offsetWidth;
  fighter.classList.add(className);

  if (impact) {
    impact.textContent = effectText;
    impact.style.opacity = "1";
  }

  setTimeout(() => {
    fighter.classList.remove(className);
    if (impact) impact.style.opacity = "0";
  }, 850);
}

function updateHealth(damage) {
  if (typeof window.applyGiftDamage === "function") {
    window.applyGiftDamage(damage);
    return;
  }

  const bar = document.getElementById("healthBar");
  if (!bar) return;

  let current = Number(bar.dataset.health ?? 100);
  if (current <= 0) current = 100;

  const next = Math.max(0, current - damage);
  bar.dataset.health = String(next);
  bar.style.width = `${next}%`;
}

function showGift(giftName, username) {
  const giftElement = document.getElementById("lastGift");
  const userElement = document.getElementById("lastUser");
  const announcement = document.getElementById("giftAnnouncement");

  if (giftElement) giftElement.textContent = giftName || "Hediye";
  if (userElement) userElement.textContent = username || "İzleyici";
  if (announcement) announcement.textContent = `${username || "İzleyici"} → ${giftName || "Hediye"}`;
}

const ACTIONS = {
  slap: { animation: "hit", effect: "ŞAP!", sound: "slap", reaction: "slap" },
  lightPunch: { animation: "punch", effect: "POW!", sound: "punch", reaction: "punch" },
  combo: { animation: "combo", effect: "ŞAP! ŞAP! ŞAP!", sound: "combo", reaction: "combo" },
  specialPunch: { animation: "special", effect: "👊 ÖZEL YUMRUK!", sound: "special", reaction: "special" },
  bigHit: { animation: "special", effect: "💥 BÜYÜK DARBE!", sound: "special", reaction: "special" },
  special: { animation: "special", effect: "⚡ ÖZEL SALDIRI!", sound: "special", reaction: "special" }
};

function executeAction(action) {
  const config = ACTIONS[action];
  if (!config) return false;

  animate(config.animation, config.effect);
  playEffect(config.sound);
  playReaction(config.reaction);
  return true;
}

function handleTeamChange() {
  const next = getNextTeam(window.currentTeam || "fb");

  if (!next || typeof window.setGameTeam !== "function") {
    console.error("Takım değiştirme fonksiyonu hazır değil.");
    return false;
  }

  playEffect("crown");
  return window.setGameTeam(next);
}

export function processGift(event) {
  if (!event) return false;

  const giftName = event.giftName || event.name || event.gift || "";
  const giftId = event.giftId || event.gift || "";
  const username = event.username || event.user || "İzleyici";

  const match = findGift(giftName, giftId);
  if (!match) {
    console.warn("Tanımlanmamış hediye:", giftName, giftId);
    return false;
  }

  const [, config] = match;
  showGift(giftName || giftId, username);

  if (config.action === "teamChange") return handleTeamChange();

  const success = executeAction(config.action);
  if (success) updateHealth(config.damage);

  return success;
}

window.processGift = processGift;
