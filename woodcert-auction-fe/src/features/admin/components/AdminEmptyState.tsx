import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type AdminEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-md border border-white/10 bg-white/5 text-primary shadow-sm">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#f2eee5]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#a49a88]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
