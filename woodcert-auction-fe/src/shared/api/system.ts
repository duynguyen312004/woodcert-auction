import { apiRequest } from "@/shared/api/client";
import { updateServerClockOffset } from "@/shared/lib/serverClock";

type SystemTimeResponse = {
  serverTime: string;
  epochMillis: number;
};

let lastSyncAt = 0;
let syncPromise: Promise<number> | null = null;

export async function syncServerTime(force = false) {
  const now = Date.now();
  if (!force && now - lastSyncAt < 60_000) {
    return now;
  }

  syncPromise ??= (async () => {
    const requestStartedAt = Date.now();
    const serverTime = await apiRequest<SystemTimeResponse>({
      method: "GET",
      url: "/system/time",
      skipAuthRefresh: true,
      skipAutoRetry: true,
    });
    const receivedAt = Date.now();
    const midpointAdjustedServerTime =
      serverTime.epochMillis + Math.max(0, receivedAt - requestStartedAt) / 2;
    updateServerClockOffset(midpointAdjustedServerTime, receivedAt);
    lastSyncAt = receivedAt;
    return receivedAt;
  })().finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}
