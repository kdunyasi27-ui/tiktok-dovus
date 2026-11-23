
import { processGift } from "./gifts.js";

const LIVE_SERVER = import.meta.env.VITE_LIVE_SERVER;

let socket = null;
let reconnectTimer = null;

export function connectLive() {
  if (!LIVE_SERVER) {
    console.error("VITE_LIVE_SERVER ayarlanmamış.");
    return;
  }

  if (socket && socket.readyState <= 1) return;

  socket = new WebSocket(LIVE_SERVER);

  socket.onopen = () => {
    console.log("LIVE sunucusuna bağlanıldı.");
    updateStatus("SUNUCU BAĞLI");
  };

  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "gift") {
        processGift({
          giftName: data.gift,
          username: data.username
        });
      }

      if (data.type === "status") {
        updateStatus(
          data.connected ? "TIKTOK LIVE BAĞLI" : "TIKTOK LIVE KAPALI"
        );
      }

      if (data.type === "chat") {
        updateChat(data.username, data.comment);
      }
    } catch (error) {
      console.error("LIVE mesajı okunamadı:", error);
    }
  };

  socket.onclose = () => {
    updateStatus("BAĞLANTI KESİLDİ");
    reconnectTimer = setTimeout(connectLive, 5000);
  };

  socket.onerror = error => {
    console.error("WebSocket hatası:", error);
  };
}

function updateStatus(message) {
  const element = document.getElementById("connectionStatus");
  if (element) element.textContent = message;
}

function updateChat(username, comment) {
  const element = document.getElementById("giftAnnouncement");

  if (element) {
    element.textContent = `${username}: ${comment}`;
  }
}

export function disconnectLive() {
  clearTimeout(reconnectTimer);

  if (socket) {
    socket.close();
    socket = null;
  }

  updateStatus("BAĞLANTI KAPATILDI");
}
