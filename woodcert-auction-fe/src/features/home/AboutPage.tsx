import {
  ShieldCheck,
  Leaf,
  Fingerprint,
  Award,
  Hammer,
  Scale,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import heroBg from "@/assets/images/hero_background.png";

export function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative flex min-h-[60vh] items-center justify-center py-20 px-6 text-center">
        {/* Background Image with elegant overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="WoodCert Woodworking Craftsmanship"
            className="h-full w-full object-cover object-center opacity-30 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
        </div>

        {/* Content */}
        <div className="relative z-20 mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            Về chúng tôi
          </div>

          <h1 className="font-serif text-4xl font-bold leading-tight text-white md:text-6xl tracking-tight animate-fade-in-up">
            Bảo Chứng & Nâng Tầm <br />
            <span className="text-primary bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Gỗ Mỹ Nghệ Việt
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base font-light leading-relaxed text-[#cbbfa8] md:text-lg animate-fade-in-up [animation-delay:0.2s]">
            WoodCert ra đời với sứ mệnh xây dựng một nền tảng đấu giá gỗ mỹ nghệ kiểm định minh
            bạch, chống hàng giả, bảo tồn lâm nghiệp bền vững và kết nối tinh hoa từ bàn tay các
            nghệ nhân bậc thầy.
          </p>
        </div>
      </section>

      {/* 2. Sứ mệnh & Tầm nhìn (Mission & Vision) */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 grid gap-12 lg:grid-cols-2 items-center">
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
            Tôn vinh giá trị thực của tác phẩm nghệ thuật gỗ
          </h2>
          <div className="h-1 w-20 bg-primary/80 rounded" />

          <p className="text-sm leading-relaxed text-muted-foreground font-light">
            Trong thế giới mỹ nghệ gỗ quý, việc xác định độ tuổi, chủng loại và nguồn gốc hợp pháp
            luôn là thách thức lớn nhất đối với những người sưu tầm. Hàng giả, hàng nhái và gỗ lậu
            tàn phá rừng xanh phá hủy lòng tin của thị trường.
          </p>

          <p className="text-sm leading-relaxed text-muted-foreground font-light">
            <strong>WoodCert</strong> giải quyết triệt để vấn đề này bằng việc kết hợp quy trình
            thẩm định sinh học từ các chuyên gia hàng đầu và giải pháp công nghệ hiện đại. Mỗi sản
            phẩm được niêm yết trên hệ thống bắt buộc phải trải qua quá trình kiểm định nghiêm ngặt,
            cam kết 100% về tính chính danh và tính pháp lý.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-lg border border-white/5 bg-card/25 p-4">
              <h4 className="font-serif text-2xl font-bold text-primary">100%</h4>
              <p className="text-xs text-muted-foreground mt-1">Sản phẩm được thẩm định</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-card/25 p-4">
              <h4 className="font-serif text-2xl font-bold text-primary">Vĩnh viễn</h4>
              <p className="text-xs text-muted-foreground mt-1">Chứng thư số lưu trữ mật mã</p>
            </div>
          </div>
        </div>

        {/* Vision visual container */}
        <div className="relative rounded-2xl border border-white/10 bg-[#161411]/80 p-8 shadow-2xl space-y-6 lg:ml-6 animate-fade-in-up [animation-delay:0.2s]">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-4 bg-primary/10 border border-primary/40 text-primary p-3 rounded-xl shadow-lg backdrop-blur-md">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h3 className="font-serif text-xl font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
            Cam kết phát triển bền vững
          </h3>

          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="mt-0.5 shrink-0 rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                <Leaf className="h-4 w-4" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white">
                  Chống gỗ lậu & Phá rừng trái phép
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  WoodCert chỉ chấp nhận gỗ có hồ sơ khai thác hợp pháp và đạt các chứng nhận quốc
                  tế (FSC, VPA/FLEGT).
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2 text-primary border border-primary/20">
                <Hammer className="h-4 w-4" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white">Đồng hành cùng nghệ nhân Việt</h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kết nối và nâng đỡ những người thợ chạm khắc tài hoa, giới thiệu tinh hoa gỗ mỹ
                  nghệ Việt ra thế giới.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="mt-0.5 shrink-0 rounded-lg bg-sky-500/10 p-2 text-sky-400 border border-sky-500/20">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white">Chữ ký số mật mã học</h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mỗi chứng thư được bảo chứng bằng mã hóa độc bản, ngăn chặn hoàn toàn việc làm giả
                  hoặc tẩy xóa hồ sơ.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* 3. Giá trị Cốt lõi (Core Values) */}
      <section className="bg-card/30 border-y border-white/5 py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
            <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
              Giá trị cốt lõi
            </h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Các nguyên tắc nền tảng định hình nên mọi dịch vụ của WoodCert, kiến tạo sự tin tưởng
              tuyệt đối.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <ValueCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Minh bạch tuyệt đối"
              description="Toàn bộ thông tin từ kích thước, trọng lượng, nguồn gốc gỗ đến thông tin của Giám định viên đều được công khai rõ ràng trên hệ thống để người mua tự kiểm chứng."
            />
            <ValueCard
              icon={<Award className="h-6 w-6" />}
              title="Bảo chứng chất lượng"
              description="Đội ngũ chuyên gia thẩm định và các thiết bị thí nghiệm kiểm định của WoodCert cam kết đưa ra kết quả phân loại chuẩn xác đối với từng thớ gỗ mỹ nghệ."
            />
            <ValueCard
              icon={<Scale className="h-6 w-6" />}
              title="Giao dịch an toàn"
              description="Hệ thống ví ký quỹ và quy định đấu giá nghiêm ngặt bảo vệ quyền lợi hợp pháp cho cả người mua lẫn người bán, ngăn chặn các hành vi bỏ cọc hoặc bùng hàng."
            />
          </div>
        </div>
      </section>

      {/* 4. Quy trình kiểm định (Certification Process) */}
      <section className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
          <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
            Quy trình Bảo chứng WoodCert
          </h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Hành trình của một tác phẩm gỗ mỹ nghệ từ xưởng chế tác đến tay nhà sưu tập qua sự giám
            hộ của WoodCert.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 -z-10" />

          <ProcessStep
            number="1"
            title="Kiểm định & Giám định"
            description="Tác phẩm gỗ được gửi tới trung tâm giám định WoodCert. Giám định viên xác thực loại gỗ, độ tuổi ước tính, chất lượng gia công và cấp chữ ký số."
          />
          <ProcessStep
            number="2"
            title="Đấu giá công khai"
            description="Tác phẩm đã kiểm định được niêm yết lên sàn. Các nhà sưu tầm tham gia đấu giá real-time minh bạch, mọi thông số kiểm định đều được cung cấp chi tiết."
          />
          <ProcessStep
            number="3"
            title="Bàn giao & Lưu trữ số"
            description="Người thắng cuộc nhận tác phẩm cùng chứng thư bản cứng độc bản. Đồng thời hồ sơ số được lưu trữ mật mã, dễ dàng tra cứu trọn đời trên Registry."
          />
        </div>
      </section>

      {/* 5. Call To Action */}
      <section className="mx-auto max-w-[1120px] px-6 pb-24">
        <div className="relative rounded-3xl border border-[#cfa853]/20 bg-gradient-to-r from-[#1f1b15] to-[#161411] p-10 md:p-16 overflow-hidden shadow-2xl text-center">
          {/* Subtle gold circles in background */}
          <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full border border-primary/5 select-none pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full border border-primary/5 select-none pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-serif text-3xl font-bold text-white md:text-4xl leading-tight">
              Khám Phá Các Tác Phẩm Gỗ Mỹ Nghệ Độc Bản
            </h2>
            <p className="text-sm leading-relaxed text-[#cbbfa8] font-light max-w-lg mx-auto">
              Bắt đầu hành trình sưu tầm các tác phẩm tinh xảo đã được bảo chứng chất lượng bởi
              WoodCert ngay hôm nay.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                to="/auctions"
                className="group inline-flex items-center justify-center gap-2 rounded bg-primary py-3 px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Tham gia đấu giá
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/certificates"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/20 bg-transparent py-3 px-8 text-sm font-bold text-white transition-all duration-300 hover:bg-white/5"
              >
                Tra cứu chứng nhận
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#181612]/40 p-8 space-y-4 hover:border-primary/30 hover:bg-[#181612]/60 transition-all duration-300">
      <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary border border-primary/20">
        {icon}
      </div>
      <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground font-light">{description}</p>
    </div>
  );
}

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
}

function ProcessStep({ number, title, description }: ProcessStepProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 px-4">
      <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#1c1a16] border-2 border-primary text-primary font-serif font-bold text-lg shadow-lg">
        {number}
      </div>
      <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground font-light max-w-sm">
        {description}
      </p>
    </div>
  );
}
