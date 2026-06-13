import { useEffect, useState } from "react";

import { syncServerTime } from "@/shared/api/system";
import { getServerNow } from "@/shared/lib/serverClock";

export function useServerNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => getServerNow());

  useEffect(() => {
    let mounted = true;
    void syncServerTime()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setNow(getServerNow());
      });

    const id = window.setInterval(() => setNow(getServerNow()), intervalMs);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return now;
}
