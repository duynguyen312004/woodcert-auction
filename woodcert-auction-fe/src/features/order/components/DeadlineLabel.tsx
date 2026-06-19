import { CircleHelp } from "lucide-react";

export function DeadlineLabel({ label, explanation }: { label: string; explanation: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span className="group relative inline-flex">
        <button
          type="button"
          aria-label={`Giải thích: ${label}`}
          className="inline-flex size-5 items-center justify-center rounded-full text-current/65 outline-none transition-colors hover:text-current focus-visible:ring-2 focus-visible:ring-current/40"
        >
          <CircleHelp className="size-3.5" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-72 rounded-md border border-stone-300 bg-stone-950 px-3 py-2 text-left text-xs font-medium normal-case leading-relaxed tracking-normal text-stone-100 shadow-xl group-hover:block group-focus-within:block"
        >
          {explanation}
        </span>
      </span>
    </span>
  );
}
