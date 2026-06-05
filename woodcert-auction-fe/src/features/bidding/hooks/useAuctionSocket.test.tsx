import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const stompMock = vi.hoisted(() => {
  type MockClient = {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onWebSocketClose?: () => void;
    activate: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  } & Record<string, unknown>;

  const clients: MockClient[] = [];
  const Client = vi.fn(function (this: MockClient, config: Record<string, unknown>) {
    Object.assign(this, config);
    this.activate = vi.fn();
    this.deactivate = vi.fn();
    this.subscribe = vi.fn();
    clients.push(this);
  });
  return { Client, clients };
});

vi.mock("@stomp/stompjs", () => ({ Client: stompMock.Client }));
vi.mock("sockjs-client", () => ({ default: vi.fn() }));

import { useAuctionSocket } from "./useAuctionSocket";

function Harness({ onConnected }: { onConnected: () => void }) {
  const { status } = useAuctionSocket({
    auctionId: 501,
    onNewBid: vi.fn(),
    onSessionActivated: vi.fn(),
    onSessionEnded: vi.fn(),
    onConnected,
  });
  return <span>{status}</span>;
}

describe("useAuctionSocket", () => {
  afterEach(() => {
    cleanup();
    stompMock.clients.length = 0;
    vi.clearAllMocks();
  });

  it("calls onConnected after a socket connect or reconnect", () => {
    const onConnected = vi.fn();

    render(<Harness onConnected={onConnected} />);

    expect(stompMock.clients).toHaveLength(1);
    expect(screen.getByText("connecting")).toBeInTheDocument();

    act(() => {
      stompMock.clients[0]!.onConnect?.();
    });

    expect(onConnected).toHaveBeenCalledTimes(1);
    expect(screen.getByText("connected")).toBeInTheDocument();
  });
});
