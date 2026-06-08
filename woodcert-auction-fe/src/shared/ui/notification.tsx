import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";

export type NotificationTone = "success" | "error" | "warning" | "info";

type NotificationAction = {
  label: string;
  onClick: () => void;
};

type NotificationInput = {
  id?: string;
  tone: NotificationTone;
  title: ReactNode;
  description?: ReactNode;
  action?: NotificationAction;
  duration?: number;
};

type ToastNotification = NotificationInput & {
  id: string;
};

type NotifyOptions = Omit<NotificationInput, "tone" | "title">;

type NotificationContextValue = {
  notify: (notification: NotificationInput) => string;
  dismiss: (id: string) => void;
  success: (title: ReactNode, options?: NotifyOptions) => string;
  error: (title: ReactNode, options?: NotifyOptions) => string;
  warning: (title: ReactNode, options?: NotifyOptions) => string;
  info: (title: ReactNode, options?: NotifyOptions) => string;
};

type NotificationCardProps = {
  tone?: NotificationTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  role?: "status" | "alert";
};

const DEFAULT_DURATION = 5200;
const MAX_VISIBLE_NOTIFICATIONS = 4;

const toneConfig: Record<
  NotificationTone,
  {
    icon: LucideIcon;
    accent: string;
    iconWrap: string;
    title: string;
    description: string;
    button: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    accent: "bg-primary",
    iconWrap: "border-primary/25 bg-primary/10 text-primary",
    title: "text-foreground",
    description: "text-muted-foreground",
    button: "border-primary/30 text-primary hover:bg-primary/10",
  },
  error: {
    icon: XCircle,
    accent: "bg-destructive",
    iconWrap: "border-destructive/25 bg-destructive/10 text-destructive",
    title: "text-foreground",
    description: "text-muted-foreground",
    button: "border-destructive/30 text-destructive hover:bg-destructive/10",
  },
  warning: {
    icon: AlertTriangle,
    accent: "bg-amber-400",
    iconWrap: "border-amber-300/30 bg-amber-300/10 text-amber-300",
    title: "text-foreground",
    description: "text-muted-foreground",
    button: "border-amber-300/30 text-amber-200 hover:bg-amber-300/10",
  },
  info: {
    icon: Info,
    accent: "bg-sky-400",
    iconWrap: "border-sky-300/30 bg-sky-300/10 text-sky-300",
    title: "text-foreground",
    description: "text-muted-foreground",
    button: "border-sky-300/30 text-sky-200 hover:bg-sky-300/10",
  },
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationCard({
  tone = "info",
  title,
  description,
  action,
  onDismiss,
  className,
  role = tone === "error" ? "alert" : "status",
}: NotificationCardProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <div
      role={role}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/80 bg-card/95 p-4 text-card-foreground shadow-2xl shadow-black/30 backdrop-blur-xl",
        className,
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", config.accent)} />
      <div className="flex gap-3 pl-1">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md border",
            config.iconWrap,
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start gap-3">
            <p className={cn("min-w-0 flex-1 text-sm font-semibold leading-5", config.title)}>
              {title}
            </p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {description && (
            <div className={cn("text-sm leading-5", config.description)}>{description}</div>
          )}
          {action && <div className="pt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (notification.duration === 0) return;

    const timeoutId = setTimeout(
      () => onDismiss(notification.id),
      notification.duration ?? DEFAULT_DURATION,
    );

    return () => clearTimeout(timeoutId);
  }, [notification.duration, notification.id, onDismiss]);

  const action = notification.action ? (
    <button
      type="button"
      onClick={() => {
        notification.action?.onClick();
        onDismiss(notification.id);
      }}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        toneConfig[notification.tone].button,
      )}
    >
      {notification.action.label}
    </button>
  ) : null;

  return (
    <NotificationCard
      tone={notification.tone}
      title={notification.title}
      description={notification.description}
      action={action}
      onDismiss={() => onDismiss(notification.id)}
      className="pointer-events-auto animate-slide-down"
    />
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback((notification: NotificationInput) => {
    const id = notification.id ?? `notification-${Date.now()}-${idRef.current++}`;
    const nextNotification = { ...notification, id };

    setNotifications((current) =>
      [nextNotification, ...current.filter((item) => item.id !== id)].slice(
        0,
        MAX_VISIBLE_NOTIFICATIONS,
      ),
    );

    return id;
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      dismiss,
      success: (title, options) => notify({ ...options, title, tone: "success" }),
      error: (title, options) => notify({ ...options, title, tone: "error" }),
      warning: (title, options) => notify({ ...options, title, tone: "warning" }),
      info: (title, options) => notify({ ...options, title, tone: "info" }),
    }),
    [dismiss, notify],
  );

  const viewport = (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[300] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-5 sm:top-5"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} onDismiss={dismiss} />
      ))}
    </div>
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {createPortal(viewport, document.body)}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider.");
  }

  return context;
}
