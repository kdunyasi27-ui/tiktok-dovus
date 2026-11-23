
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
const LIVE_USERNAME = (process.env.LIVE_USERNAME || "").replace(/^@/, "").trim();

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
      normalized === normalize(id) ||
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
      try {
        client.send(message);
      } catch (error) {
        console.error("WebSocket gönderim hatası:", error.message);
      }
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

  console.log("TikTok için 5 saniye sonra yeniden bağlantı denenecek.");

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectTikTok();
  }, 5000);
}

async function connectTikTok() {
  if (!LIVE_USERNAME) {
    console.error("LIVE_USERNAME ortam değişkeni eksik.");
    return false;
  }

  if (connecting) return false;

  if (connection?.isConnected) {
    return true;
  }

  connecting = true;

  let client;

  try {
    client = new TikTokLiveConnection(LIVE_USERNAME);
    connection = client;

    client.on(WebcastEvent.GIFT, event => {
      if (
        event.giftDetails?.giftType === 1 &&
        !event.repeatEnd
      ) {
        return;
      }

      const giftName =
        event.giftDetails?.giftName ||
        event.extendedGiftInfo?.name ||
        event.giftName ||
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
        repeatCount: Math.max(
          1,
          Math.min(100, Number(event.repeatCount) || 1)
        ),
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
      console.log("TikTok LIVE bağlantısı kesildi.");
      sendStatus();

      if (connection === client) {
        connection = null;
      }

      scheduleReconnect();
    });

    client.on("error", error => {
      console.error("TikTok bağlantı hatası:", error?.message || error);

      if (connection === client && !client.isConnected) {
        liveConnected = false;
        connection = null;
        sendStatus();
        scheduleReconnect();
      }
    });

    await client.connect();

    if (connection === client) {
      liveConnected = true;
      sendStatus();
      console.log(`@${LIVE_USERNAME} yayınına bağlanıldı.`);
    }

    return true;

  } catch (error) {
    liveConnected = false;

    if (connection === client) {
      connection = null;
    }

    console.error(
      "TikTok bağlantısı kurulamadı:",
      error?.message || error
    );

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

  socket.send(JSON.stringify({
    type: "status",
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

app.post("/connect", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const suppliedSecret = req.headers["x-admin-secret"];

  if (!adminSecret || suppliedSecret !== adminSecret) {
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

  setTimeout(() => {
    connectTikTok();
  }, 1500);
});
