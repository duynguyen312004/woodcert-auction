import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck,
  PackageCheck,
  Scale,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

export function GuidePage() {
  const steps = [
    {
      icon: <Wallet className="h-6 w-6 text-primary" />,
      title: "1. Đăng ký & Nạp tiền ký quỹ",
      desc: "Tạo tài khoản thành viên WoodCert. Trước khi tham gia đấu giá bất kỳ tác phẩm nào, bạn cần thực hiện nạp tiền ký quỹ để đảm bảo tính minh bạch và trách nhiệm của phiên đấu giá.",
    },
    {
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      title: "2. Chọn lựa sản phẩm",
      desc: "Xem danh sách các tác phẩm đang hoặc sắp đấu giá. Bạn có thể tra cứu hồ sơ kiểm định của sản phẩm từ giám định viên WoodCert trước khi quyết định đấu giá.",
    },
    {
      icon: <Scale className="h-6 w-6 text-primary" />,
      title: "3. Tham gia trả giá",
      desc: "Đặt giá tự do hoặc theo các bước giá quy định của hệ thống. Bạn sẽ nhận được thông báo ngay lập tức nếu có người trả giá cao hơn.",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-primary" />,
      title: "4. Thanh toán & Theo dõi đơn",
      desc: "Nếu thắng đấu giá, tiền ký quỹ được cấn trừ vào giá đơn. Hãy theo dõi hạn thanh toán, hạn Seller xác nhận đã gửi hàng và thời điểm đơn tự động hoàn tất.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#181612] px-4 py-12 text-[#f2eee5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[960px] space-y-12">
        {/* Header */}
        <header className="border-b border-white/10 pb-8 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Hướng dẫn sử dụng
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Quy trình & Quy chế Đấu giá
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8D877C]">
            Chào mừng bạn đến với WoodCert Auction. Vui lòng đọc kỹ hướng dẫn dưới đây để có trải
            nghiệm đấu giá gỗ mỹ nghệ an toàn, minh bạch và chuyên nghiệp nhất.
          </p>
        </header>

        {/* Quy trình các bước */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-white">4 Bước Tham Gia Đấu Giá</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-lg border border-white/5 bg-[#1f1d18] p-6 transition-all duration-300 hover:border-primary/30"
              >
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#c4bcac]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="order-deadlines"
          className="scroll-mt-24 overflow-hidden rounded-lg border border-primary/25 bg-[#1f1d18]"
        >
          <div className="grid border-b border-white/10 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-primary/10 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Sau khi thắng đấu giá
              </p>
              <h2 className="mt-3 font-serif text-2xl font-bold text-white">
                Ba mốc thời gian cần nhớ
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#c4bcac]">
                Các mốc dưới đây quyết định việc hủy đơn, hoàn tiền hoặc thanh toán cho Seller. Mốc
                thời gian cụ thể luôn được hiển thị trong trang chi tiết đơn hàng.
              </p>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              <DeadlineRule
                icon={<Wallet />}
                eyebrow="Buyer"
                title="72 giờ thanh toán"
                description="Buyer thanh toán phần còn lại và chọn địa chỉ nhận hàng. Quá hạn, đơn bị hủy và tiền cọc bị xử lý theo quy định."
              />
              <DeadlineRule
                icon={<PackageCheck />}
                eyebrow="Seller"
                title="72 giờ xác nhận đã gửi"
                description="Tính từ khi Buyer thanh toán. Seller phải xác nhận đã gửi hoặc bàn giao hàng; đây không phải hạn hàng phải tới nơi."
              />
              <DeadlineRule
                icon={<Clock3 />}
                eyebrow="Buyer"
                title="7 ngày phản hồi"
                description="Tính từ khi Seller xác nhận đã gửi. Buyer xác nhận nhận hàng hoặc mở tranh chấp trước khi đơn tự động hoàn tất."
              />
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
            <GuideNotice
              icon={<Truck />}
              title="Khi hàng đang vận chuyển"
              description="Trạng thái SHIPPED chỉ ghi nhận Seller đã khai báo bắt đầu giao hàng. WoodCert hiện chưa kết nối hệ thống logistics để xác minh kiện hàng đã tới tay Buyer."
            />
            <GuideNotice
              icon={<AlertTriangle />}
              title="Khi chưa nhận hàng hoặc hàng có vấn đề"
              description="Buyer phải mở tranh chấp trước thời điểm tự động hoàn tất và cung cấp bằng chứng. Khi có tranh chấp, hệ thống tạm dừng payout để Admin phân xử."
            />
          </div>

          <div className="border-t border-white/10 bg-black/15 px-6 py-5 sm:px-8">
            <p className="text-sm leading-relaxed text-[#d8d0c1]">
              <strong className="text-white">Nếu Buyer không phản hồi:</strong> sau 7 ngày kể từ lúc
              Seller xác nhận đã gửi hàng, đơn có thể tự động hoàn tất, Seller được nhận tiền sau
              khi trừ phí sàn và quyền mở tranh chấp theo luồng đơn đang giao không còn áp dụng.
            </p>
          </div>
        </section>

        {/* Chi tiết quy định */}
        <section className="rounded-lg border border-white/10 bg-[#1f1d18] p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Scale className="h-6 w-6 text-primary" />
            <h2 className="font-serif text-xl font-bold text-white">Quy định Ký quỹ & Đấu giá</h2>
          </div>
          <div className="mt-6 space-y-6 text-sm text-[#c4bcac]">
            <div className="space-y-2">
              <h4 className="font-bold text-white">1. Tiền đặt trước (Ký quỹ)</h4>
              <p className="leading-relaxed">
                Mỗi phiên đấu giá có một mức tiền ký quỹ cụ thể do hệ thống lưu cùng thông tin
                phiên. Số tiền này được tạm khóa trong ví WoodCert khi bạn đăng ký tham gia.
              </p>
              <ul className="list-inside list-disc pl-2 space-y-1">
                <li>
                  Nếu thắng đấu giá: Số tiền ký quỹ được khấu trừ và cấn vào giá trị đơn hàng.
                </li>
                <li>
                  Nếu không thắng đấu giá: Số tiền ký quỹ sẽ được tự động hoàn trả nguyên vẹn về ví
                  của bạn ngay khi phiên đấu giá kết thúc.
                </li>
                <li>
                  Trường hợp vi phạm (hủy kèo, không thanh toán): Tiền ký quỹ sẽ bị tịch thu để bồi
                  thường cho người bán và vận hành sàn.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white">2. Bước giá và Thời gian gia hạn</h4>
              <p className="leading-relaxed">
                Lượt trả giá hợp lệ tiếp theo phải cao hơn giá hiện tại ít nhất là một bước giá được
                định trước cho sản phẩm đó. Để ngăn chặn hành vi "bắn tỉa" (đặt giá ở giây cuối
                cùng), hệ thống tự động gia hạn theo cấu hình. Cấu hình hiện tại mặc định gia hạn
                thêm 60 giây khi có lượt trả giá hợp lệ trong 30 giây cuối.
              </p>
            </div>
          </div>
        </section>

        {/* Hệ thống WoodCert */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-[#1f1d18] p-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h3 className="font-serif text-lg font-bold text-white">Cam kết Thẩm định</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#c4bcac]">
              Tất cả các sản phẩm gỗ mỹ nghệ trước khi xuất hiện trên sàn WoodCert đều phải đi qua
              quy trình thẩm định trên hệ thống bởi Thẩm định viên. Báo cáo lưu các thông tin như
              vật liệu được xác minh, ước lượng tuổi, nguồn gốc, tình trạng và giá trị ước tính.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#1f1d18] p-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h3 className="font-serif text-lg font-bold text-white">Chứng thư Điện tử</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#c4bcac]">
              Sản phẩm được thẩm định đạt sẽ có mã chứng thư điện tử để tra cứu công khai hồ sơ thẩm
              định trên WoodCert. Phiên bản hiện tại lưu dấu vân tay SHA-256 tại thời điểm phê duyệt
              để phục vụ đối chiếu; hệ thống chưa tự động tính lại mã băm và đây không phải chữ ký
              số.
            </p>
          </div>
        </section>

        {/* Footer trợ giúp */}
        <footer className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-[#c4bcac]">
            Trước khi thanh toán hoặc xác nhận đã gửi hàng, hãy kiểm tra các mốc thời gian trong
            trang chi tiết đơn. Khi hàng chưa tới hoặc có dấu hiệu sai mô tả, Buyer cần mở tranh
            chấp trước thời điểm đơn tự động hoàn tất.
          </p>
        </footer>
      </div>
    </main>
  );
}

function DeadlineRule({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <article className="bg-[#1f1d18] p-5">
      <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
        {icon}
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h3 className="mt-1 font-serif text-lg font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#bdb4a4]">{description}</p>
    </article>
  );
}

function GuideNotice({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="flex gap-4">
      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary [&_svg]:size-5">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#bdb4a4]">{description}</p>
      </div>
    </article>
  );
}
