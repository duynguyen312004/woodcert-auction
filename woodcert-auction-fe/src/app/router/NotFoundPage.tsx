import { ArrowLeft, Compass, Home } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface NotFoundPageProps {
  homePath: string;
  homeLabel: string;
  appearance?: "dark" | "light";
}

export function NotFoundPage({ homePath, homeLabel, appearance = "dark" }: NotFoundPageProps) {
  const navigate = useNavigate();
  const isLight = appearance === "light";

  return (
    <section
      className={cn(
        "relative isolate flex min-h-[calc(100vh-4.25rem)] items-center justify-center overflow-hidden px-6 py-20",
        isLight ? "bg-warm-ivory text-[#181612]" : "bg-background text-foreground",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-70",
          isLight
            ? "bg-[radial-gradient(circle_at_20%_20%,rgba(174,130,63,0.16),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(78,70,55,0.12),transparent_30%)]"
            : "bg-[radial-gradient(circle_at_20%_20%,rgba(214,168,79,0.12),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(255,255,255,0.05),transparent_30%)]",
        )}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-3xl text-center">
        <div
          className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-full border",
            isLight
              ? "border-[#ae823f]/30 bg-[#ae823f]/10 text-[#8a642b]"
              : "border-primary/30 bg-primary/10 text-primary",
          )}
        >
          <Compass className="h-7 w-7" aria-hidden />
        </div>

        <p
          className={cn(
            "mt-8 text-xs font-bold uppercase tracking-[0.35em]",
            isLight ? "text-[#8a642b]" : "text-primary",
          )}
        >
          Lạc khỏi phiên đấu giá
        </p>
        <p
          className={cn(
            "mt-3 font-serif text-[clamp(5rem,18vw,10rem)] font-bold leading-none tracking-[-0.08em]",
            isLight ? "text-[#211d17]/10" : "text-white/10",
          )}
          aria-hidden
        >
          404
        </p>
        <h1 className="-mt-7 font-serif text-3xl font-bold tracking-tight sm:text-5xl">
          Không tìm thấy trang
        </h1>
        <p
          className={cn(
            "mx-auto mt-5 max-w-xl text-sm leading-7 sm:text-base",
            isLight ? "text-[#655d51]" : "text-muted-foreground",
          )}
        >
          Đường dẫn có thể đã thay đổi hoặc không còn tồn tại. Bạn có thể quay lại trang trước hoặc
          trở về khu vực chính để tiếp tục.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" variant="outline" size="lg" onClick={() => void navigate(-1)}>
            <ArrowLeft aria-hidden />
            Quay lại
          </Button>
          <Button asChild size="lg">
            <Link to={homePath}>
              <Home aria-hidden />
              {homeLabel}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
