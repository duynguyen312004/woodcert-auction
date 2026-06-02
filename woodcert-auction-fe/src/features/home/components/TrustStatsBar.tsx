import { Gavel, Palette, ShieldCheck, Wallet } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Chứng thư WoodCert",
    subtitle: "100% Gỗ thật đã kiểm định",
    iconBg:
      "bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40",
    iconColor: "text-emerald-400",
  },
  {
    icon: Gavel,
    title: "Đấu giá real-time",
    subtitle: "Nền tảng trực tuyến mượt mà",
    iconBg:
      "bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40",
    iconColor: "text-primary",
  },
  {
    icon: Wallet,
    title: "Ký quỹ minh bạch",
    subtitle: "Đảm bảo quyền lợi đôi bên",
    iconBg:
      "bg-sky-500/10 border-sky-500/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/40",
    iconColor: "text-sky-400",
  },
  {
    icon: Palette,
    title: "Nghệ nhân Việt",
    subtitle: "Tinh hoa bàn tay khéo léo",
    iconBg:
      "bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40",
    iconColor: "text-orange-400",
  },
];

export function TrustStatsBar() {
  return (
    <div className="relative border-y border-white/5 bg-[#121210]/60 backdrop-blur-md py-8 overflow-hidden select-none">
      {/* Golden gradient line accent top and bottom */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:divide-x md:divide-white/10">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group flex items-center gap-4 px-2 md:px-6 transition-all duration-300"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${pillar.iconBg}`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform duration-500 will-change-transform group-hover:scale-110 group-hover:rotate-[360deg] ${pillar.iconColor}`}
                  />
                </div>
                <div>
                  <h4 className="font-sans text-xs md:text-sm font-bold uppercase tracking-widest text-foreground transition-colors duration-300 group-hover:text-primary">
                    {pillar.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground font-light leading-relaxed">
                    {pillar.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
