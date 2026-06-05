let serverOffsetMs = 0;

export function updateServerClockOffset(serverEpochMillis: number, receivedAtMs = Date.now()) {
  if (!Number.isFinite(serverEpochMillis)) return;
  serverOffsetMs = serverEpochMillis - receivedAtMs;
}

export function getServerNow() {
  return Date.now() + serverOffsetMs;
}

export function getServerClockOffset() {
  return serverOffsetMs;
}
