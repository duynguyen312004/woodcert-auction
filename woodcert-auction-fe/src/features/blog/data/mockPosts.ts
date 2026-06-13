import type { BlogPost } from "../types";

import fscForestryThumbnail from "@/assets/images/mock/blog-fsc-forestry.webp";
import maitreyaFengShuiThumbnail from "@/assets/images/mock/blog-maitreya-feng-shui.webp";
import redwoodMarketThumbnail from "@/assets/images/mock/blog-redwood-market.webp";
import suaComparisonThumbnail from "@/assets/images/mock/blog-sua-comparison.webp";

export const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "Tiêu chuẩn FSC là gì? Tầm quan trọng trong xuất khẩu gỗ mỹ nghệ",
    summary:
      "Chứng chỉ FSC đóng vai trò như 'hộ chiếu xanh' cho các sản phẩm gỗ Việt Nam bước vào thị trường quốc tế như EU, Mỹ, Nhật Bản.",
    category: "Tiêu chuẩn kiểm định",
    thumbnail: fscForestryThumbnail,
    source: "Tạp chí Gỗ Việt",
    publishedAt: "2026-05-28T09:30:00Z",
    readTime: "5 phút đọc",
    content: `
      <p>Chứng chỉ FSC (Forest Stewardship Council - Hội đồng Quản lý Rừng) là chứng nhận quốc tế chứng minh rằng gỗ được khai thác từ nguồn rừng được quản lý bền vững, có trách nhiệm với môi trường và cộng đồng xã hội.</p>
      
      <h3>1. Tại sao chứng chỉ FSC lại quan trọng?</h3>
      <p>Trong bối cảnh biến đổi khí hậu toàn cầu và xu hướng tiêu dùng xanh tăng cao, thị trường quốc tế đòi hỏi khắt khe về nguồn gốc gỗ hợp pháp. FSC được coi là bảo chứng cao nhất cho tính minh bạch này. Những sản phẩm có gắn nhãn FSC luôn được người tiêu dùng ưu ái và sẵn sàng trả giá cao hơn 15% - 20% so với gỗ thông thường.</p>
      
      <h3>2. WoodCert hỗ trợ tích hợp FSC như thế nào?</h3>
      <p>Hệ thống WoodCert lưu hồ sơ thẩm định và thông tin nguồn gốc do seller cung cấp để người mua tra cứu trước khi đấu giá. Các chứng nhận bên thứ ba như FSC cần được đối chiếu theo tài liệu chứng minh tương ứng; phiên bản MVP chưa tích hợp blockchain.</p>
      
      <h3>3. Xu hướng phát triển lâm nghiệp bền vững tại Việt Nam</h3>
      <p>Việt Nam đang hướng tới mục tiêu phủ xanh rừng trồng có chứng chỉ FSC đạt hơn 1 triệu hecta vào năm 2030. Điều này mở ra cơ hội lớn cho các làng nghề nghệ thuật gỗ chuyển mình từ khai thác tự do sang mô hình chuỗi cung ứng bền vững, nâng tầm thương hiệu gỗ mỹ nghệ Việt trên bản đồ thế giới.</p>
    `,
  },
  {
    id: "2",
    title: "Cách phân biệt Gỗ Sưa đỏ và Gỗ Sưa trắng chuẩn xác nhất",
    summary:
      "Gỗ Sưa đỏ có giá trị kinh tế gấp hàng chục lần gỗ Sưa trắng. Làm sao để nghệ nhân và người chơi gỗ không bị nhầm lẫn?",
    category: "Kiến thức gỗ",
    thumbnail: suaComparisonThumbnail,
    source: "Hiệp hội Gỗ & Lâm sản",
    publishedAt: "2026-05-25T14:15:00Z",
    readTime: "4 phút đọc",
    content: `
      <p>Gỗ Sưa (còn gọi là Huỳnh Đàn) luôn nằm trong nhóm những loại gỗ quý hiếm và đắt đỏ nhất. Tuy nhiên, sưa đỏ và sưa trắng có mức giá chênh lệch cực kỳ lớn. Dưới đây là 3 phương pháp giám định thực tế từ các chuyên gia WoodCert.</p>
      
      <h3>1. Nhận biết qua vân gỗ và màu sắc</h3>
      <p>Sưa đỏ có màu đỏ bã trầu hoặc đỏ sẫm. Vân gỗ sưa đỏ mọc nổi ở cả bốn mặt, có đường vân lượn sóng không theo quy luật, thớ gỗ mịn. Đặc biệt, vân sưa đỏ có hình thù kỳ lạ giống như mặt người hoặc mặt quỷ (gọi là vân mặt quỷ). Trong khi đó, sưa trằng chỉ có vân hai mặt, vân gỗ không sâu và thớ gỗ thô hơn.</p>
      
      <h3>2. Kiểm tra bằng khứu giác (Mùi hương)</h3>
      <p>Khi cạo nhẹ lớp bề mặt gỗ sưa đỏ, bạn sẽ ngửi thấy mùi thơm thoang thoảng nhẹ nhàng như hương trầm. Khi đốt, khói gỗ sưa đỏ có màu trắng, tàn tro màu trắng đục và có mùi thơm dễ chịu. Sưa trắng khi đốt lên không có mùi thơm đặc trưng, khói đục và tàn tro đen.</p>
      
      <h3>3. Thử nghiệm ngâm nước sôi</h3>
      <p>Cắt một mẩu gỗ nhỏ ngâm vào nước sôi. Gỗ sưa đỏ sẽ làm nước chuyển màu hồng nhạt và có một lớp tinh dầu mỏng lấp lánh như cầu vồng nổi lên mặt nước. Sưa trắng chỉ làm nước đục nhẹ do bụi gỗ mà không giải phóng tinh dầu thơm đặc trưng.</p>
      <p>Hiện nay, việc làm giả gỗ sưa đỏ bằng các kỹ thuật nhuộm màu vô cùng tinh vi. Người mua nên yêu cầu kiểm định và cấp chứng thư WoodCert để được cam kết hoàn tiền 100% nếu phát hiện gỗ không đúng chủng loại.</p>
    `,
  },
  {
    id: "3",
    title: "Ý nghĩa phong thủy của tượng Gỗ Di Lặc trong không gian sống",
    summary:
      "Đặt tượng Phật Di Lặc bằng gỗ gì và ở hướng nào để thu hút tài lộc, mang lại bình an cho gia chủ?",
    category: "Phong thủy",
    thumbnail: maitreyaFengShuiThumbnail,
    source: "Tạp chí Kiến trúc & Đời sống",
    publishedAt: "2026-05-20T08:00:00Z",
    readTime: "6 phút đọc",
    content: `
      <p>Trong phong thủy Đông Á, Phật Di Lặc là biểu tượng tuyệt đối của hạnh phúc, sự an lạc và thịnh vượng. Tượng Di Lặc được chế tác từ gỗ tự nhiên lâu năm mang nguồn năng lượng ấm áp, hóa giải các luồng sát khí trong nhà.</p>
      
      <h3>1. Nên chọn tượng Di Lặc làm bằng gỗ gì?</h3>
      <p>Những loại gỗ có mùi thơm tự nhiên như Gỗ Bách Xanh, Gỗ Ngọc Am, Gỗ Hương hoặc Gỗ Xá Xị là lựa chọn hàng đầu. Mùi hương dịu nhẹ từ các loại gỗ này giúp tinh thần thư thái, thanh lọc không khí và xua đuổi tà khí. Vân gỗ tự nhiên ôm quanh bụng Phật cũng tượng trưng cho sự tụ hội của sinh khí đất trời.</p>
      
      <h3>2. Vị trí đặt tượng Di Lặc chuẩn phong thủy</h3>
      <p>Tượng Phật nên được đặt ở vị trí cao ráo (tối thiểu 1m từ mặt đất), đối diện với cửa chính để đón luồng khí cát lành đi vào nhà. Đặt tượng ở cung Sinh Khí (hướng Tây Bắc) hoặc cung Thiên Y (hướng Đông) sẽ mang lại sức khỏe và tài lộc dồi dào cho các thành viên trong gia đình.</p>
      
      <h3>3. Những điều đại kỵ cần tránh</h3>
      <p>Tuyệt đối không đặt tượng trực tiếp dưới sàn nhà hoặc ở những khu vực ẩm thấp, thiếu ánh sáng như gầm cầu thang, phòng ngủ hay gần nhà vệ sinh. Khi lau chùi tượng, gia chủ nên sử dụng khăn sạch riêng biệt thấm nước ấm pha chút rượu hoặc nước gừng để giữ cho tượng luôn trang nghiêm, thanh sạch.</p>
    `,
  },
  {
    id: "4",
    title: "Giá gỗ hương đỏ Nam Phi biến động mạnh trong quý II/2026",
    summary:
      "Giá nhập khẩu gỗ tròn hương đỏ Nam Phi ghi nhận mức tăng kỷ lục do thắt chặt hạn ngạch khai thác lâm sản quốc tế.",
    category: "Thị trường",
    thumbnail: redwoodMarketThumbnail,
    source: "Thông tin Lâm sản Quốc tế",
    publishedAt: "2026-05-15T16:45:00Z",
    readTime: "3 phút đọc",
    content: `
      <p>Thị trường nguyên liệu gỗ mỹ nghệ Việt Nam đang trải qua đợt biến động giá lớn nhất trong vòng 3 năm qua. Gỗ hương đỏ nhập khẩu từ các quốc gia Nam Phi tăng trung bình 25% - 30% giá trị so với đầu năm.</p>
      
      <h3>Nguyên nhân thúc đẩy đà tăng giá</h3>
      <p>Chính phủ các nước khu vực Nam Phi (như Angola, Mozambique) đã ban hành lệnh cấm xuất khẩu gỗ tròn thô chưa qua chế biến nhằm bảo vệ tài nguyên rừng và phát triển công nghiệp chế biến nội địa. Bên cạnh đó, chi phí vận tải biển quốc tế tăng cao cũng đẩy giá thành gỗ nhập khẩu lên mức đỉnh mới.</p>
      
      <h3>Tác động tới các phiên đấu giá tác phẩm nghệ thuật gỗ</h3>
      <p>Sự khan hiếm nguyên liệu trực tiếp đẩy giá khởi điểm của các sản phẩm đục đẽo từ gỗ hương đỏ nguyên khối lên cao. Tuy nhiên, lực cầu từ các nhà sưu tập không hề giảm. Tại sàn đấu giá WoodCert, doanh số các tác phẩm gỗ hương đỏ cổ thụ có chứng chỉ hợp pháp ghi nhận tỷ lệ chốt thành công lên tới 92% trong tháng vừa qua, phản ánh xu hướng tích trữ tài sản gỗ quý của giới thượng lưu.</p>
    `,
  },
];
