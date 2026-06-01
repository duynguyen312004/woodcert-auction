/**
 * Hook quản lý kết nối WebSocket với backend.
 *
 * Sử dụng @stomp/stompjs và sockjs-client để kết nối tới WebSocket endpoint,
 * lắng nghe các sự kiện NEW_BID, SESSION_ENDED và kích hoạt các callback tương ứng.
 */

import { Client } from "@stomp/stompjs";
import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";

import { env } from "@/shared/config/env";
import type { BidBroadcastPayload, NewBidPayload, SessionEndedPayload } from "../types";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

interface UseAuctionSocketOptions {
  auctionId: string | number;
  onNewBid: (payload: NewBidPayload) => void;
  onSessionActivated: (payload: SessionEndedPayload) => void;
  onSessionEnded: (payload: SessionEndedPayload) => void;
}

function toNumber(value: string | number | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNewBidPayload(event: BidBroadcastPayload): NewBidPayload | null {
  if (!event.bidTraceId || event.bidAmount === undefined || !event.bidTime) {
    return null;
  }

  return {
    auctionId: event.auctionSessionId,
    currentPrice: toNumber(event.currentPrice),
    endTime: event.endTime,
    highestBidderMaskedAlias: event.highestBidderMaskedAlias ?? null,
    bidHistoryItem: {
      bidTraceId: event.bidTraceId,
      bidAmount: toNumber(event.bidAmount),
      bidderMaskedAlias: event.highestBidderMaskedAlias ?? "****",
      bidTime: event.bidTime,
      mine: false,
    },
    extendedBySeconds: event.extendedBySeconds ?? undefined,
  };
}

export function useAuctionSocket({
  auctionId,
  onNewBid,
  onSessionActivated,
  onSessionEnded,
}: UseAuctionSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const stompClientRef = useRef<Client | null>(null);
  const callbacksRef = useRef({ onNewBid, onSessionActivated, onSessionEnded });

  useEffect(() => {
    callbacksRef.current = { onNewBid, onSessionActivated, onSessionEnded };
  }, [onNewBid, onSessionActivated, onSessionEnded]);

  useEffect(() => {
    if (!auctionId) return;
    // Chuẩn hóa wsBaseUrl để SockJS nhận dạng đúng endpoint.
    let url = env.wsBaseUrl;
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000, // Tự động reconnect sau 5 giây nếu đứt kết nối
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setStatus("connected");

      // Subscribe nhận thông báo realtime cho phiên đấu giá cụ thể
      client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
        try {
          const event = JSON.parse(message.body) as BidBroadcastPayload;
          if (event.type === "NEW_BID") {
            const payload = toNewBidPayload(event);
            if (payload) {
              callbacksRef.current.onNewBid(payload);
            }
          } else if (event.type === "SESSION_ACTIVATED") {
            callbacksRef.current.onSessionActivated({
              auctionId: event.auctionSessionId,
              status: event.status,
            });
          } else if (event.type === "SESSION_ENDED") {
            callbacksRef.current.onSessionEnded({
              auctionId: event.auctionSessionId,
              status: event.status,
            });
          }
        } catch (error) {
          console.warn("Failed to parse socket message:", error);
        }
      });
    };

    client.onDisconnect = () => {
      setStatus("disconnected");
    };

    client.onWebSocketClose = () => {
      setStatus((prev) =>
        prev === "connected" || prev === "connecting" ? "reconnecting" : "disconnected",
      );
    };

    client.onStompError = (frame) => {
      console.warn("Broker reported error: " + frame.headers["message"]);
      console.warn("Additional details: " + frame.body);
    };

    stompClientRef.current = client;
    client.activate();

    return () => {
      if (stompClientRef.current === client) {
        stompClientRef.current = null;
      }
      client.deactivate();
    };
  }, [auctionId]);

  return { status };
}
