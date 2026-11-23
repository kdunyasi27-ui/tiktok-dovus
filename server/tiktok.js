
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

const giftAliases = {
  rose: ["gül", "rose"],
  coffee: ["kahve", "coffee"],
  evil: ["nazar boncuğu", "nazar", "evil eye"],
  bouquet: ["buket", "bouquet"],
  rosa: ["rosa"],
  wand: ["asa", "magic wand"],
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
    if (aliases.some(alias => normalize(alias) === normalized)) {
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

  if (connection?.isConnected) {
    return res.json({
      connected: true,
      message: "Zaten bağlı"
    });
  }

  try {
    const username = LIVE_USERNAME;

    if (!username) {
      return res.status(400).json({
        error: "LIVE_USERNAME ayarlanmamış"
      });
    }

    connection = new TikTokLiveConnection(username);

    connection.on(WebcastEvent.GIFT, event => {
      // Hediye serileri yalnızca tamamlandığında işlenir.
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

      const giftId = identifyGift(giftName);

      if (!giftId) return;

      const user =
        event.user?.nickname ||
        event.user?.uniqueId ||
        "İzleyici";

      broadcast({
        type: "gift",
        gift: giftId,
        giftName,
        username: user,
        repeatCount: event.repeatCount || 1,
        timestamp: Date.now()
      });

      console.log(`${user}: ${giftName}`);
    });

    connection.on(WebcastEvent.CHAT, event => {
      broadcast({
        type: "chat",
        username: event.user?.nickname || "İzleyici",
        comment: event.comment || ""
      });
    });

    connection.on("connected", () => {
      liveConnected = true;

      broadcast({
        type: "status",
        connected: true
      });
    });

    connection.on("disconnected", () => {
      liveConnected = false;

      broadcast({
        type: "status",
        connected: false
      });
    });

    connection.on("error", error => {
      console.error("TikTok bağlantı hatası:", error);
    });

    await connection.connect();

    liveConnected = true;

    return res.json({
      connected: true,
      username
    });

  } catch (error) {
    liveConnected = false;

    console.error("Bağlantı kurulamadı:", error);

    return res.status(500).json({
      connected: false,
      error: "TikTok LIVE bağlantısı kurulamadı"
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`TikTok sunucusu ${PORT} portunda çalışıyor.`);
});
