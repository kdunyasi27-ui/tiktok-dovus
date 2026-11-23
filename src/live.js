
import { processGift } from "./gifts.js";

const LIVE_SERVER = import.meta.env.VITE_LIVE_SERVER;

let socket = null;
let reconnectTimer = null;
let manuallyDisconnected = false;

export function connectLive() {
  if (!LIVE_SERVER) {
    console.error("VITE_LIVE_SERVER ayarlanmamış.");
    updateStatus("SUNUCU ADRESİ EKSİK");
    return;
  }

  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return;
  }

  manuallyDisconnected = false;

  try {
    socket = new WebSocket(LIVE_SERVER);
  } catch (error) {
    console.error("WebSocket oluşturulamadı:", error);
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    console.log("LIVE sunucusuna bağlanıldı.");
    updateStatus("SUNUCU BAĞLI");
  };

  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "gift") {
        processGift({
          giftName: data.giftName || data.gift || "",
          giftId: data.gift || "",
          gift: data.gift || "",
          username: data.username || "İzleyici",
          repeatCount: data.repeatCount || 1
        });
      } else if (data.type === "status") {
        updateStatus(data.connected ? "TIKTOK LIVE BAĞLI" : "TIKTOK LIVE KAPALI");
      } else if (data.type === "connection") {
        updateStatus(data.connected ? "TIKTOK LIVE BAĞLI" : "SUNUCU BAĞLI — TIKTOK BEKLENİYOR");
      } else if (data.type === "chat") {
        updateChat(data.username, data.comment);
      }
    } catch (error) {
      console.error("LIVE mesajı okunamadı:", error);
    }
  };

  socket.onclose = () => {
    socket = null;
    updateStatus("BAĞLANTI KESİLDİ");
    scheduleReconnect();
  };

  socket.onerror = error => {
    console.error("WebSocket hatası:", error);
    updateStatus("BAĞLANTI HATASI");
  };
}

function scheduleReconnect() {
  if (manuallyDisconnected || reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectLive();
  }, 5000);
}

function updateStatus(message) {
  const element = document.getElementById("connectionStatus");
  if (element) element.textContent = message;
}

function updateChat(username, comment) {
  const element = document.getElementById("giftAnnouncement");
  if (element) element.textContent = `${username || "İzleyici"}: ${comment || ""}`;
}

export function disconnectLive() {
  manuallyDisconnected = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  if (socket) {
    const oldSocket = socket;
    socket = null;
    oldSocket.close();
  }

  updateStatus("BAĞLANTI KAPATILDI");
}
