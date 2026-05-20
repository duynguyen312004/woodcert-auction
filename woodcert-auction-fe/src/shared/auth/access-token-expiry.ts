const BASE64URL_PADDING = 4;

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    Math.ceil(normalized.length / BASE64URL_PADDING) * BASE64URL_PADDING,
    "=",
  );

  return globalThis.atob(padded);
}

export function getAccessTokenExpiryMs(accessToken: string) {
  const [, payload] = accessToken.split(".");

  if (!payload) {
    return null;
  }

  try {
    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown };

    if (typeof decodedPayload.exp !== "number" || !Number.isFinite(decodedPayload.exp)) {
      return null;
    }

    return decodedPayload.exp * 1000;
  } catch {
    return null;
  }
}

export function getAccessTokenRefreshDelayMs(
  accessToken: string,
  nowMs = Date.now(),
  refreshLeadMs = 90_000,
) {
  const expiryMs = getAccessTokenExpiryMs(accessToken);

  if (expiryMs === null) {
    return null;
  }

  return Math.max(expiryMs - refreshLeadMs - nowMs, 0);
}

export function shouldRefreshAccessToken(
  accessToken: string,
  nowMs = Date.now(),
  refreshLeadMs = 90_000,
) {
  const expiryMs = getAccessTokenExpiryMs(accessToken);

  return expiryMs !== null && expiryMs - nowMs <= refreshLeadMs;
}
