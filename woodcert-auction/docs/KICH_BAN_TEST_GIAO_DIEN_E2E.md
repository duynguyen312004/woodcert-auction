# Kịch bản kiểm thử giao diện E2E

Tài liệu này dùng cho lần kiểm thử cuối từ database rỗng. Chạy Flyway `V1`-`V3`, backend, Redis và frontend trước khi bắt đầu. SMTP, Cloudinary và VNPay Sandbox phải có cấu hình thật; không nạp tiền trực tiếp bằng SQL.

Automated baseline ngày 13/06/2026: backend `305/305`, frontend unit `156/156`, lint, typecheck, production build và Playwright `6/6` đều pass. Build frontend không còn JavaScript chunk vượt 500 KB; main entry còn 410,76 KB. Checklist bên dưới vẫn cần chạy thủ công với các dịch vụ tích hợp thật trước buổi bảo vệ.

## 0. Chuẩn bị môi trường và database sạch

1. Tạo schema `woodcert_auction` hoàn toàn rỗng; không tự import SQL ngoài các migration của Flyway.
2. Chạy MySQL và Redis, sau đó khởi động backend với profile local.
3. Kiểm tra bảng `flyway_schema_history` có đúng ba migration thành công: `V1`, `V2`, `V3`.
4. Kiểm tra có 33 bảng nghiệp vụ, 4 role, 13 permission, 10 category và đúng 2 operator account từ seed.
5. Kiểm tra location seed hoàn tất với 63 tỉnh/thành, 696 quận/huyện và 10.051 xã/phường. Nếu remote API lỗi, backend phải dùng file bundled.
6. Kiểm tra backend không dùng `ddl-auto=create/update`; Hibernate chỉ validate schema.
7. Kiểm tra frontend trỏ tới `http://localhost:8080/api/v1` và WebSocket trỏ tới `http://localhost:8080/ws-auction`.
8. Kiểm tra SMTP gửi được email thật, Cloudinary tạo/confirm upload được và VNPay Sandbox trả về đúng frontend.
9. Mở DevTools Network/Console trong suốt phiên test; ghi lại mọi 4xx bất ngờ, 5xx, lỗi JavaScript và WebSocket disconnect.
10. Dùng ít nhất bốn browser profile độc lập để cookie/refresh token không đè nhau: admin, appraiser, seller, Buyer A; Buyer B nên dùng profile thứ năm.

Trạng thái database mong đợi ngay sau bootstrap:

- Chưa có buyer, seller profile, product, auction, participant, bid, wallet transaction, order, fulfillment hoặc dispute.
- Có `admin@woodcert.local` và `appraiser@woodcert.local`, cùng mật khẩu demo `Demo@123456`.
- Có category và location master data để form sản phẩm/địa chỉ dùng ngay.

## Dữ liệu và tài khoản

Chuẩn bị các trình duyệt/profile độc lập:

- Admin từ seed: chỉ có `ROLE_ADMIN`.
- Appraiser từ seed: chỉ có `ROLE_APPRAISER`.
- Buyer A, Buyer B: đăng ký mới, mặc định chỉ có `ROLE_BIDDER`.
- Seller: đăng ký như bidder rồi tạo seller profile; tài khoản này có `ROLE_BIDDER` + `ROLE_SELLER`.

Ghi lại số dư ví trước và sau từng luồng tiền. Với mỗi giao dịch, kiểm tra số dư khả dụng, số dư đóng băng, loại giao dịch, số tiền, reference và thời gian.

## 0A. Giao diện công khai, empty state và điều hướng

1. Mở trang chủ khi backend đang chạy nhưng chưa có auction: hero, category và trạng thái chưa có phiên phải hiển thị bình thường, không có card dữ liệu giả.
2. Mở `/auctions`: danh sách rỗng, bộ lọc, phân trang và thông báo empty state không được vỡ layout.
3. Thử tìm kiếm, category, material, khoảng giá và trạng thái khi không có dữ liệu; URL/query và nút reset phải hoạt động.
4. Mở `/about`, `/guide`, `/blog`, một bài blog và `/certificates`; header/footer và các link điều hướng phải đúng.
5. Mở mã chứng thư không tồn tại và auction ID không tồn tại; giao diện phải báo không tìm thấy thay vì treo loading.
6. Truy cập `/account`, `/wallet`, `/orders`, `/my-auctions`, `/bidding/1` khi chưa đăng nhập; phải chuyển tới login và quay lại đúng trang sau đăng nhập nếu role phù hợp.
7. Đăng nhập admin/appraiser rồi thử mở trang public: guard phải chuyển họ về portal tương ứng.
8. Đăng nhập bidder chưa có seller profile rồi mở `/seller/dashboard`: phải chuyển tới `/seller/register`.
9. Mở URL không tồn tại ở public, seller, appraiser và admin. Trang 404 tùy biến phải giữ đúng header/footer hoặc sidebar của khu vực, có nút quay lại và CTA lần lượt về `/`, `/seller/dashboard`, `/appraiser/products`, `/admin`.

## 1. Xác thực và phiên đăng nhập

1. Đăng ký Buyer A, mở link xác minh email, đăng nhập thành công.
2. Thử đăng nhập trước khi xác minh: phải bị chặn.
3. Gửi lại email xác minh; thử token cũ, token đã dùng và token hết hạn.
4. Thử đăng nhập sai liên tiếp để kiểm tra khóa tạm thời chống brute-force.
5. Tải lại trang sau khi access token hết hạn: phiên được refresh bằng HttpOnly cookie.
6. Kiểm tra response login/refresh không chứa `refreshToken`; JavaScript không đọc được cookie.
7. Logout rồi tải lại trang: phiên không được khôi phục.
8. Quên mật khẩu, đặt mật khẩu mới, xác nhận các refresh token cũ không còn dùng được.
9. Kiểm tra validation giao diện cho email sai định dạng, mật khẩu yếu, xác nhận mật khẩu không khớp, tên/số điện thoại trống.
10. Đăng ký trùng email, đăng nhập sai mật khẩu và reset token sai phải hiển thị thông báo hiểu được, không lộ stack trace.
11. Mở link verify/reset thiếu token, token đã dùng và token hết hạn; CTA quay lại login/nhập lại email phải hoạt động.
12. Mở hai tab cùng phiên rồi để access token hết hạn; chỉ một chuỗi refresh hợp lệ diễn ra và cả hai tab tiếp tục dùng được.

## 2. Hồ sơ, địa chỉ và bất biến role

1. Buyer A cập nhật hồ sơ, avatar và tạo địa chỉ đầu tiên với `isDefault=false`; địa chỉ vẫn phải tự trở thành mặc định.
2. Tạo địa chỉ thứ hai, sửa người nhận/số điện thoại/địa chỉ và kiểm tra dữ liệu tỉnh/huyện/xã hiển thị đúng.
3. Đặt địa chỉ thứ hai làm mặc định; danh sách chỉ có đúng một địa chỉ mặc định.
4. User khác thử sửa/xóa/đặt mặc định địa chỉ của Buyer A qua API: phải trả 404.
5. Xóa địa chỉ mặc định; địa chỉ còn lại có ID nhỏ nhất tự trở thành mặc định.
6. Sau khi order đã lưu shipping snapshot, sửa/xóa address-book entry và xác nhận snapshot trong order không đổi.
7. Buyer A tạo seller profile, đăng nhập lại và thấy khu vực seller.
8. Appraiser thử tạo seller profile qua UI/API: phải bị từ chối.
9. Admin tạo appraiser bằng email mới: tài khoản chỉ có `ROLE_APPRAISER`.
10. Admin thử tạo appraiser bằng email Buyer A hoặc Seller: phải báo trùng email, không nâng role.
11. Kiểm tra dropdown tỉnh -> huyện -> xã reset đúng cấp con khi đổi tỉnh/huyện.
12. Thử số điện thoại sai, thiếu người nhận, thiếu địa chỉ đường và hierarchy tỉnh/huyện/xã không khớp; UI/backend phải từ chối.
13. Upload avatar sai định dạng, vượt 5 MB và hủy upload; avatar cũ không bị mất.
14. Reload trang account/address; dữ liệu phải lấy lại từ backend, không phụ thuộc state tạm của frontend.

## 2A. Ví và VNPay Sandbox

1. Mở `/wallet` lần đầu: ví được tạo lazy với available/frozen bằng 0, lịch sử giao dịch rỗng.
2. Thử nạp dưới 10.000, giá trị âm, chữ, số quá lớn và bỏ trống; nút nạp phải bị khóa hoặc báo validation.
3. Tạo giao dịch nạp hợp lệ, hủy tại cổng VNPay và quay lại; trạng thái phải là failed/canceled, số dư không tăng.
4. Tạo giao dịch khác và thanh toán thành công; trang result polling tới `SUCCESS`, số dư tăng đúng một lần.
5. Reload trang result, mở lại cùng `txnRef` và mô phỏng callback lặp; không được cộng tiền lần hai.
6. Sửa `txnRef`, amount hoặc checksum trên URL return; backend phải từ chối và số dư không đổi.
7. Kiểm tra lịch sử deposit và wallet transaction phân trang, thứ tự mới nhất trước và định dạng tiền/thời gian.
8. Kiểm tra `availableBalance + frozenBalance` trước/sau freeze, release, capture, payment, refund và payout ở các phần sau.

## 3. Seller tạo sản phẩm và gửi thẩm định

1. Seller tạo sản phẩm nháp, upload nhiều ảnh và chọn đúng một ảnh chính.
2. Sửa sản phẩm nháp, xóa/thêm ảnh và kiểm tra dữ liệu hiển thị lại chính xác.
3. Thử submit khi thiếu dữ liệu/ảnh hoặc ví không đủ phí: phải bị chặn, trạng thái và tiền không đổi.
4. Nạp tiền qua VNPay Sandbox, quay về trang kết quả và kiểm tra `WALLET_TOP_UP`.
5. Submit appraisal thành công: sản phẩm sang `PENDING_APPRAISAL`, ví ghi `APPRAISAL_FEE`.
6. Thử sửa/xóa sản phẩm sau submit: phải bị chặn theo trạng thái.
7. Form sản phẩm phải kiểm tra category, title, description, material, dimensions, weight và giới hạn 1-10 ảnh.
8. Upload file không phải JPEG/PNG/WEBP, file quá dung lượng, upload lỗi mạng và confirm thất bại; sản phẩm không được giữ reference media hỏng.
9. Xóa ảnh chính khi còn ảnh khác: phải chọn lại đúng một ảnh chính trước khi lưu/submit.
10. Tạo draft rồi rời trang/quay lại; dữ liệu đã lưu phải còn, dữ liệu chưa submit không được tự phát sinh appraisal fee.
11. Xóa draft phải xóa khỏi danh sách và không làm ảnh hưởng sản phẩm của seller khác.
12. Seller bị khóa capability khi đang ở form: request lưu/submit tiếp theo phải bị backend chặn và UI hiển thị banner.

## 4. Appraiser xử lý sản phẩm

1. Appraiser thấy sản phẩm trong queue và claim thành công.
2. Appraiser khác hoặc request lặp không thể chiếm claim còn hiệu lực.
3. Release claim, claim lại, rồi submit một bản reject có lý do bắt buộc.
4. Tạo sản phẩm khác và submit bản approve với ảnh bằng chứng, vật liệu xác minh, nguồn gốc, tuổi, tình trạng và định giá.
5. Kiểm tra report bất biến, sản phẩm sang `APPRAISED`, có certificate code và `integrityHash`.
6. Admin khóa quyền appraiser khi đang có claim: claim được giải phóng; appraiser vẫn đăng nhập được nhưng không claim/submit.
7. Admin mở lại quyền; appraiser thao tác lại được.
8. Appraiser nhập report thiếu trường bắt buộc, giá trị ước tính âm, điểm accuracy ngoài khoảng hoặc reject không có lý do; form phải chặn.
9. Appraiser upload proof sai định dạng/quá dung lượng hoặc dùng asset không thuộc mình; backend phải từ chối.
10. Sau approve/reject, reload trang và thử submit lại; report cũ phải bất biến, không tạo report thứ hai.
11. Hết thời hạn claim rồi appraiser khác claim; appraiser cũ không được submit report.
12. Trang “Đã xử lý” lọc được approve/reject, phân trang đúng và mở lại detail read-only.

## 5. Chứng thư công khai

1. Mở `/certificates/{certificateCode}` và đối chiếu dữ liệu với appraisal report.
2. Kiểm tra trang hiển thị dấu vân tay SHA-256, không tuyên bố chữ ký số hoặc blockchain.
3. Tra mã không tồn tại: phải báo không tìm thấy, không trả `valid=true`.
4. Kiểm tra ghi chú nội bộ và ảnh bằng chứng riêng tư không bị lộ trong public response.
5. Mở trực tiếp certificate trong cửa sổ ẩn danh; không yêu cầu đăng nhập.
6. So sánh title, material, appraiser, thời gian, kết luận thật/giả và hash với report seller/appraiser.
7. Copy URL, reload và nhập code có khoảng trắng/chữ hoa-thường; hành vi chuẩn hóa phải nhất quán.

## 6. Seller tạo phiên đấu giá

1. Seller chỉ thấy sản phẩm `APPRAISED` đủ điều kiện tạo phiên.
2. Thử các giá trị sai: giá khởi điểm, giá bảo lưu, bước giá, cọc, thời gian bắt đầu/kết thúc.
3. Tạo phiên `WAITING` hợp lệ.
4. Thử tạo phiên mở thứ hai cho cùng sản phẩm: phải bị chặn.
5. Seller hủy phiên chưa bắt đầu: cọc của participant được hoàn và sản phẩm trở lại trạng thái phù hợp.
6. Kiểm tra form chặn reserve nhỏ hơn starting price, step dưới 100.000, cọc dưới 1.000.000 hoặc trên 50% starting price.
7. Kiểm tra start sớm hơn 5 phút, duration dưới 1 giờ hoặc trên 30 ngày, end trước start.
8. Reload detail seller: reserve chỉ hiển thị trong khu seller, không lộ ở public detail.
9. Seller bị khóa capability không thể tạo/hủy phiên mới nhưng vẫn xem lịch sử và xử lý order đã thanh toán.

## 7. Đăng ký, rút và đặt giá realtime

1. Buyer A và Buyer B nạp đủ tiền qua VNPay Sandbox.
2. Cả hai đăng ký phiên; ví giảm available, tăng frozen và ghi `AUCTION_DEPOSIT_FREEZE`.
3. Buyer A rút khi `WAITING`: cọc được giải phóng bằng `AUCTION_DEPOSIT_RELEASE`.
4. Buyer A thử đăng ký lại cùng phiên: phải bị chặn.
5. Seller thử đăng ký/bid phiên của chính mình: phải bị chặn.
6. Khi phiên `ACTIVE`, mở hai cửa sổ Buyer A/B và đặt giá gần đồng thời.
7. Kiểm tra giá thấp hơn `currentPrice + stepPrice`, giá bằng giá hiện tại và bid của người chưa đăng ký đều bị từ chối.
8. Kiểm tra WebSocket cập nhật giá/người dẫn đầu; ngắt mạng rồi kết nối lại, REST reconciliation phải đưa UI về trạng thái đúng.
9. Bid trong cửa sổ anti-sniper và xác nhận thời gian kết thúc được gia hạn đồng nhất ở cả hai cửa sổ.
10. Kiểm tra log backend không có `event=accepted_bid_not_persisted` hoặc `event=accepted_bid_snapshot_not_synced` trong happy path.
11. Nhập đúng `currentPrice + stepPrice`: phải nhận. Nhập lớn hơn mức tối thiểu nhưng không phải bội số step: cũng phải nhận vì step là mức tăng tối thiểu.
12. Người đang dẫn đầu thử tự nâng giá: UI khóa và backend trả `SELF_BID`.
13. Đăng ký muộn khi phiên đã ACTIVE nhưng chưa hết hạn: freeze cọc và thêm bidder vào Redis thành công.
14. Thử rút sau khi ACTIVE: phải bị từ chối, cọc vẫn frozen.
15. Gửi hai bid gần đồng thời từ cùng user/hai user: chỉ kết quả phù hợp với state Redis mới được nhận, current price không đi lùi.
16. Reload phòng đấu giá: bid history, alias người dẫn đầu, trạng thái của chính user và countdown phải khôi phục đúng.
17. Đóng tab, mở lại sau một event WebSocket; REST reconciliation phải kéo đúng giá mới nhất.
18. Khi phiên vừa hết giờ, bid tiếp phải trả `ENDED`; UI chuyển overlay kết quả, không tiếp tục cho nhập.

## 8. Đóng phiên và tạo order

1. Phiên không đạt reserve: trạng thái thất bại, mọi cọc được `AUCTION_DEPOSIT_RELEASE`, không tạo order.
2. Phiên đạt reserve: winner có `AUCTION_DEPOSIT_CAPTURE`, loser có `AUCTION_DEPOSIT_RELEASE`, tạo đúng một order `PENDING_PAYMENT`.
3. Làm mới hoặc chạy scheduler lặp: không được settlement hoặc tạo order hai lần.
4. Đối chiếu `finalPrice`, `depositAmount`, `remainingAmount`, buyer/seller và snapshot sản phẩm.
5. Phiên không có bid và phiên có bid nhưng dưới reserve đều phải kết thúc thất bại, không tạo order.
6. Trong cửa sổ winner/loser, trang lịch sử “Đấu giá của tôi” phải hiển thị đúng outcome, final price và link order chỉ cho winner.
7. Public detail của phiên kết thúc không được lộ thông tin định danh đầy đủ của winner.

## 9. Thanh toán, giao hàng và hoàn tất

1. Winner chọn địa chỉ thuộc chính mình và thanh toán phần còn lại.
2. Địa chỉ của user khác hoặc request thanh toán lặp phải bị từ chối/không trừ tiền lần hai.
3. Ví buyer ghi `ORDER_PAYMENT`; order lưu snapshot người nhận và địa chỉ.
4. Seller xác nhận giao hàng với phương thức, hãng vận chuyển và mã vận đơn.
5. Buyer xác nhận đã nhận: order `COMPLETED`, seller nhận `SELLER_PAYOUT`, platform ghi `SALE_COMMISSION`.
6. Chạy callback/scheduler lặp: payout và commission không được ghi hai lần.
7. Với order khác, không xác nhận nhận hàng và chạy quá hạn auto-complete; kết quả tiền phải giống happy path.
8. Buyer không phải chủ order và seller khác mở URL detail trực tiếp: phải nhận 404/forbidden phù hợp, không lộ snapshot địa chỉ.
9. Thanh toán khi ví thiếu tiền, dùng address ID của user khác hoặc order đã quá hạn: không đổi tiền và không đổi trạng thái.
10. Seller ship thiếu carrier/tracking code hoặc ship lặp: phải bị chặn, không tạo fulfillment event trùng.
11. Buyer receive trước khi seller ship hoặc receive lặp: phải bị chặn/no-op đúng thiết kế.
12. Sửa/xóa address-book sau payment; địa chỉ snapshot trong buyer/seller order detail phải giữ nguyên.
13. Kiểm tra danh sách buyer/seller theo từng tab trạng thái, status count, pagination và deep link detail.
14. Kiểm tra seller revenue chỉ tính khoản đã thực nhận, không tính order pending/disputed/canceled.

## 10. Quá hạn thanh toán

1. Để order `PENDING_PAYMENT` quá deadline rồi chạy scheduler.
2. Order chuyển `CANCELED`, sản phẩm trở lại `AVAILABLE`.
3. Seller nhận 90% cọc bằng `SELLER_FORFEIT_COMPENSATION`.
4. Platform ghi 10% `FORFEITED_DEPOSIT_FEE`.
5. Tổng seller + platform phải đúng bằng tiền cọc; không phát sinh `SELLER_PAYOUT`.
6. Buyer thử thanh toán sau khi scheduler đã cancel: phải bị từ chối.
7. Chạy scheduler lần hai: không tạo thêm compensation hoặc platform fee.

## 11. Tranh chấp seller thắng

1. Sau khi seller giao hàng, buyer mở dispute và upload evidence.
2. Order sang `DISPUTED`; auto-complete phải bỏ qua.
3. Buyer hủy dispute: order trở lại `FULFILLING`.
4. Mở lại dispute, admin chuyển `UNDER_REVIEW`, rồi resolve `SELLER_WINS`.
5. Order hoàn tất, seller nhận payout, platform nhận commission; buyer không có `ORDER_REFUND`.
6. Khi dispute đang OPEN/UNDER_REVIEW, buyer cancel từ UI; trạng thái order/fulfillment quay lại đúng và scheduler có thể tiếp tục.
7. Seller xem được reason/evidence/history nhưng không có nút tự resolve.
8. Admin resolve thiếu decision note hoặc resolve lặp: phải bị chặn.

## 12. Tranh chấp buyer thắng

1. Tạo order khác, thanh toán và giao hàng, rồi mở dispute.
2. Admin review và resolve `BUYER_WINS`.
3. Buyer nhận đúng `depositAmount + remainingAmount` bằng `ORDER_REFUND`.
4. Order `CANCELED`, fulfillment `CANCELED`, product sale status `RETURNED`.
5. `buyerRefundAmount` bằng tổng hoàn và `refundedAt` có giá trị.
6. Seller không nhận payout, platform không ghi commission.
7. Resolve/request lặp không được hoàn tiền lần hai.
8. Sau buyer thắng, seller detail/revenue không được tính payout; public/seller product hiển thị `RETURNED`, không tự cho tạo auction mới.
9. Buyer không thể mở dispute trước trạng thái SHIPPED, sau khi COMPLETED/CANCELED hoặc không kèm evidence.

## 13. Admin và audit

1. CRUD category; không xóa category đang có con hoặc sản phẩm.
2. Lọc user theo role/status/từ khóa.
3. Ban account thường: user bị đăng xuất/không truy cập API; unban thì đăng nhập lại được.
4. Không thể tự ban admin hoặc ban admin khác qua user-ban flow.
5. Ban/unban riêng capability seller và appraiser; dữ liệu lịch sử vẫn đọc được, thao tác mới bị chặn đúng phạm vi.
6. Đối chiếu admin audit log cho tạo appraiser, ban/unban account và capability.
7. Kiểm tra dashboard revenue khớp appraisal fee, commission và forfeited deposit fee.
8. Kiểm tra create appraiser validation, email trùng, password yếu và số điện thoại sai.
9. Lọc appraiser trên trang users, khóa/mở capability appraisal và kiểm tra claim đang giữ được release.
10. Ban bidder đang đăng nhập: request tiếp theo phải thất bại dù access token chưa hết hạn.
11. Unban account không tự mở các capability đang bị khóa riêng.
12. Revenue filter theo loại/thời gian/từ khóa, phân trang và export phải khớp dữ liệu hiển thị.
13. Audit log filter theo actor/action/target/time; reason đã nhập ở dialog phải xuất hiện đúng.
14. Category slug trùng, parent không hợp lệ, xóa category có child/product phải báo lỗi rõ.

## 13A. Kiểm tra xuyên suốt giao diện

1. Chạy các màn hình chính ở 1366x768 và 1920x1080; không có nút bị che, modal vượt viewport hoặc bảng mất thao tác.
2. Chạy public/auth/account/order ở 390x844; header, form, card, dialog và gallery phải dùng được bằng touch.
3. Ghi nhận seller/appraiser/admin dùng sidebar cố định chủ yếu cho desktop; nếu mobile bị tràn thì phải nêu là giới hạn giao diện đồ án hoặc chỉnh trước bảo vệ.
4. Tab qua form bằng bàn phím; focus ring, Enter submit, Esc đóng dialog và label input phải hoạt động.
5. Kiểm tra loading, empty, success, validation error, 401, 403, 404, 409 và 500 state ở mỗi nhóm trang.
6. Double-click các nút tạo/submit/pay/ship/resolve; nút phải disable khi pending và backend không tạo dữ liệu trùng.
7. Reload trực tiếp từng route; Vite dev server phải trả SPA, router khôi phục đúng trang.
8. Kiểm tra mọi số tiền dùng định dạng VND, thời gian hiển thị đúng timezone người dùng và countdown dựa trên server clock.
9. Kiểm tra ảnh hỏng dùng fallback hợp lý, alt text có nghĩa và không làm vỡ card.
10. Kiểm tra console không có lỗi React key, state update loop, unhandled promise hoặc lỗi hydration/runtime.

## 13B. Đối chiếu database sau từng chặng

1. Sau auth: user status, role, verify/reset token và refresh token đúng; raw token không nằm trong database.
2. Sau media: asset chuyển `PENDING -> ACTIVE`, owner/entity reference đúng; asset lỗi không được attach.
3. Sau appraisal: product status, report, proof image, certificate code, integrity hash, wallet fee và platform revenue khớp.
4. Sau register/withdraw: participant row được giữ lại, deposit status và wallet operation đúng, không cho register lại.
5. Sau bidding: Redis current price/highest bidder/end time khớp UI; bid audit hợp lệ có trace ID.
6. Sau settlement: tổng frozen được release/capture đầy đủ; không còn cọc treo ngoài trường hợp được thiết kế.
7. Sau payment/fulfillment: order, fulfillment, shipping snapshot, wallet transaction và revenue khớp.
8. Sau dispute: order/fulfillment/product sale status và refund/payout/revenue khớp outcome.
9. Với mọi retry: `wallet_operations.operation_key` và các unique constraint chứng minh không có side effect lặp.

## 14. Tiêu chí kết thúc

- Không có lỗi 5xx trong toàn bộ happy path.
- Không có số dư âm, không có tiền tự sinh hoặc mất khỏi tổng dòng tiền.
- Mỗi business action chỉ tạo một wallet operation thành công cho cùng operation key.
- Role hợp lệ chỉ gồm: bidder; bidder + seller; appraiser; admin.
- Không có refresh token trong JSON/localStorage/sessionStorage.
- Certificate chỉ được mô tả là dữ liệu thẩm định kèm SHA-256 integrity hash.
- Các lệnh backend test, frontend typecheck, lint, unit test và build đều đạt; integration phụ thuộc Docker phải được ghi rõ nếu môi trường không chạy được.
- Không còn lỗi mức chặn trong checklist; các lỗi giao diện nhỏ còn lại phải được ghi vào danh sách giới hạn của báo cáo.
- Có sẵn một bộ dữ liệu demo bảo vệ gồm product APPRAISED, auction WAITING, auction ACTIVE, order PENDING_PAYMENT, order SHIPPED và dispute OPEN.
