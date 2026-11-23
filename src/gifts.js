
export function processGift(event) {
  if (!event) return false;

  const giftName =
    event.giftName || event.name || event.gift || "";

  const giftId =
    event.giftId || event.gift || "";

  const username =
    event.username || event.user || "İzleyici";

  const repeatCount = Math.max(
    1,
    Math.min(100, Number(event.repeatCount) || 1)
  );

  const match = findGift(giftName, giftId);

  if (!match) {
    console.warn("Tanımlanmamış hediye:", giftName, giftId);
    return false;
  }

  const [, config] = match;

  showGift(giftName || giftId, username);

  if (config.action === "teamChange") {
    return handleTeamChange();
  }

  const success = executeAction(config.action);

  if (success) {
    updateHealth(config.damage * repeatCount);
  }

  return success;
}

window.processGift = processGift;
