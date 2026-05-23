// src/hooks/useWebSocket.js
import { useCallback, useEffect, useRef, useState } from "react";

// Convert http → ws, https → wss
const WS_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000")
  .replace(/^http/, "ws");

let globalWs    = null;
let subscribers = new Set();

function getWsUrl(userId, role) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (role)   params.set("role", role);
  return `${WS_BASE}/ws?${params}`;
}

export function useWebSocket({ userId, role, onMessage }) {
  const reconnectTimer = useRef(null);
  const isMounted      = useRef(true);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!userId) return;

    // Already open — just subscribe
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      setConnected(true);
      return;
    }

    // Already connecting — wait
    if (globalWs && globalWs.readyState === WebSocket.CONNECTING) return;

    try {
      globalWs = new WebSocket(getWsUrl(userId, role));

      globalWs.onopen = () => {
        if (!isMounted.current) return;
        setConnected(true);
        clearTimeout(reconnectTimer.current);
      };

      globalWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          for (const cb of subscribers) cb(data);
        } catch {
          // Ignore malformed messages
        }
      };

      globalWs.onclose = () => {
        if (!isMounted.current) return;
        setConnected(false);
        // Reconnect after 3 seconds
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) connect();
        }, 3000);
      };

      globalWs.onerror = () => {
        // onclose fires after onerror, so reconnect is handled there
        globalWs?.close();
      };
    } catch (err) {
      console.warn("WS connect failed:", err.message);
    }
  }, [userId, role]);

  useEffect(() => {
    isMounted.current = true;
    if (onMessage) subscribers.add(onMessage);
    connect();

    return () => {
      isMounted.current = false;
      if (onMessage) subscribers.delete(onMessage);
      clearTimeout(reconnectTimer.current);
    };
  }, [connect, onMessage]);

  return { connected };
}

export function closeWebSocket() {
  subscribers.clear();
  globalWs?.close();
  globalWs = null;
}