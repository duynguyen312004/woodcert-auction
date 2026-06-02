import { BookOpen, ShieldCheck, Scale, Wallet, FileCheck, CheckCircle2 } from "lucide-react";

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
      title: "4. Thanh toán & Nhận chứng nhận",
      desc: "Nếu thắng đấu giá, số tiền ký quỹ sẽ được khấu trừ vào tổng tiền thanh toán. Bạn nhận tác phẩm kèm theo Chứng thư kiểm định WoodCert tích hợp chữ ký số blockchain.",
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
                Mỗi sản phẩm đấu giá sẽ yêu cầu một mức tiền ký quỹ cụ thể (thường bằng 10% - 20%
                giá khởi điểm). Số tiền này sẽ được tạm khóa trong ví WoodCert của bạn khi bạn nhấn
                đăng ký tham gia đấu giá.
              </p>
              <ul className="list-inside list-disc pl-2 space-y-1">
                <li>
                  Nếu thắng đấu giá: Số tiền ký quỹ được chuyển cho người bán như một khoản đặt cọc.
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
                cùng), WoodCert áp dụng cơ chế tự động gia hạn thêm 2-5 phút nếu có lượt trả giá
                phát sinh sát giờ kết thúc phiên.
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
              quy trình thẩm định trực tiếp bởi giám định viên lâm nghiệp độc lập. Các chỉ số xác
              minh bao gồm: tuổi gỗ, chủng loại gỗ, độ khô ẩm và tính hợp pháp của nguồn gốc xuất
              xứ.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#1f1d18] p-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h3 className="font-serif text-lg font-bold text-white">Chứng thư Điện tử</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#c4bcac]">
              Mỗi tác phẩm giao dịch thành công sẽ nhận được một mã chứng thư điện tử kèm mã QR. Mã
              QR này được khắc chìm hoặc dán tem niêm phong trên sản phẩm, cho phép người sở hữu tra
              cứu nguồn gốc tác phẩm trọn đời trên cơ sở dữ liệu xác thực WoodCert.
            </p>
          </div>
        </section>

        {/* Footer trợ giúp */}
        <footer className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-[#c4bcac]">
            Bạn cần hỗ trợ thêm thông tin hoặc muốn tư vấn trực tiếp về ký quỹ đấu giá? Vui lòng
            liên hệ với bộ phận chăm sóc khách hàng qua Hotline:{" "}
            <strong className="text-white">1900 8888</strong> hoặc Email:{" "}
            <strong className="text-white">support@woodcert.vn</strong>.
          </p>
        </footer>
      </div>
    </main>
  );
}
