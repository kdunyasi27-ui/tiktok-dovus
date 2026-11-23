
import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import {
  TikTokLiveConnection,
  WebcastEvent
} from "tiktok-live-connector";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

const PORT = process.env.PORT || 3000;
const LIVE_USERNAME = process.env.LIVE_USERNAME;

let connection = null;
let liveConnected = false;
let connecting = false;
let reconnectTimer = null;

const giftAliases = {
  rose: ["gül", "rose"],
  coffee: ["kahve", "coffee"],
  evil: ["nazar boncuğu", "nazar", "evil eye", "evil"],
  bouquet: ["buket", "bouquet"],
  rosa: ["rosa"],
  wand: ["asa", "magic wand", "wand"],
  glasses: ["gözlük", "glasses"],
  crown: ["taç", "crown"]
};

function normalize(value = "") {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function identifyGift(name) {
  const normalized = normalize(name);

  for (const [id, aliases] of Object.entries(giftAliases)) {
    if (
      aliases.some(alias => normalize(alias) === normalized)
    ) {
      return id;
    }
  }

  return null;
}

function broadcast(data) {
  const message = JSON.stringify(data);

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

function sendStatus() {
  broadcast({
    type: "status",
    connected: liveConnected
  });
}

function scheduleReconnect() {
  if (reconnectTimer || !LIVE_USERNAME) return;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await connectTikTok();
  }, 5000);
}

async function connectTikTok() {
  if (!LIVE_USERNAME) {
    console.error("LIVE_USERNAME Render ortam değişkeninde eksik.");
    return false;
  }

  if (connecting || connection?.isConnected) {
    return Boolean(connection?.isConnected);
  }

  connecting = true;

  const client = new TikTokLiveConnection(LIVE_USERNAME);
  connection = client;

  client.on(WebcastEvent.GIFT, event => {
    // Hediye serisi tamamlanmadan tekrar tekrar işleme.
    if (
      event.giftDetails?.giftType === 1 &&
      !event.repeatEnd
    ) {
      return;
    }

    const giftName =
      event.giftDetails?.giftName ||
      event.extendedGiftInfo?.name ||
      "";

    const gift = identifyGift(giftName);

    if (!gift) {
      console.log("Tanımlanmayan hediye:", giftName);
      return;
    }

    const username =
      event.user?.nickname ||
      event.user?.uniqueId ||
      "İzleyici";

    broadcast({
      type: "gift",
      gift,
      giftName,
      username,
      repeatCount: Math.max(1, Number(event.repeatCount) || 1),
      timestamp: Date.now()
    });

    console.log(`${username}: ${giftName}`);
  });

  client.on(WebcastEvent.CHAT, event => {
    broadcast({
      type: "chat",
      username: event.user?.nickname || "İzleyici",
      comment: event.comment || ""
    });
  });

  client.on("connected", () => {
    liveConnected = true;
    console.log("TikTok LIVE bağlantısı başarılı.");
    sendStatus();
  });

  client.on("disconnected", () => {
    liveConnected = false;
    console.log("TikTok bağlantısı kesildi.");
    sendStatus();

    if (connection === client) {
      connection = null;
    }

    scheduleReconnect();
  });

  client.on("error", error => {
    console.error("TikTok bağlantı hatası:", error);
  });

  try {
    await client.connect();

    liveConnected = true;
    sendStatus();

    console.log(`@${LIVE_USERNAME} yayınına bağlanıldı.`);
    return true;
  } catch (error) {
    liveConnected = false;

    if (connection === client) {
      connection = null;
    }

    console.error("TikTok bağlantısı kurulamadı:", error.message);
    sendStatus();

    scheduleReconnect();
    return false;
  } finally {
    connecting = false;
  }
}

wss.on("connection", socket => {
  socket.send(JSON.stringify({
    type: "connection",
    connected: liveConnected
  }));
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    tiktokConnected: liveConnected,
    websocketClients: wss.clients.size
  });
});

// İsteğe bağlı manuel bağlantı; otomatik bağlantı da aktiftir.
app.post("/connect", async (req, res) => {
  const secret = req.headers["x-admin-secret"];

  if (
    !process.env.ADMIN_SECRET ||
    secret !== process.env.ADMIN_SECRET
  ) {
    return res.status(401).json({
      error: "Yetkisiz erişim"
    });
  }

  const connected = await connectTikTok();

  return res.status(connected ? 200 : 503).json({
    connected
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`TikTok sunucusu ${PORT} portunda çalışıyor.`);

  // Render sunucusu açıldığında otomatik bağlanmayı dene.
  setTimeout(() => {
    connectTikTok();
  }, 1500);
});
