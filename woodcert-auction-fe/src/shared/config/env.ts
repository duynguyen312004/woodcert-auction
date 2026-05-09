const requiredEnv = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.MODE === "test" ? "http://localhost:8080/api/v1" : ""),
  wsBaseUrl:
    import.meta.env.VITE_WS_BASE_URL ||
    (import.meta.env.MODE === "test" ? "http://localhost:8080/ws-auction" : ""),
} as const;

function assertRequiredEnv(name: keyof typeof requiredEnv, value: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

assertRequiredEnv("apiBaseUrl", requiredEnv.apiBaseUrl);
assertRequiredEnv("wsBaseUrl", requiredEnv.wsBaseUrl);

export const env = requiredEnv;
