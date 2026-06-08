import { Client } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";

import { env } from "@/shared/config/env";

export type AuctionTopicConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type AuctionTopicEvent = {
  type: "SESSION_ACTIVATED" | "NEW_BID" | "SESSION_ENDED";
  auctionSessionId: number;
  status: string;
  currentPrice?: string | number | null;
  highestBidderMaskedAlias?: string | null;
  endTime?: string | null;
  bidTraceId?: string;
  bidAmount?: string | number;
  bidTime?: string;
  extendedBySeconds?: number | null;
};

export function useAuctionTopic({
  auctionId,
  onEvent,
  onConnected,
}: {
  auctionId: string | number | undefined;
  onEvent: (event: AuctionTopicEvent) => void;
  onConnected?: () => void;
}) {
  const [status, setStatus] = useState<AuctionTopicConnectionStatus>("connecting");
  const callbacksRef = useRef({ onEvent, onConnected });

  useEffect(() => {
    callbacksRef.current = { onEvent, onConnected };
  }, [onEvent, onConnected]);

  useEffect(() => {
    if (!auctionId) return;

    const url = env.wsBaseUrl.endsWith("/") ? env.wsBaseUrl.slice(0, -1) : env.wsBaseUrl;
    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setStatus("connected");
      callbacksRef.current.onConnected?.();
      client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
        try {
          callbacksRef.current.onEvent(JSON.parse(message.body) as AuctionTopicEvent);
        } catch (error) {
          console.warn("Failed to parse auction socket message:", error);
        }
      });
    };
    client.onDisconnect = () => setStatus("disconnected");
    client.onWebSocketClose = () =>
      setStatus((current) =>
        current === "connected" || current === "connecting" ? "reconnecting" : "disconnected",
      );
    client.onStompError = (frame) => {
      console.warn("Auction broker error:", frame.headers["message"], frame.body);
    };

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [auctionId]);

  return { status };
}
