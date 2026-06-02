import { Award } from "lucide-react";

const artisans = [
  {
    name: "Nguyễn Văn Trúc",
    title: "Nghệ nhân Nhân dân",
    village: "Làng nghề Nhân Hiền, Hà Nội",
    experience: "Hơn 45 năm phục dựng & tạc tượng Phật",
    philosophy:
      "Đục một pho tượng Phật không chỉ là chạm khắc vào thớ gỗ, mà là đánh thức lòng từ bi ẩn sâu trong từng vân gỗ.",
    specialties: ["Tượng Phật Quy Mô Lớn", "Phục Dựng Di Sản", "Chất liệu Sưa, Trắc"],
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&h=800&q=80",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    name: "Đỗ Văn Cường",
    title: "Nghệ nhân Ưu tú",
    village: "Làng nghề Thiết Úng, Hà Nội",
    experience: "Hơn 25 năm điêu khắc gỗ mỹ nghệ độc bản",
    philosophy:
      "Gỗ mỹ nghệ đương đại đòi hỏi kỹ thuật chạm lọng tinh xảo của cha ông kết hợp với tư duy hình khối và hơi thở của thời đại.",
    specialties: ["Điêu Khắc Đương Đại", "Chạm Lọng Tinh Xảo", "Gỗ Lũa Nghệ Thuật"],
    image:
      "https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&h=800&q=80",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
  },
];

export function ArtisanShowcase() {
  return (
    <section className="py-24 relative overflow-hidden bg-background select-none">
      {/* Decorative Golden Ambient Glow */}
      <div className="absolute right-0 bottom-1/4 h-[400px] w-[400px] rounded-full bg-primary/2 blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Masters of Craft
          </span>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-tight">
            Những đôi bàn tay kiến tạo di sản
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
            WoodCert đồng hành cùng các Nghệ nhân Nhân dân, Nghệ nhân Ưu tú hàng đầu Việt Nam để đưa
            những tác phẩm chạm khắc gỗ chạm ngưỡng kiệt tác lên sàn đấu giá.
          </p>
        </div>

        {/* Artisans Grid */}
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {artisans.map((artisan) => (
            <div
              key={artisan.name}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#141412] p-8 transition-all duration-500 hover:border-primary/45 hover:shadow-[0_10px_30px_-5px_rgba(214,168,79,0.1)] flex flex-col justify-between min-h-[480px]"
            >
              {/* Card Header */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${artisan.badgeColor}`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    {artisan.title}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    {artisan.village}
                  </span>
                </div>

                <h3 className="font-serif text-3xl font-bold text-white tracking-wide transition-colors duration-300 group-hover:text-primary mt-2">
                  {artisan.name}
                </h3>

                <p className="text-xs font-light text-primary/80 mt-1.5 tracking-wide font-serif italic">
                  {artisan.experience}
                </p>

                {/* Specialties Tag Cloud */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {artisan.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="text-[9px] uppercase tracking-widest bg-white/5 border border-white/10 text-white/70 px-2.5 py-1 rounded"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Artisan Image (Embedded inside container as a stylized preview) */}
              <div className="relative my-6 h-40 w-full overflow-hidden rounded-lg border border-white/5 bg-[#1a1a17]">
                <img
                  src={artisan.image}
                  alt={artisan.name}
                  className="h-full w-full object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-105 opacity-60 group-hover:opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141412] via-transparent to-transparent" />
              </div>

              {/* Artisan Philosophy */}
              <div className="relative z-10 border-t border-white/5 pt-4">
                <div className="flex gap-3 items-start">
                  <span className="text-3xl font-serif text-primary/40 leading-none select-none">
                    “
                  </span>
                  <p className="text-xs font-light leading-relaxed text-white/70 italic">
                    {artisan.philosophy}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
