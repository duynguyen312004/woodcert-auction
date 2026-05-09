import { CheckCircle2 } from "lucide-react";

import { Button } from "@/shared/ui/button";

export function RootPage() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          FE foundation scaffold
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-normal text-foreground">
            WoodCert Auction
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Foundation shell is ready: routing, providers, Tailwind, shadcn/ui, typed config, and
            shared API infrastructure are wired without business feature UI.
          </p>
        </div>
        <Button type="button">Foundation Ready</Button>
      </div>
    </section>
  );
}
