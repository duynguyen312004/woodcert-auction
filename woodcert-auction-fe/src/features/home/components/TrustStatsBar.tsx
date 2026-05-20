import { Gavel, Palette, ShieldCheck, Wallet } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Chứng thư WoodCert",
    subtitle: "100% Gỗ thật đã kiểm định",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: Gavel,
    title: "Đấu giá real-time",
    subtitle: "Nền tảng trực tuyến mượt mà",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Wallet,
    title: "Ký quỹ minh bạch",
    subtitle: "Đảm bảo quyền lợi đôi bên",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
  },
  {
    icon: Palette,
    title: "Nghệ nhân Việt",
    subtitle: "Tinh hoa bàn tay khéo léo",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
  },
];

export function TrustStatsBar() {
  return (
    <div className="border-y border-white/8 bg-card/40 py-8">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${pillar.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${pillar.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
                    {pillar.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">{pillar.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
