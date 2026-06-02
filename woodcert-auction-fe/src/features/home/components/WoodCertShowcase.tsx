import { Award, CheckCircle, FileText, QrCode, Shield } from "lucide-react";

export function WoodCertShowcase() {
  return (
    <section className="py-24 relative overflow-hidden bg-background select-none">
      {/* Decorative Golden Ambient Glow */}
      <div className="absolute left-0 bottom-1/4 h-[400px] w-[400px] rounded-full bg-primary/3 blur-[130px] pointer-events-none" />
      <div className="absolute right-0 top-1/4 h-[350px] w-[350px] rounded-full bg-primary/2 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="grid gap-16 lg:grid-cols-12 items-center">
          {/* Left Column: Story & Trust Benefits */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-primary">
                Uncompromising Trust
              </span>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-tight">
                Bảo chứng độc quyền từ WoodCert
              </h2>
            </div>

            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              Mỗi tác phẩm giao dịch trên sàn WoodCert Auction đều bắt buộc phải trải qua quy trình
              kiểm định khoa học và được cấp Chứng thư độc bản vật lý kết hợp kỹ thuật số.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-foreground">
                    Cam kết 100% gỗ thật
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground font-light leading-relaxed">
                    Sử dụng công nghệ quang phổ cận hồng ngoại (NIRS) để xác định chính xác danh
                    tính sinh học của loại gỗ.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-foreground">
                    Xác nhận nghệ nhân chế tác
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground font-light leading-relaxed">
                    Ký số điện tử và dấu mộc vật lý từ chính các nghệ nhân bậc thầy để khẳng định
                    nguồn gốc tác phẩm.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-foreground">
                    Định danh số hóa độc bản
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground font-light leading-relaxed">
                    Tích hợp chip thông minh NFC hoặc định danh mã hóa (Digital Twin) chống sao chép
                    và làm giả.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Mockup of the Certificate */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="group relative w-full max-w-[580px] p-1.5 rounded-2xl bg-gradient-to-br from-primary/30 via-white/5 to-white/5 shadow-2xl shadow-black/80 hover:shadow-primary/5 transition-all duration-700">
              {/* Inner Luxury Certificate Layout */}
              <div className="relative overflow-hidden rounded-xl bg-[#141412] p-8 md:p-10 border border-white/5">
                {/* Certificate Background Watermark texture effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,168,79,0.03)_0%,transparent_70%)] pointer-events-none" />

                {/* Classic Corner Ornaments */}
                <div className="absolute top-6 left-6 h-6 w-6 border-t border-l border-primary/40" />
                <div className="absolute top-6 right-6 h-6 w-6 border-t border-r border-primary/40" />
                <div className="absolute bottom-6 left-6 h-6 w-6 border-b border-l border-primary/40" />
                <div className="absolute bottom-6 right-6 h-6 w-6 border-b border-r border-primary/40" />

                {/* Header of Certificate */}
                <div className="text-center pb-6 border-b border-white/5">
                  <h3 className="font-serif text-lg tracking-[0.2em] text-primary uppercase font-semibold">
                    WoodCert Certificate
                  </h3>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 mt-1">
                    Authenticity & Origin Guarantee
                  </p>
                  <p className="font-sans text-[10px] text-primary/70 mt-2 font-mono">
                    No. WC-9883-2026
                  </p>
                </div>

                {/* Body Details */}
                <div className="py-8 grid gap-4 md:grid-cols-2 text-xs font-light">
                  <div className="space-y-4">
                    <div>
                      <span className="text-white/40 block uppercase tracking-widest text-[9px] mb-0.5">
                        Tên tác phẩm
                      </span>
                      <span className="text-white font-serif font-bold text-sm">
                        Di Lặc Dưới Gốc Tùng
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block uppercase tracking-widest text-[9px] mb-0.5">
                        Nghệ nhân
                      </span>
                      <span className="text-white font-medium">NNND. Nguyễn Văn Trúc</span>
                    </div>
                    <div>
                      <span className="text-white/40 block uppercase tracking-widest text-[9px] mb-0.5">
                        Làng nghề
                      </span>
                      <span className="text-white">Làng nghề Nhân Hiền, Hà Nội</span>
                    </div>
                  </div>

                  <div className="space-y-4 md:border-l md:border-white/5 md:pl-6">
                    <div>
                      <span className="text-white/40 block uppercase tracking-widest text-[9px] mb-0.5">
                        Phân chủng gỗ
                      </span>
                      <span className="text-primary font-medium">Gỗ Sưa Đỏ Bắc Bộ</span>
                    </div>
                    <div>
                      <span className="text-white/40 block uppercase tracking-widest text-[9px] mb-0.5">
                        Tuổi thọ gỗ
                      </span>
                      <span className="text-white font-medium">Trên 120 năm</span>
                    </div>
                    <div>
                      <span className="text-white/40 block uppercase tracking-widest text-[9px] mb-0.5">
                        Kiểm định sinh học
                      </span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-400" /> Đạt chuẩn kiểm định
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer of Certificate: Stamps & QR */}
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <QrCode className="h-10 w-10 text-white/80" />
                    </div>
                    <div className="text-[9px] font-mono text-white/40 leading-normal">
                      Quét mã QR để
                      <br />
                      truy xuất Blockchain
                    </div>
                  </div>

                  {/* Stamp Gold Logo */}
                  <div className="relative flex items-center justify-center h-16 w-16 rounded-full border border-primary/30 bg-primary/5 text-primary text-center">
                    <div className="absolute inset-1 rounded-full border border-dashed border-primary/20" />
                    <span className="font-serif text-[8px] font-extrabold uppercase tracking-wider leading-tight">
                      WoodCert
                      <br />
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative side badge */}
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground font-serif text-[10px] uppercase font-bold tracking-widest py-1 px-3.5 rounded shadow-lg shadow-primary/20 rotate-3 transition-transform duration-500 group-hover:rotate-6">
                Bảo Chứng Vàng
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
