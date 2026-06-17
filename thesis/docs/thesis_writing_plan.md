# Kế hoạch viết báo cáo đồ án WoodCert Auction

## Phạm vi và nguyên tắc

- Kế hoạch này bám đúng sáu chương chính đang được khai báo trong `thesis/DoAn.tex`.
- Không đổi tên chương lớn. Tên chương do `DoAn.tex` tạo; file con trong `thesis/Chuong/` không tự
  chứa `\chapter{}`.
- Các section/subsection dưới đây là kế hoạch thay thế nội dung mẫu của template. Việc viết Markdown
  và chuyển sang LaTeX sẽ thực hiện theo từng section sau khi được duyệt.
- Độ dài dự kiến là ước lượng làm việc, không phải quy định tổng số trang của template, trừ khi
  template đã nêu rõ trong file chương tương ứng.
- File này không viết nội dung báo cáo chi tiết, không tạo sơ đồ, không sửa LaTeX và không sửa source
  code ứng dụng.
- **Mỗi chương (2-6) phải có đoạn mở đầu chương** (giới thiệu nội dung sẽ trình bày, liên kết chương
  trước) **và đoạn kết chương** (tóm tắt kết quả chương, liên kết chương sau) theo hướng dẫn template
  tại `Chuong/1_Gioi_thieu.tex:46-54`. Hai đoạn này viết dạng văn bản thường, không tạo section riêng.

## Căn cứ lập kế hoạch

- Cấu trúc template: `thesis/DoAn.tex`, `thesis/template_analysis.md`.
- Phân tích hệ thống: `thesis/docs/system_analysis.md`.
- Bản đồ chứng cứ: `thesis/docs/evidence_map.md`.
- Quy tắc làm việc và trung thực học thuật: `AGENTS.md`.

## Chiến lược tham chiếu chéo chương 4 ↔ chương 5

Theo hướng dẫn template (`Chuong/5_Giai_phap_dong_gop.tex:9-11`), những nội dung mang tính đóng góp
hoặc giải pháp nổi bật **chỉ được mô tả sơ bộ trong chương 4**, kèm tham chiếu chéo tới chương 5
bằng `\ref{}`. **Chi tiết về vấn đề, giải pháp và kết quả** được trình bày đầy đủ trong chương 5.

Khi viết chương 4, với mỗi nội dung thuộc đóng góp nổi bật, cần:
1. Tóm tắt ngắn gọn thiết kế/cơ chế (1-2 đoạn).
2. Ghi câu dạng: "Chi tiết về giải pháp này được trình bày trong phần X.Y."
3. Tránh lặp lại toàn bộ phân tích vấn đề/giải pháp đã có ở chương 5.

## Bản đồ chương chính

| Chương | Tên chương giữ nguyên theo template | File LaTeX hiện tại | Vai trò trong báo cáo |
|---|---|---|---|
| 1 | GIỚI THIỆU ĐỀ TÀI | `thesis/Chuong/1_Gioi_thieu.tex` | Viết sau khi chương kỹ thuật ổn định; trình bày vấn đề, mục tiêu, phạm vi và bố cục. |
| 2 | KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU | `thesis/Chuong/2_Khao_sat.tex` | Nền nghiệp vụ: actor, yêu cầu, use case và quy trình chính. |
| 3 | NỀN TẢNG LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG | `thesis/Chuong/3_Cong_nghe.tex` | Công nghệ được chọn, lựa chọn thay thế và lý do phù hợp với yêu cầu. |
| 4 | PHÂN TÍCH THIẾT KẾ, TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | Trọng tâm kỹ thuật: kiến trúc, database, API, Redis/MySQL, kiểm thử và triển khai. Mô tả sơ bộ các đóng góp nổi bật và tham chiếu chéo tới chương 5. |
| 5 | CÁC GIẢI PHÁP VÀ ĐÓNG GÓP NỔI BẬT | `thesis/Chuong/5_Giai_phap_dong_gop.tex` | Trình bày chi tiết từng đóng góp theo cấu trúc 3 phần: vấn đề → giải pháp → kết quả. |
| 6 | KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN | `thesis/Chuong/6_Ket_luan.tex` | Viết cuối cùng; tổng kết kết quả, hạn chế và hướng phát triển. |

## Chương 1 - GIỚI THIỆU ĐỀ TÀI

Ưu tiên viết chương này sau khi chương 2, 3, 4 và 5 đã ổn định để phần giới thiệu không bị lệch với
nội dung kỹ thuật thực tế.

| Tên mục | Mục tiêu | Nội dung cần viết | Căn cứ từ system_analysis/evidence_map | Hình, bảng hoặc sơ đồ cần có | File Markdown dự kiến | File LaTeX tương ứng | Độ dài dự kiến | Thông tin cần xác nhận |
|---|---|---|---|---|---|---|---|---|
| Chương 1 - GIỚI THIỆU ĐỀ TÀI | Mở đầu báo cáo và định vị đề tài. | Tổng quan vấn đề tin cậy trong giao dịch sản phẩm gỗ mỹ nghệ và nhu cầu nền tảng đấu giá có kiểm định. | `system_analysis.md` mục 2; `evidence_map.md` nhóm kiến trúc và nghiệp vụ. | Không bắt buộc; có thể có bảng phạm vi nếu cần. | `thesis/markdown/chapter-1/00-gioi-thieu-de-tai.md` | `thesis/Chuong/1_Gioi_thieu.tex` | 3-6 trang theo hướng dẫn template. | Đã chốt — xem mục Thông tin bìa. |
| Section - Đặt vấn đề | Nêu bối cảnh và vấn đề chính. | Nhu cầu xác thực nguồn gốc/chất lượng, rủi ro giao dịch online, nhu cầu realtime auction và quy trình sau đấu giá. Bám phạm vi hệ thống, không nhấn mạnh thị trường gỗ mỹ nghệ Việt Nam (không có nguồn uy tín). | `system_analysis.md` mục 2, 7.4-7.9; `evidence_map.md` nhóm product, appraisal, auction, wallet, fulfillment. | Không bắt buộc. | `thesis/markdown/chapter-1/01-dat-van-de.md` | `thesis/Chuong/1_Gioi_thieu.tex` | 0.8-1.2 trang. | Đã chốt — bám phạm vi hệ thống. |
| Section - Mục tiêu và phạm vi đề tài | Xác định mục tiêu triển khai và ranh giới hệ thống. | Mục tiêu chức năng: sản phẩm, kiểm định, chứng thư, đấu giá, ví, đơn hàng, giao nhận, tranh chấp; phạm vi loại trừ: notification lưu bền, partial refund, logistics bên thứ ba. | `system_analysis.md` mục 2, 12; `evidence_map.md` nhóm deferred và chức năng đã triển khai. | Bảng phạm vi trong/ngoài hệ thống. | `thesis/markdown/chapter-1/02-muc-tieu-pham-vi.md` | `thesis/Chuong/1_Gioi_thieu.tex` | 0.8-1.2 trang. | Không có. |
| Section - Định hướng giải pháp | Tóm tắt hướng tiếp cận ở mức cao. | Modular monolith backend, SPA frontend, MySQL bền vững, Redis runtime cho auction ACTIVE, Cloudinary, VNPay Sandbox, Docker/Nginx/CI-CD. Chỉ nêu tên công nghệ và lý do chọn ngắn gọn, không giải thích chi tiết. | `system_analysis.md` mục 3, 9, 11; `evidence_map.md` nhóm kiến trúc, Redis/MySQL, CI/CD. | Sơ đồ tổng quan có thể đặt ở chương 4 thay vì chương 1. | `thesis/markdown/chapter-1/03-dinh-huong-giai-phap.md` | `thesis/Chuong/1_Gioi_thieu.tex` | 0.6-1 trang. | Không có. |
| Section - Bố cục đồ án | Giới thiệu nội dung sáu chương. | Mô tả ngắn vai trò chương 2-6 dưới dạng đoạn văn (không gạch đầu dòng). Viết sau khi đề cương toàn bộ đã duyệt. | `thesis/template_analysis.md` mục 3.2-3.3; kế hoạch này. | Không có. | `thesis/markdown/chapter-1/04-bo-cuc-do-an.md` | `thesis/Chuong/1_Gioi_thieu.tex` | 0.4-0.6 trang. | Không có. |

## Chương 2 - KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU

Chương này là nền tảng nghiệp vụ. Theo template, chương 2 được gợi ý khoảng 9-11 trang. Nội dung cần
ưu tiên actor, yêu cầu chức năng/phi chức năng, use case và luồng nghiệp vụ.

Template yêu cầu khảo sát ba nguồn: (i) người dùng/khách hàng, (ii) hệ thống đã có, (iii) ứng dụng
tương tự (`Chuong/2_Khao_sat.tex:12-13`). Plan cần bao gồm khảo sát sản phẩm/hệ thống tương tự.

Template yêu cầu đặc tả chi tiết 4-7 use case quan trọng nhất (`Chuong/2_Khao_sat.tex:36`), mỗi đặc
tả gồm: tên UC, luồng sự kiện chính/phát sinh, tiền điều kiện, hậu điều kiện. Cần phân biệt phần
này với bảng liệt kê yêu cầu chức năng.

| Tên mục | Mục tiêu | Nội dung cần viết | Căn cứ từ system_analysis/evidence_map | Hình, bảng hoặc sơ đồ cần có | File Markdown dự kiến | File LaTeX tương ứng | Độ dài dự kiến | Thông tin cần xác nhận |
|---|---|---|---|---|---|---|---|---|
| Chương 2 - KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU | Xác định bài toán, người dùng và yêu cầu hệ thống. | Khảo sát hiện trạng, hệ thống tương tự, actor, use case, nghiệp vụ, yêu cầu chức năng và phi chức năng. | `system_analysis.md` mục 2, 4, 7, 12; `evidence_map.md` nhóm actor và luồng nghiệp vụ. | Use case tổng quát, activity nghiệp vụ, bảng yêu cầu. | `thesis/markdown/chapter-2/00-khao-sat-phan-tich-yeu-cau.md` | `thesis/Chuong/2_Khao_sat.tex` | 9-11 trang theo hướng dẫn template. | Không có. |
| Section - Khảo sát hiện trạng | Làm rõ bối cảnh, vấn đề cần giải quyết và phân tích hệ thống tương tự. | Hiện trạng giao dịch sản phẩm gỗ, nhu cầu kiểm định, rủi ro thanh toán/giao nhận/tranh chấp, nhu cầu realtime bidding. Khảo sát 3 nền tảng đấu giá: **eBay Auction** (quốc tế, tổng quát), **Catawiki** (đấu giá hàng sưu tầm/nghệ thuật), **Lạc Việt Auction** (Việt Nam, đấu giá tài sản). Phân tích ưu nhược điểm về kiểm định, thanh toán, tranh chấp và rút ra yêu cầu cho WoodCert Auction. | `system_analysis.md` mục 2, 7; `evidence_map.md` nhóm product, certificate, auction, wallet, dispute. | Bảng so sánh hệ thống tương tự; bảng vấn đề → yêu cầu hệ thống. | `thesis/markdown/chapter-2/01-khao-sat-hien-trang.md` | `thesis/Chuong/2_Khao_sat.tex` | 1.5-2.5 trang. | Đã chốt — eBay, Catawiki, Lạc Việt Auction. |
| Subsection - Bối cảnh nghiệp vụ | Đặt nền cho bài toán. | Mô tả vòng đời sản phẩm gỗ từ người bán đến người mua trong phạm vi hệ thống. | `system_analysis.md` mục 2, 7.4-7.9. | Không bắt buộc. | `thesis/markdown/chapter-2/01-khao-sat-hien-trang.md` | `thesis/Chuong/2_Khao_sat.tex` | 0.4-0.6 trang. | Không có. |
| Subsection - Khảo sát sản phẩm/hệ thống tương tự | Đáp ứng yêu cầu template khảo sát hệ thống đã có và ứng dụng tương tự. | So sánh 3 nền tảng: (1) **eBay Auction**, (2) **Catawiki**, (3) **Lạc Việt Auction**. Phân tích ưu nhược điểm về kiểm định, thanh toán và tranh chấp. Mỗi nhận định phải có nguồn trích dẫn chính thức (website nền tảng, help center, điều khoản sử dụng) — không dùng nhận xét chưa xác minh. | Nghiên cứu bên ngoài kết hợp `system_analysis.md` mục 2. Cần trích nguồn chính thức trước khi viết. | Bảng so sánh hệ thống tương tự (tên, ưu điểm, hạn chế, khía cạnh thiếu, nguồn). | `thesis/markdown/chapter-2/01-khao-sat-hien-trang.md` | `thesis/Chuong/2_Khao_sat.tex` | 0.6-0.8 trang. | Đã chốt 3 nền tảng. Nhận định cụ thể cần kiểm chứng/trích nguồn chính thức trước khi viết. |
| Subsection - Vấn đề cần giải quyết | Chuyển bối cảnh thành yêu cầu. | Tin cậy chứng thư, đấu giá realtime, quản lý cọc, settlement, giao nhận và tranh chấp. Dẫn từ hạn chế của hệ thống tương tự sang yêu cầu WoodCert Auction. | `evidence_map.md` nhóm kiểm định, Redis/MySQL, wallet, fulfillment, dispute. | Bảng vấn đề → chức năng đáp ứng. | `thesis/markdown/chapter-2/01-khao-sat-hien-trang.md` | `thesis/Chuong/2_Khao_sat.tex` | 0.6-0.8 trang. | Không có. |
| Section - Tổng quan chức năng | Trình bày phạm vi nghiệp vụ và actor. | Tổng quan hệ thống WoodCert Auction, actor, quyền hạn và nhóm chức năng theo vai trò. | `system_analysis.md` mục 4, 5; `evidence_map.md` nhóm actor/quyền hạn. | Bảng actor → chức năng; sơ đồ use case tổng quát. | `thesis/markdown/chapter-2/02-tong-quan-chuc-nang.md` | `thesis/Chuong/2_Khao_sat.tex` | 2-2.5 trang. | Không có. |
| Subsection - Actor và vai trò người dùng | Chuẩn hóa thuật ngữ vai trò. | Khách, Bidder, Seller, Appraiser, Admin và actor hệ thống/scheduler. Giữ tên tiếng Anh cho vai trò kỹ thuật, kèm giải thích tiếng Việt lần đầu xuất hiện. | `system_analysis.md` mục 4.1, 4.3; `evidence_map.md` nhóm actor. | Bảng actor → quyền chính. | `thesis/markdown/chapter-2/02-tong-quan-chuc-nang.md` | `thesis/Chuong/2_Khao_sat.tex` | 0.6-0.8 trang. | Không có. |
| Subsection - Biểu đồ use case tổng quát | Cho người đọc thấy biên hệ thống. | Use case cấp cao theo actor, không lạm dụng include/extend. | `system_analysis.md` mục 4, 7; `evidence_map.md` nhóm actor và luồng nghiệp vụ. | PlantUML use case tổng quát. | `thesis/markdown/chapter-2/02-tong-quan-chuc-nang.md` | `thesis/Chuong/2_Khao_sat.tex` | 0.5-0.7 trang. | Không có. |
| Subsection - Biểu đồ use case phân rã theo nhóm nghiệp vụ | Thay placeholder `XYZ` bằng phân rã thật. | Phân rã thành nhóm: tài khoản, sản phẩm/kiểm định, đấu giá, tài chính/đơn hàng, fulfillment/dispute, admin. | `system_analysis.md` mục 5, 7; `evidence_map.md` toàn bộ nhóm nghiệp vụ. | 1-2 sơ đồ use case phân rã. | `thesis/markdown/chapter-2/02-tong-quan-chuc-nang.md` | `thesis/Chuong/2_Khao_sat.tex` | 0.8-1 trang. | Không có. |
| Subsection - Quy trình nghiệp vụ tổng quát | Kết nối các module thành luồng end-to-end. | Tạo sản phẩm -> kiểm định/chứng thư -> tạo phiên -> đăng ký/bid -> close -> order/payment -> fulfillment -> dispute nếu có. | `system_analysis.md` mục 7.4-7.11; `evidence_map.md` nhóm luồng nghiệp vụ. | Activity diagram quy trình tổng quát. | `thesis/markdown/chapter-2/02-tong-quan-chuc-nang.md` | `thesis/Chuong/2_Khao_sat.tex` | 0.8-1 trang. | Không có. |
| Section - Yêu cầu chức năng | Liệt kê yêu cầu chức năng theo module/actor. | Các nhóm chức năng đã triển khai, có kết nối frontend/backend và trạng thái deferred. Trình bày dạng bảng mã hóa FR theo nhóm. | `system_analysis.md` mục 5, 6, 12; `evidence_map.md` toàn bộ nhóm chức năng. | Bảng yêu cầu chức năng (mã FR, tên, mô tả, actor, module). | `thesis/markdown/chapter-2/03-yeu-cau-chuc-nang.md` | `thesis/Chuong/2_Khao_sat.tex` | 1.5-2 trang. | Không có. |
| Section - Đặc tả use case | Đặc tả chi tiết 6 use case quan trọng nhất theo format template. | Mỗi UC gồm: tên, actor chính, tiền điều kiện, hậu điều kiện, luồng sự kiện chính và luồng phát sinh. **6 UC đã chốt:** (1) Đặt giá realtime, (2) Tạo phiên đấu giá, (3) Đăng ký tham gia đấu giá, (4) Thanh toán đơn hàng, (5) Gửi kiểm định, (6) Mở tranh chấp. Lưu ý: sơ đồ use case tổng quát và phân rã đã có ở section Tổng quan chức năng phía trên; section này chỉ đặc tả chi tiết 6 UC. UC còn lại đặt vào phụ lục B. | `system_analysis.md` mục 6, 7; `evidence_map.md` nhóm auction, wallet, catalog, dispute. | Bảng đặc tả UC (bảng dạng template); activity diagram cho UC phức tạp nếu cần. | `thesis/markdown/chapter-2/04-dac-ta-use-case.md` | `thesis/Chuong/2_Khao_sat.tex` | 1.5-2.5 trang (6 UC × 0.3-0.4 trang/UC). | Đã chốt — 6 UC như liệt kê. |
| Section - Yêu cầu phi chức năng | Gắn chất lượng hệ thống với thiết kế ở chương 4. | Bảo mật, toàn vẹn dữ liệu, realtime, phục hồi lỗi, kiểm thử, triển khai, bảo vệ dữ liệu nhạy cảm. | `system_analysis.md` mục 3, 8, 9, 11, 14; `evidence_map.md` nhóm security, Redis/MySQL, CI/CD, testing. | Bảng NFR → căn cứ thiết kế. | `thesis/markdown/chapter-2/05-yeu-cau-phi-chuc-nang.md` | `thesis/Chuong/2_Khao_sat.tex` | 1-1.5 trang. | Không có. |

## Chương 3 - NỀN TẢNG LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

Chương 3 chỉ nên giải thích công nghệ phục vụ yêu cầu của chương 2, không biến thành tài liệu hướng
dẫn dài. Template gợi ý chương này không quá 10 trang.

Template yêu cầu rõ (`Chuong/3_Cong_nghe.tex:8`): với từng công nghệ, sinh viên **phải liệt kê danh
sách các công nghệ/hướng tiếp cận tương tự** có thể dùng làm lựa chọn thay thế, rồi **giải thích rõ
sự lựa chọn của mình**. Mỗi nhóm công nghệ chính cần có đoạn hoặc bảng so sánh ngắn.

Template cũng yêu cầu chỉ rõ nguồn kiến thức và trích dẫn tài liệu tham khảo cho từng công nghệ.

| Tên mục | Mục tiêu | Nội dung cần viết | Căn cứ từ system_analysis/evidence_map | Hình, bảng hoặc sơ đồ cần có | File Markdown dự kiến | File LaTeX tương ứng | Độ dài dự kiến | Thông tin cần xác nhận |
|---|---|---|---|---|---|---|---|---|
| Chương 3 - NỀN TẢNG LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG | Giải thích nền tảng kỹ thuật được chọn và lý do lựa chọn. | Công nghệ frontend, backend, database/cache, realtime, tích hợp ngoài, hạ tầng và kiểm thử. Mỗi nhóm có bảng so sánh thay thế. | `system_analysis.md` mục 3, 10, 11; `evidence_map.md` nhóm kiến trúc và CI/CD. | Bảng công nghệ → vai trò → yêu cầu đáp ứng; bảng so sánh thay thế cho mỗi nhóm chính. | `thesis/markdown/chapter-3/00-cong-nghe-su-dung.md` | `thesis/Chuong/3_Cong_nghe.tex` | Tối đa 10 trang theo hướng dẫn template. | Đã chốt — tự lập BibTeX từ documentation chính thức, không có nguồn riêng. |
| Section - Tổng quan lựa chọn công nghệ | Giải thích tiêu chí chọn stack. | Tính phù hợp với realtime auction, transaction, security, phát triển SPA và triển khai container. Nêu tiêu chí lựa chọn chung. | `system_analysis.md` mục 3.1-3.3; `evidence_map.md` nhóm kiến trúc. | Bảng tiêu chí lựa chọn. | `thesis/markdown/chapter-3/01-tong-quan-lua-chon-cong-nghe.md` | `thesis/Chuong/3_Cong_nghe.tex` | 0.6-0.8 trang. | Không có. |
| Section - Công nghệ frontend | Trình bày stack giao diện và lý do chọn. | React, TypeScript, Vite, Router, TanStack Query, Zustand, Axios, Tailwind/Radix, SockJS/STOMP client. So sánh ngắn: React vs Vue vs Angular. | `system_analysis.md` mục 3.2, 10; `evidence_map.md` nhóm frontend. | Bảng công nghệ frontend; bảng so sánh frontend framework. | `thesis/markdown/chapter-3/02-cong-nghe-frontend.md` | `thesis/Chuong/3_Cong_nghe.tex` | 1.2-1.6 trang. | Không có. |
| Subsection - SPA và quản lý trạng thái | Liên kết React stack với yêu cầu nhiều actor. | Route guard, feature-first, query cache, client state và form validation. | `system_analysis.md` mục 10; `evidence_map.md` nhóm frontend. | Không bắt buộc. | `thesis/markdown/chapter-3/02-cong-nghe-frontend.md` | `thesis/Chuong/3_Cong_nghe.tex` | 0.4-0.6 trang. | Không có. |
| Subsection - Kết nối REST và realtime | Giải thích cách FE nhận dữ liệu và giá đấu realtime. | Axios client, TanStack Query, SockJS/STOMP và reconnect/refetch. So sánh: WebSocket vs SSE vs polling. | `system_analysis.md` mục 3.3, 7.7, 10; `evidence_map.md` nhóm notification/realtime. | Không bắt buộc. | `thesis/markdown/chapter-3/02-cong-nghe-frontend.md` | `thesis/Chuong/3_Cong_nghe.tex` | 0.4-0.6 trang. | Không có. |
| Section - Công nghệ backend | Trình bày nền tảng server và lý do chọn. | Spring Boot, Java 17, Spring Web, Validation, Security/OAuth2 Resource Server, method security. So sánh ngắn: Spring Boot vs NestJS vs Django. | `system_analysis.md` mục 3.2, 6.1; `evidence_map.md` nhóm backend/security. | Bảng công nghệ backend; bảng so sánh backend framework. | `thesis/markdown/chapter-3/03-cong-nghe-backend.md` | `thesis/Chuong/3_Cong_nghe.tex` | 1.2-1.6 trang. | Không có. |
| Subsection - Bảo mật và phân quyền | Giải thích JWT, RBAC và effective permission. | JWT HS512, DB-aware authorities, capability ban, route guard frontend. Login attempt protection/brute-force. | `system_analysis.md` mục 4.2, 6.1; `evidence_map.md` nhóm actor/quyền hạn. | Không bắt buộc. | `thesis/markdown/chapter-3/03-cong-nghe-backend.md` | `thesis/Chuong/3_Cong_nghe.tex` | 0.4-0.6 trang. | Không có. |
| Section - Dữ liệu, cache và realtime backend | Giải thích MySQL/Redis/WebSocket và lý do chọn. | MySQL/Flyway/JPA, Redis runtime auction, Lua atomic update, WebSocket/STOMP. So sánh: MySQL vs PostgreSQL; Redis vs Memcached. | `system_analysis.md` mục 8, 9; `evidence_map.md` nhóm schema, Redis/MySQL, realtime. | Bảng trách nhiệm MySQL → Redis; bảng so sánh RDBMS/cache. | `thesis/markdown/chapter-3/04-du-lieu-cache-realtime.md` | `thesis/Chuong/3_Cong_nghe.tex` | 1.5-2 trang. | Không có. |
| Section - Tích hợp ngoài | Trình bày Cloudinary, VNPay Sandbox và SMTP đúng mức xác nhận. | Media upload intent/confirm, VNPay Sandbox, SMTP identity email; không suy đoán production SMTP/VNPay. | `system_analysis.md` mục 3.2, 6.2-6.5, 15; `evidence_map.md` dòng Cloudinary/VNPay/SMTP. | Bảng tích hợp ngoài → phạm vi → mức xác nhận. | `thesis/markdown/chapter-3/05-tich-hop-ngoai.md` | `thesis/Chuong/3_Cong_nghe.tex` | 0.8-1.2 trang. | Không có. |
| Section - Hạ tầng, kiểm thử và công cụ phát triển | Tóm tắt công cụ vận hành. | Docker, Nginx, GitHub Actions, deploy script, Testcontainers, Playwright, Vitest. | `system_analysis.md` mục 11, 14; `evidence_map.md` nhóm CI/CD và kiểm thử. | Bảng công cụ → mục đích. | `thesis/markdown/chapter-3/06-ha-tang-kiem-thu.md` | `thesis/Chuong/3_Cong_nghe.tex` | 1-1.4 trang. | Không có. |

## Chương 4 - PHÂN TÍCH THIẾT KẾ, TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG

Đây là chương trọng tâm. Nội dung cần phản ánh hệ thống thực tế, tránh gọi modular monolith là
microservices và tránh mô tả Redis như database duy nhất.

Khi gặp nội dung thuộc đóng góp nổi bật (Redis/Lua auction, wallet/settlement, appraisal/certificate,
modular monolith, CI/CD guard), chương 4 chỉ mô tả sơ bộ và tạo tham chiếu chéo `\ref{}` tới
chương 5 theo chiến lược đã nêu ở đầu plan.

| Tên mục | Mục tiêu | Nội dung cần viết | Căn cứ từ system_analysis/evidence_map | Hình, bảng hoặc sơ đồ cần có | File Markdown dự kiến | File LaTeX tương ứng | Độ dài dự kiến | Thông tin cần xác nhận |
|---|---|---|---|---|---|---|---|---|
| Chương 4 - PHÂN TÍCH THIẾT KẾ, TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG | Trình bày thiết kế và kết quả triển khai. | Kiến trúc, module, database, API, luồng runtime đấu giá, kiểm thử và triển khai. Mô tả sơ bộ các đóng góp, tham chiếu chương 5. | `system_analysis.md` mục 3, 6, 8, 9, 10, 11, 14; `evidence_map.md` toàn bộ nhóm kỹ thuật. | Component, ERD, sequence/activity, deployment, bảng test. | `thesis/markdown/chapter-4/00-thiet-ke-trien-khai-danh-gia.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 18-25 trang dự kiến. | Đã chốt — xem mục ảnh giao diện bên dưới. |
| Section - Thiết kế kiến trúc | Mô tả kiến trúc tổng thể. | Modular monolith backend, SPA frontend, MySQL/Redis, external services, Nginx/Docker. Mô tả sơ bộ lý do chọn kiến trúc, chi tiết đóng góp tham chiếu chương 5. | `system_analysis.md` mục 3, 11; `evidence_map.md` nhóm kiến trúc và CI/CD. | Component diagram tổng thể. | `thesis/markdown/chapter-4/01-thiet-ke-kien-truc.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 3-4 trang. | Không có. |
| Subsection - Lựa chọn kiến trúc phần mềm | Giải thích vì sao chọn modular monolith. | Lý do phù hợp với phạm vi đồ án, transaction liên module, triển khai đơn giản, không gọi microservices. Sơ bộ + ref chương 5 đóng góp 1. | `system_analysis.md` mục 3.1; `evidence_map.md` dòng backend modular monolith. | Bảng so sánh ngắn modular monolith với lựa chọn khác. | `thesis/markdown/chapter-4/01-thiet-ke-kien-truc.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 0.8-1 trang. | Không có. |
| Subsection - Thiết kế tổng quan | Cho thấy các thành phần và giao tiếp. | Browser, frontend SPA, backend API, WebSocket, MySQL, Redis, Cloudinary, VNPay Sandbox, SMTP, Nginx. | `system_analysis.md` mục 3.2-3.3; `evidence_map.md` nhóm kiến trúc, VNPay, notification/realtime. | Component diagram hoặc deployment logical. | `thesis/markdown/chapter-4/01-thiet-ke-kien-truc.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 0.8-1.2 trang. | Không có. |
| Subsection - Thiết kế chi tiết gói | Trình bày module backend/frontend. | Core, identity, media, catalog, finance, auction, order, fulfillment, dispute và feature frontend tương ứng. | `system_analysis.md` mục 5, 6, 10; `evidence_map.md` nhóm module. | Package/component diagram module. | `thesis/markdown/chapter-4/01-thiet-ke-kien-truc.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1-1.2 trang. | Không có. |
| Section - Thiết kế chi tiết | Đi vào dữ liệu, API, giao diện và luồng nghiệp vụ chính. | Database, class/API, UI, auction runtime, settlement và các module liên quan. | `system_analysis.md` mục 6, 7, 8, 9, 10; `evidence_map.md` nhóm schema và luồng nghiệp vụ. | ERD, sequence/activity, ảnh giao diện, bảng API. | `thesis/markdown/chapter-4/02-thiet-ke-chi-tiet.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 8-11 trang. | Không có. |
| Subsection - Thiết kế giao diện | Trình bày quy tắc thiết kế giao diện (design system). | Đặc tả phương pháp thiết kế: bảng màu, layout system, component UI, quy tắc thông điệp phản hồi, responsive. Lưu ý phân biệt thiết kế giao diện với ảnh sản phẩm cuối (theo template yêu cầu). | `system_analysis.md` mục 10; `evidence_map.md` nhóm frontend. | 2-3 hình minh họa thiết kế giao diện (ảnh giao diện thật hoặc bảng design token trích từ code/CSS). | `thesis/markdown/chapter-4/02-thiet-ke-chi-tiet.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1-1.5 trang. | Không có. |
| Subsection - Thiết kế lớp và module nghiệp vụ | Mô tả lớp/service/entity tiêu biểu với thuộc tính và phương thức theo yêu cầu template. | Chọn 3-4 class/service chủ đạo: `BidServiceImpl`, `WalletServiceImpl`, `AuctionSessionLifecycleWorker`, `DisputeServiceImpl`. Trình bày class diagram chi tiết (thuộc tính, phương thức) cho các class này. Vẽ sequence diagram cho 2-3 use case quan trọng (đặt giá realtime, settlement, thanh toán đơn). | `system_analysis.md` mục 6; `evidence_map.md` nhóm module. | Class diagram chi tiết cho 3-4 class; 2-3 sequence diagram cho UC chính. | `thesis/markdown/chapter-4/02-thiet-ke-chi-tiet.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 2-2.5 trang. | Không có. |
| Subsection - Thiết kế cơ sở dữ liệu | Trình bày schema theo module. | 34 bảng, nhóm bảng theo module, quan hệ chính, Flyway là nguồn thật, đối chiếu entity. ERD rút gọn trong chương chính, ERD đầy đủ chuyển phụ lục nếu quá lớn. | `system_analysis.md` mục 8; `evidence_map.md` nhóm schema database. | ERD rút gọn theo nhóm module (trong chương); ERD đầy đủ (phụ lục nếu cần). | `thesis/markdown/chapter-4/02-thiet-ke-chi-tiet.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1.5-2.2 trang. | Không có. |
| Subsection - Thiết kế API và phân quyền | Làm rõ REST API và bảo mật theo actor. | Public/internal/admin API, JWT, effective permission, capability ban, route guard. Bảng nhóm API tóm tắt trong chương, bảng đầy đủ có thể vào phụ lục. | `system_analysis.md` mục 4.2, 6.1, 7.2; `evidence_map.md` nhóm actor/quyền hạn. | Bảng nhóm API → actor → quyền. | `thesis/markdown/chapter-4/02-thiet-ke-chi-tiet.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 0.8-1.2 trang. | Không có. |
| Subsection - Thiết kế phối hợp Redis và MySQL trong đấu giá | Trình bày sơ bộ phần kỹ thuật cốt lõi, chi tiết ở chương 5. | Ranh giới Redis/MySQL, active session state, Lua bid, snapshot, close fallback, settlement repair. Mô tả sơ bộ cơ chế + ref đóng góp 2 chương 5. | `system_analysis.md` mục 9; `evidence_map.md` nhóm Redis/MySQL và auction. | Sequence diagram tóm tắt bid (chi tiết ở chương 5). | `thesis/markdown/chapter-4/02-thiet-ke-chi-tiet.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1-1.5 trang. | Không có. |
| Subsection - Thiết kế luồng tài chính và hậu đấu giá | Mô tả sơ bộ tiền cọc, ví, order và payout, chi tiết ở chương 5. | Wallet balance/frozen, VNPay Sandbox deposit, capture/refund, order payment, commission, payout, fulfillment, dispute. Sơ bộ + ref đóng góp 3 chương 5. | `system_analysis.md` mục 6.5-6.9, 7.8-7.11; `evidence_map.md` nhóm wallet, VNPay, fulfillment, dispute. | Bảng tóm tắt trạng thái dòng tiền (chi tiết ở chương 5). | `thesis/markdown/chapter-4/02-thiet-ke-chi-tiet.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1-1.5 trang. | Không có. |
| Section - Xây dựng ứng dụng | Trình bày kết quả triển khai theo module. | Cấu trúc mã nguồn, module đã hoàn thành, frontend kết nối API, chức năng deferred. | `system_analysis.md` mục 5, 10, 12; `evidence_map.md` nhóm chức năng đã triển khai/deferred. | Bảng module → trạng thái → bằng chứng. | `thesis/markdown/chapter-4/03-xay-dung-ung-dung.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 3-4 trang. | Không có. |
| Subsection - Thư viện và công cụ sử dụng | Tránh lặp chương 3, chỉ nêu công cụ trong quá trình build kèm phiên bản cụ thể. | Maven, pnpm, Docker, Testcontainers, Playwright, PlantUML/draw.io dự kiến. Kẻ bảng mô tả theo format template. | `system_analysis.md` mục 11, 14; `evidence_map.md` nhóm CI/CD/kiểm thử. | Bảng công cụ triển khai (mục đích, phiên bản, URL). | `thesis/markdown/chapter-4/03-xay-dung-ung-dung.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 0.5-0.8 trang. | Không có. |
| Subsection - Kết quả đạt được | Tổng hợp chức năng đã triển khai và kết nối. | Các module chính, frontend routes, API, test, deploy mechanism và xác nhận production. Thống kê: số dòng code, số lớp, số module, dung lượng nếu cần. | `system_analysis.md` mục 12, 14, 15; `evidence_map.md` nhóm trạng thái chức năng. | Bảng kết quả đạt được; bảng thống kê ứng dụng. | `thesis/markdown/chapter-4/03-xay-dung-ung-dung.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1-1.2 trang. | Không có. |
| Subsection - Minh họa các chức năng chính | Dẫn chứng bằng ảnh giao diện thật. | Luồng seller tạo sản phẩm, appraiser kiểm định, auction/bid, wallet/order, fulfillment, dispute/admin. Mỗi ảnh kèm lời giải thích ngắn gọn. Chụp ảnh màn hình trực tiếp từ ứng dụng, đủ số lượng cần thiết theo luồng nghiệp vụ. Kích thước ảnh nên thống nhất khi đưa vào LaTeX bằng `\includegraphics[width=...]`, không yêu cầu pixel giống nhau nhưng tỷ lệ hiển thị trong báo cáo cần đồng nhất. Che email, SĐT, mã giao dịch thật. | `system_analysis.md` mục 10, 12; `evidence_map.md` nhóm frontend và nghiệp vụ. | 8-10 ảnh giao diện chụp từ ứng dụng thật. | `thesis/markdown/chapter-4/03-xay-dung-ung-dung.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1.5-2 trang. | Đã chốt — chụp màn hình, che thông tin nhạy cảm, thống nhất kích thước hiển thị. |
| Section - Kiểm thử | Chứng minh mức kiểm thử đã chạy. | Backend Surefire, frontend Vitest, Playwright, typecheck/lint/build theo report hoặc log kiểm thử cuối cùng; giới hạn acceptance. Thiết kế trường hợp kiểm thử cho 2-3 chức năng quan trọng, chỉ rõ kỹ thuật kiểm thử sử dụng. Không chốt số lượng test trong kế hoạch; khi viết section chỉ ghi số lượng nếu có report/log cuối cùng làm căn cứ trực tiếp. | `system_analysis.md` mục 14; `evidence_map.md` nhóm kiểm thử. | Bảng test suite → trạng thái đã chạy → kết quả → căn cứ; bảng test case mẫu. | `thesis/markdown/chapter-4/04-kiem-thu.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 2-3 trang. | Nếu cần nêu số lượng test, phải rerun và lưu report cuối cùng trước khi viết section này. |
| Section - Triển khai | Trình bày cơ chế triển khai, không phóng đại vận hành. | Docker Compose, Nginx, GitHub Actions, release workflow, deploy script guard; production đã deploy theo xác nhận người dùng, chưa kết luận ổn định nếu thiếu log. Sơ bộ + ref đóng góp 5 chương 5 cho phần CI/CD guard. | `system_analysis.md` mục 11, 15; `evidence_map.md` nhóm CI/CD và production. | Deployment diagram; bảng deploy guard. | `thesis/markdown/chapter-4/05-trien-khai.md` | `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex` | 1.5-2 trang. | Không có. |

## Chương 5 - CÁC GIẢI PHÁP VÀ ĐÓNG GÓP NỔI BẬT

Chương này không lặp lại toàn bộ chương 4. Theo template (`Chuong/5_Giai_phap_dong_gop.tex:4-7`),
chương cần tối thiểu 5 trang và mỗi đóng góp phải được trình bày trong một mục độc lập theo cấu
trúc ba phần:

1. **(i) Dẫn dắt/giới thiệu về bài toán/vấn đề**: Vấn đề gì cần giải quyết, tại sao khó/quan trọng.
2. **(ii) Giải pháp**: Cách tiếp cận, thiết kế, cơ chế kỹ thuật cụ thể.
3. **(iii) Kết quả đạt được**: Bằng chứng giải pháp hoạt động (test, demo, số liệu nếu có).

Template nhấn mạnh đây là **cơ sở quan trọng để đánh giá sinh viên**, cần phát huy tính sáng tạo,
khả năng phân tích, phản biện và lập luận.

| Tên mục | Mục tiêu | Nội dung cần viết | Căn cứ từ system_analysis/evidence_map | Hình, bảng hoặc sơ đồ cần có | File Markdown dự kiến | File LaTeX tương ứng | Độ dài dự kiến | Thông tin cần xác nhận |
|---|---|---|---|---|---|---|---|---|
| Chương 5 - CÁC GIẢI PHÁP VÀ ĐÓNG GÓP NỔI BẬT | Làm nổi bật phần đáng giá nhất của đồ án. | 5 đóng góp kỹ thuật/nghiệp vụ có căn cứ trong code và test, theo cấu trúc 3 phần. | `system_analysis.md` mục 6, 9, 12, 14; `evidence_map.md` nhóm Redis/MySQL, wallet, security, CI/CD. | Sơ đồ/tables chọn lọc, không quá nhiều ảnh. | `thesis/markdown/chapter-5/00-giai-phap-dong-gop.md` | `thesis/Chuong/5_Giai_phap_dong_gop.tex` | 6-9 trang. | Không có. |
| Section - Đóng góp 1: Kiến trúc modular monolith theo nghiệp vụ | (i) Vấn đề tổ chức hệ thống phức tạp. (ii) Giải pháp chia module theo domain. (iii) Kết quả: tính module hóa, transaction nội bộ. | Bài toán: hệ thống đa module cần giao tiếp và transaction liên chức năng → Giải pháp: chia module theo domain, port/adapter giữa auction/order/fulfillment/dispute, giữ transaction nội bộ → Kết quả: dễ bảo trì, test độc lập, triển khai đơn giản. | `system_analysis.md` mục 3.1, 5, 6; `evidence_map.md` nhóm backend architecture. | Component/package diagram rút gọn. | `thesis/markdown/chapter-5/01-modular-monolith.md` | `thesis/Chuong/5_Giai_phap_dong_gop.tex` | 1-1.3 trang. | Không có. |
| Section - Đóng góp 2: Runtime đấu giá realtime bằng Redis/Lua kết hợp MySQL | (i) Vấn đề đấu giá realtime cần atomic và tốc độ. (ii) Giải pháp Redis+Lua. (iii) Kết quả: atomic bid, fallback, test. | Bài toán: đấu giá realtime đòi hỏi tính nguyên tử, tốc độ và dữ liệu bền vững → Giải pháp: Redis cho ACTIVE state, Lua atomic bid, MySQL persistence, close fallback, settlement repair → Kết quả: bid nguyên tử, có cơ chế phục hồi, test integration đã chạy. | `system_analysis.md` mục 9; `evidence_map.md` nhóm Redis/MySQL, bid, lifecycle. | Sequence diagram đặt giá chi tiết; bảng Redis/MySQL responsibility. | `thesis/markdown/chapter-5/02-redis-lua-auction-runtime.md` | `thesis/Chuong/5_Giai_phap_dong_gop.tex` | 1.3-1.8 trang. | Không có. |
| Section - Đóng góp 3: Mô hình tài chính ví, cọc và settlement idempotent | (i) Vấn đề an toàn dòng tiền. (ii) Giải pháp wallet+operation. (iii) Kết quả: idempotency, test. | Bài toán: quản lý cọc, thanh toán và payout cần tránh trùng lặp và mất tiền → Giải pháp: available/frozen balance, operation key, deposit refund/capture, order payment, payout, commission; không gọi escrow ledger → Kết quả: idempotent, test unit/integration đã chạy. | `system_analysis.md` mục 6.5, 7.8-7.9; `evidence_map.md` nhóm wallet/finance. | Sequence settlement hoặc bảng trạng thái tiền. | `thesis/markdown/chapter-5/03-wallet-settlement.md` | `thesis/Chuong/5_Giai_phap_dong_gop.tex` | 1.2-1.6 trang. | Không có. |
| Section - Đóng góp 4: Quy trình kiểm định, chứng thư và media evidence | (i) Vấn đề tin cậy sản phẩm. (ii) Giải pháp appraisal+certificate. (iii) Kết quả: xác minh chứng thư, Cloudinary. | Bài toán: người mua cần tin cậy chất lượng sản phẩm gỗ → Giải pháp: appraisal claim/submit, certificate code/hash, media upload intent, evidence cho dispute → Kết quả: tra cứu/xác minh chứng thư public, Cloudinary đã nghiệm thu trên production. | `system_analysis.md` mục 6.3-6.4, 6.9; `evidence_map.md` nhóm media, appraisal, certificate, dispute. | Activity diagram kiểm định; bảng trạng thái sản phẩm. | `thesis/markdown/chapter-5/04-appraisal-certificate-media.md` | `thesis/Chuong/5_Giai_phap_dong_gop.tex` | 1-1.4 trang. | Không có. |
| Section - Đóng góp 5: Quy trình kiểm thử và triển khai có guard | (i) Vấn đề chất lượng và an toàn deploy. (ii) Giải pháp CI/CD+guard. (iii) Kết quả: test đã chạy, deploy guard. | Bài toán: triển khai production cần đảm bảo an toàn, không deploy khi có phiên đấu giá → Giải pháp: test backend/frontend/e2e, Testcontainers, CI gate, deploy guard (env/worktree/auction check, backup, rollback) → Kết quả: các nhóm kiểm thử backend/frontend/e2e đã có report hoặc log chạy, production đã deploy theo xác nhận người dùng. | `system_analysis.md` mục 11, 14, 15; `evidence_map.md` nhóm testing và CI/CD. | Bảng pipeline; deployment guard table. | `thesis/markdown/chapter-5/05-testing-deployment-guard.md` | `thesis/Chuong/5_Giai_phap_dong_gop.tex` | 1-1.4 trang. | Không có. |

## Chương 6 - KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

Chương này viết cuối cùng để phản ánh đúng những gì đã trình bày và được duyệt trong các chương
trước.

| Tên mục | Mục tiêu | Nội dung cần viết | Căn cứ từ system_analysis/evidence_map | Hình, bảng hoặc sơ đồ cần có | File Markdown dự kiến | File LaTeX tương ứng | Độ dài dự kiến | Thông tin cần xác nhận |
|---|---|---|---|---|---|---|---|---|
| Chương 6 - KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN | Tổng kết báo cáo và nêu hướng phát triển. | Kết quả đạt được, hạn chế và hướng phát triển dựa trên deferred/acceptance còn thiếu. So sánh kết quả với mục tiêu ban đầu và với hệ thống tương tự đã khảo sát ở chương 2. Xưng hô dùng "em" nhất quán. | `system_analysis.md` mục 12, 14, 15; `evidence_map.md` nhóm deferred và quyết định đã thống nhất. | Không bắt buộc. | `thesis/markdown/chapter-6/00-ket-luan-huong-phat-trien.md` | `thesis/Chuong/6_Ket_luan.tex` | 2-3 trang. | Đã chốt — xưng "em". |
| Section - Kết luận | Tóm tắt kết quả của đồ án. | Hệ thống đã triển khai các module chính, kiểm thử đã chạy, production deploy theo xác nhận người dùng, phạm vi không phóng đại. So sánh với hệ thống tương tự. | `system_analysis.md` mục 12, 14, 15; `evidence_map.md` nhóm testing, CI/CD, chức năng đã triển khai. | Bảng đối chiếu mục tiêu → kết quả (nếu cần). | `thesis/markdown/chapter-6/01-ket-luan.md` | `thesis/Chuong/6_Ket_luan.tex` | 1-1.5 trang. | Không có. |
| Subsection - Kết quả đạt được | Cô đọng kết quả theo mục tiêu ban đầu. | Actor, luồng chính, module, test, deploy mechanism, Cloudinary/VNPay/SMTP đúng mức xác nhận. | `system_analysis.md` mục 12, 15; `evidence_map.md` nhóm quyết định đã thống nhất. | Bảng đối chiếu mục tiêu → kết quả. | `thesis/markdown/chapter-6/01-ket-luan.md` | `thesis/Chuong/6_Ket_luan.tex` | 0.6-0.8 trang. | Không có. |
| Subsection - Hạn chế hiện tại | Trình bày trung thực phần chưa hoàn thiện. | Stored notification, packing video evidence, partial refund, acceptance thực tế, responsive polish, log/health production nếu thiếu. | `system_analysis.md` mục 12.2-12.3; `evidence_map.md` nhóm deferred/acceptance. | Không bắt buộc. | `thesis/markdown/chapter-6/01-ket-luan.md` | `thesis/Chuong/6_Ket_luan.tex` | 0.5-0.7 trang. | Không có. |
| Section - Hướng phát triển | Đề xuất tiếp theo dựa trên hạn chế thật. | Notification center, video evidence, partial refund, observability/health check, mở rộng acceptance, tối ưu UI/responsive. | `system_analysis.md` mục 12.3, 16; `evidence_map.md` nhóm deferred. | Bảng hướng phát triển → lợi ích → căn cứ. | `thesis/markdown/chapter-6/02-huong-phat-trien.md` | `thesis/Chuong/6_Ket_luan.tex` | 0.8-1.2 trang. | Đã chốt — nhấn mạnh notification center và observability. |

## Phụ lục

| Phụ lục | Nội dung | Xử lý |
|---|---|---|
| Phụ lục A | Hiện chứa hướng dẫn sử dụng template → **thay bằng Hướng dẫn cài đặt và chạy hệ thống** (cách clone, cài dependencies, cấu hình env, chạy Docker, truy cập ứng dụng). Vì đây là thay đổi nội dung file LaTeX template, sẽ thực hiện khi bước sang giai đoạn xử lý phụ lục và cần duyệt lại trước khi sửa. | Hướng đi đã chốt — cần duyệt khi bước sang xử lý phụ lục. |
| Phụ lục B | Đặc tả use case chi tiết cho các UC không đưa vào chương 2. | Giữ nguyên mục đích; thay nội dung mẫu thư viện bằng UC thật. |

## Kế hoạch hình, bảng và sơ đồ tổng hợp

Kế hoạch chi tiết đã được tách sang `thesis/docs/figure_table_plan.md`. File này chỉ giữ vai trò
đề cương viết chương; khi cần tạo hoặc render hình/bảng/sơ đồ, dùng kế hoạch riêng đó làm căn cứ.

## Chuẩn bị tài liệu tham khảo (BibTeX)

Trước khi viết chương 3, cần chuẩn bị file `Danh_sach_tai_lieu_tham_khao.bib` với các nguồn chính
thức. Danh sách dự kiến (không có nguồn riêng từ người dùng, tự lập từ documentation chính thức):

- Spring Boot / Spring Framework documentation
- React documentation
- Redis documentation
- MySQL documentation
- RFC liên quan (JWT — RFC 7519, WebSocket — RFC 6455)
- VNPay developer documentation (Sandbox)
- Cloudinary documentation
- Docker documentation
- Testcontainers documentation
- Sách/bài báo về kiến trúc phần mềm (modular monolith, domain-driven design)
- Website eBay, Catawiki, Lạc Việt Auction — trang chính thức, help center, điều khoản sử dụng (cho phần khảo sát hệ thống tương tự; mọi nhận định phải trích nguồn cụ thể, không dùng nhận xét chưa xác minh)

Tất cả tài liệu phải có thật, kiểm tra được URL/metadata và trích dẫn bằng `\cite{}` theo style
IEEE.

## Trạng thái blocker compile template

Cập nhật theo trạng thái hiện tại của `DoAn.tex`:

1. ~~**Thiếu `lstlisting.tex`**~~: **Đã xử lý** — dòng `\include{lstlisting}` đã được comment
   trong `DoAn.tex`, không bị xóa khỏi template. File `lstlisting.tex` vốn dùng để cấu hình formatting code (C, C++, Python).
   Nếu báo cáo cần chèn đoạn mã nguồn, sẽ tạo file cấu hình `listings` riêng khi bước sang
   giai đoạn LaTeX — cần duyệt trước khi thêm vào `DoAn.tex`.
2. ~~**Thiếu package `outlines`**~~: **Đã xử lý** — `DoAn.tex` hiện đã nạp package `outlines`
   trong preamble để môi trường `outline` của phụ lục mẫu compile được. Nếu sau này thay nội dung
   phụ lục A và không còn dùng môi trường `outline`, có thể cân nhắc bỏ package này ở bước tinh gọn
   template riêng.
3. **Sai hoa/thường `GayBia.PNG`**: `Phu_luc_A.tex:123` gọi `.PNG` nhưng file thực tế là `.png`.
   **Sẽ được xử lý** khi thay nội dung phụ lục A bằng hướng dẫn cài đặt. Không ảnh hưởng trên
   Windows (case-insensitive) nhưng là rủi ro khi compile trên Linux/CI.

Không còn blocker chặn compile trên Windows. Khi bước sang giai đoạn LaTeX, chỉ cần lưu ý tạo
`lstlisting.tex` nếu muốn chèn code và xử lý phụ lục A (cả hai đều cần duyệt).

## Thứ tự viết đề xuất

1. **Chuẩn bị**: chốt các `[CẦN XÁC NHẬN]`, chuẩn bị BibTeX, xử lý blocker compile.
2. **Chương 2**: chốt nghiệp vụ, actor, use case, hệ thống tương tự và yêu cầu.
3. **Chương 3**: viết công nghệ và lựa chọn thay thế dựa trên yêu cầu đã chốt.
4. **Chương 4**: viết thiết kế, triển khai, kiểm thử và deploy (mô tả sơ bộ đóng góp).
5. **Chương 5**: trình bày chi tiết đóng góp nổi bật theo cấu trúc 3 phần.
6. **Chương 1**: viết phần giới thiệu và bố cục sau khi biết chính xác nội dung các chương.
7. **Chương 6**: viết kết luận và hướng phát triển cuối cùng.
8. **Phụ lục**: hoàn thiện phụ lục B (UC chi tiết), xử lý phụ lục A.
9. **Phần đầu**: cập nhật bìa, lời cảm ơn, tóm tắt, glossary.

## Thông tin bìa đã chốt

| Mục | Giá trị |
|---|---|
| Tên đề tài | Phân tích, thiết kế và xây dựng hệ thống web hỗ trợ quản lý thẩm định và đấu giá sản phẩm gỗ trực tuyến Woodcert Auction |
| Sinh viên | Nguyễn Khánh Duy |
| MSSV | 20225830 |
| Email | duy.nk225830@sis.hust.edu.vn |
| Giảng viên hướng dẫn | ThS. Lê Tấn Hùng |
| Chương trình đào tạo | Công nghệ thông tin Việt-Nhật 2022 |
| Khoa | Khoa học Máy tính |
| Trường | Công nghệ thông tin và Truyền thông |
| Kỳ bảo vệ | 2025.2 |

## Tổng hợp các quyết định đã chốt

| Mã | Nội dung | Quyết định |
|---|---|---|
| #1 | Thông tin bìa | Đã chốt đầy đủ — xem bảng trên. |
| #2 | Bối cảnh thị trường gỗ mỹ nghệ | Bám phạm vi hệ thống, không nhấn mạnh thị trường Việt Nam (không có nguồn uy tín). |
| #3 | Hệ thống tương tự | So sánh 3 nền tảng: **eBay Auction**, **Catawiki**, **Lạc Việt Auction**. Nhận định cụ thể về từng nền tảng cần kiểm chứng/trích nguồn chính thức trước khi viết. |
| #4 | Đặc tả use case | 6 UC chi tiết: Đặt giá realtime, Tạo phiên đấu giá, Đăng ký tham gia, Thanh toán đơn hàng, Gửi kiểm định, Mở tranh chấp. UC tổng quát và phân rã vẫn có ở section riêng. |
| #5 | Tài liệu tham khảo | Tự lập BibTeX từ documentation chính thức, không có nguồn riêng. |
| #6 | Ảnh giao diện | Chụp ảnh màn hình trực tiếp, đủ số lượng theo luồng nghiệp vụ. Thống nhất kích thước hiển thị bằng `\includegraphics[width=...]`. Che email, SĐT, mã giao dịch thật. |
| #7 | Văn phong kết luận | Xưng "em" nhất quán toàn bộ báo cáo. Nhấn mạnh notification center và observability trong hướng phát triển. |
| #8 | Phụ lục A | Hướng đi: thay bằng **Hướng dẫn cài đặt và chạy hệ thống**. Vì sửa file LaTeX template nên cần duyệt lại khi bước sang giai đoạn xử lý phụ lục. |
