# CHƯƠNG 3. NỀN TẢNG LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

Chương này trình bày chi tiết về kiến trúc tổng thể, các công nghệ, thư viện, hệ quản trị cơ sở dữ liệu và công cụ hạ tầng được lựa chọn để phát triển hệ thống đấu giá chứng nhận gỗ WoodCert Auction. Với từng công nghệ được giới thiệu, nội dung sẽ đi sâu phân tích bài toán thực tế cần giải quyết trong hệ thống, các giải pháp thay thế tương đương và lập luận khoa học cho sự lựa chọn dựa trên các yếu tố về hiệu năng, độ an toàn dữ liệu và tài nguyên hệ thống.

---

## 3.1. Giới thiệu tổng quan kiến trúc hệ thống

Hệ thống WoodCert Auction được thiết kế theo mô hình kiến trúc lai giữa Monolith mô-đun (Modular Monolith) ở phía máy chủ (backend) và Ứng dụng trang đơn (Single Page Application - SPA) ở phía khách (frontend).

Sự phân tách này giúp đảm bảo tính độc lập giữa giao diện người dùng và logic xử lý nghiệp vụ. Phía backend được chia thành các gói chức năng (features) độc lập như định danh (identity), danh mục sản phẩm (catalog), đấu giá (auction), ví tài chính (finance), đơn hàng (order), hoàn tất giao dịch (fulfillment), tranh chấp (dispute) và truyền thông (media). Việc thiết kế modular monolith giúp mã nguồn backend giữ được sự mạch lạc, các mô-đun giao tiếp với nhau qua các giao diện định sẵn (interfaces) thay vì liên kết trực tiếp, từ đó giảm thiểu sự phụ thuộc lẫn nhau (coupling). Kiến trúc này giúp hệ thống dễ dàng vận hành trên một máy chủ ảo (VPS) có cấu hình vừa phải, đồng thời sẵn sàng chuyển đổi sang kiến trúc dịch vụ siêu nhỏ (Microservices) trong tương lai nếu lưu lượng truy cập và quy mô dữ liệu tăng cao.

[HÌNH DỰ KIẾN: Sơ đồ kiến trúc tổng thể hệ thống WoodCert Auction]

---

## 3.2. Công nghệ và Nền tảng phía Backend (Server-side)

Phía backend chịu trách nhiệm xử lý toàn bộ logic nghiệp vụ, quản lý giao dịch tài chính, kiểm soát phiên đấu giá thời gian thực và đảm bảo an toàn thông tin. Các công nghệ cốt lõi được lựa chọn bao gồm:

### 3.2.1. Ngôn ngữ Java 17 và Spring Boot Framework 3.5.x

*   **(i) Giới thiệu**: Java là ngôn ngữ lập trình hướng đối tượng, biên dịch sang mã bytecode chạy trên máy ảo Java (JVM). Spring Boot là một framework phát triển ứng dụng dựa trên nền tảng Spring, hỗ trợ cơ chế tự động cấu hình (auto-configuration) và quản lý phụ thuộc (dependency injection).
*   **(ii) Bài toán giải quyết**: Xây dựng lõi dịch vụ xử lý các nghiệp vụ phức tạp của hệ thống đấu giá, quản lý các tác vụ bất đồng bộ (schedules), gửi email thông báo, và điều phối các giao dịch tài chính liên quan đến nạp/rút tiền và thanh toán đơn hàng.
*   **(iii) Giải pháp thay thế**: Node.js (NestJS), Go (Golang), Python (Django).
*   **(iv) Lập luận lựa chọn**: 
    *   *So với Node.js (NestJS)*: Node.js chạy trên cơ chế đơn luồng (single-thread event loop), rất hiệu quả với các tác vụ I/O nhẹ nhưng dễ gặp hạn chế khi xử lý các nghiệp vụ tính toán tài chính phức tạp đòi hỏi tính nhất quán cao. Java hỗ trợ đa luồng thực thi (multi-threading) mạnh mẽ và cơ chế quản lý giao dịch khai báo (`@Transactional`) cực kỳ tin cậy, giúp kiểm soát các thao tác cộng/trừ tiền trong ví tài chính một cách đồng bộ và an toàn.
    *   *So với Go (Golang)*: Go có hiệu năng thực thi tối ưu và chiếm ít bộ nhớ, nhưng hệ sinh thái phát triển ứng dụng doanh nghiệp và các thư viện ORM (Object-Relational Mapping) chưa toàn diện như Java. Spring Boot cung cấp các bộ Starter tích hợp sẵn (Data JPA, Security, Web, Redis) giúp rút ngắn đáng kể thời gian phát triển và bảo trì hệ thống.
    *   *Ưu điểm của Java 17*: Việc sử dụng phiên bản Java 17 mang lại các tính năng hiện đại như Record class (tối ưu hóa các lớp chứa dữ liệu DTO), Pattern Matching cho khối lệnh switch, và Text Blocks giúp nâng cao năng suất viết mã nguồn và cải thiện hiệu năng chạy của JVM.

### 3.2.2. Spring Security và cơ chế xác thực JWT (HS512)

*   **(i) Giới thiệu**: Spring Security là mô-đun cung cấp các tính năng xác thực (authentication) và phân quyền (authorization) cho ứng dụng Spring. JWT (JSON Web Token) là một tiêu chuẩn mở (RFC 7519) định nghĩa cách truyền thông tin an toàn giữa các bên dưới dạng đối tượng JSON được ký số.
*   **(ii) Bài toán giải quyết**: Bảo vệ các API endpoint khỏi các truy cập trái phép, phân quyền chi tiết cho các vai trò người dùng (Quản trị viên - Admin, Kiểm định viên - Appraiser, Người bán - Seller, Người mua - Buyer), xác thực các yêu cầu gửi lên thông qua token JWT không trạng thái (stateless).
*   **(iii) Giải pháp thay thế**: Keycloak hoặc Auth0 (dịch vụ Identity Provider bên ngoài), cơ chế Session-Cookie truyền thống.
*   **(iv) Lập luận lựa chọn**:
    *   *So với Keycloak/Auth0*: Keycloak yêu cầu vận hành một server riêng biệt, tiêu tốn lượng tài nguyên RAM đáng kể (tối thiểu 1-2 GB RAM), không phù hợp khi triển khai trên hệ thống VPS giới hạn tài nguyên. Tích hợp trực tiếp xác thực vào Spring Security giúp hệ thống gọn nhẹ và dễ kiểm soát mã nguồn hơn.
    *   *So với Session-Cookie*: Cơ chế lưu session trên RAM của server gây khó khăn cho việc mở rộng quy mô hệ thống (scaling) sau này vì yêu cầu cơ chế sticky session hoặc đồng bộ session. JWT cho phép xác thực không trạng thái, server chỉ cần giải mã chữ ký của token mà không cần truy vấn bộ nhớ để kiểm tra phiên làm việc.
    *   *Thiết kế bảo mật thực tế*: Hệ thống sử dụng thuật toán ký HS512 (HMAC sử dụng SHA-512) với khóa bí mật dài tối thiểu 64 byte để ký các Access Token (thời gian sống 15 phút). Để tối đa hóa tính an toàn, Refresh Token (thời gian sống 7 ngày), token kích hoạt tài khoản và token reset mật khẩu không được lưu trực tiếp dưới dạng chuỗi thô (raw string) trong cơ sở dữ liệu; thay vào đó, hệ thống thực hiện băm (hashing) trước khi lưu trữ. Refresh Token được truyền về client qua Cookie HttpOnly với cờ Secure và cấu hình SameSite=Lax nhằm ngăn chặn triệt để các cuộc tấn công đánh cắp token qua XSS (Cross-Site Scripting) và giảm thiểu rủi ro CSRF (Cross-Site Request Forgery).

### 3.2.3. WebSocket và giao thức STOMP (Spring WebSocket)

*   **(i) Giới thiệu**: WebSocket là giao thức truyền thông hai chiều, toàn song công (full-duplex) qua một kết nối TCP duy nhất. STOMP (Simple Text Oriented Messaging Protocol) là giao thức tin nhắn đơn giản chạy trên WebSocket, định nghĩa các khung tin nhắn để các client và message broker giao tiếp theo mô hình Publish/Subscribe.
*   **(ii) Bài toán giải quyết**: Cập nhật giá đấu hiện tại tức thời tới toàn bộ người dùng đang mở trang chi tiết phiên đấu giá, nhận yêu cầu đặt giá (bid) từ người mua với độ trễ thấp nhất mà không cần tải lại toàn bộ trang.
*   **(iii) Giải pháp thay thế**: Server-Sent Events (SSE), HTTP Long Polling, Socket.IO.
*   **(iv) Lập luận lựa chọn**:
    *   *So với HTTP Long Polling*: Gây tải cực kỳ lớn lên server do client liên tục gửi yêu cầu HTTP thiết lập kết nối mới, tiêu tốn tài nguyên băng thông và CPU của hệ thống.
    *   *So với Server-Sent Events (SSE)*: SSE chỉ hỗ trợ truyền dữ liệu một chiều từ máy chủ về trình duyệt (server-to-client). Khi người mua đặt giá, họ vẫn phải gửi một yêu cầu HTTP POST thông thường lên server, điều này tạo ra độ trễ lớn hơn và tăng số lượng kết nối đồng thời mà server phải xử lý.
    *   *Lý do chọn WebSocket + STOMP*: WebSocket thiết lập một kết nối duy nhất và duy trì trạng thái, cho phép truyền tin hai chiều với overhead tiêu đề (header overhead) cực nhỏ. Việc sử dụng STOMP trên nền WebSocket mang lại cấu trúc định tuyến rõ ràng (ví dụ: `/topic/auction/{id}` để cập nhật giá và `/app/auction/{id}/bid` để đặt giá), giúp phân nhóm người dùng tham gia phòng đấu giá hiệu quả. Ngoài ra, Spring cung cấp bộ lọc bảo mật trên WebSocket giúp dễ dàng xác thực người dùng dựa trên JWT tại thời điểm kết nối được thiết lập.

### 3.2.4. Công cụ quản lý di cư cơ sở dữ liệu Flyway

*   **(i) Giới thiệu**: Flyway là một công cụ quản lý các thay đổi về cấu trúc cơ sở dữ liệu (database migration), giúp tự động hóa quá trình chạy các file script SQL để cập nhật schema theo thứ tự phiên bản tăng dần.
*   **(ii) Bài toán giải quyết**: Đồng bộ hóa cấu trúc các bảng dữ liệu, khóa ngoại, chỉ mục (indexes) và các dữ liệu khởi tạo (seed data) giữa môi trường phát triển của lập trình viên và môi trường triển khai thực tế trên máy chủ VPS.
*   **(iii) Giải pháp thay thế**: Liquibase, chạy các file script SQL bằng tay.
*   **(iv) Lập luận lựa chọn**:
    *   *So với Liquibase*: Liquibase sử dụng các định dạng XML, YAML hoặc JSON để mô tả các thay đổi dữ liệu. Cách tiếp cận này làm tăng độ phức tạp khi học và viết cấu trúc di cư. Flyway sử dụng trực tiếp các file SQL thuần túy (ví dụ: `V1__init.sql`, `V3__seed_demo_users.sql`), giúp các lập trình viên viết mã nguồn dễ dàng, tận dụng tối đa các công cụ định dạng SQL và dễ dàng kiểm tra lịch sử thay đổi qua Git.
    *   *So với chạy SQL bằng tay*: Chạy script thủ công rất dễ dẫn đến sai sót của con người, gây ra tình trạng bất đồng bộ cấu trúc cơ sở dữ liệu giữa các môi trường, làm sập ứng dụng khi cập nhật phiên bản mới. Flyway tự động kiểm tra checksum của các file migration trước đó khi ứng dụng khởi động, bảo đảm không có file SQL nào bị chỉnh sửa trái phép sau khi đã chạy.

---

## 3.3. Hệ quản trị cơ sở dữ liệu và Lưu trữ dữ liệu (Database & Storage)

Lớp lưu trữ chịu trách nhiệm bảo toàn dữ liệu giao dịch bền vững, tăng tốc độ truy vấn các phiên đấu giá và lưu trữ tài nguyên hình ảnh chứng chỉ gỗ một cách tối ưu.

### 3.3.1. Hệ quản trị cơ sở dữ liệu quan hệ MySQL 8.x

*   **(i) Giới thiệu**: MySQL là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở phổ biến, lưu trữ dữ liệu dưới dạng các bảng có mối quan hệ chặt chẽ và hỗ trợ ngôn ngữ truy vấn chuẩn SQL.
*   **(ii) Bài toán giải quyết**: Lưu trữ bền vững thông tin người dùng, chi tiết sản phẩm gỗ, chứng nhận kiểm định, lịch sử các giao dịch tài chính, thông tin đơn hàng và lịch sử giải quyết tranh chấp. Bảo đảm tính nhất quán dữ liệu thông qua cơ chế khóa (locking) và các ràng buộc toàn vẹn.
*   **(iii) Giải pháp thay thế**: PostgreSQL, MongoDB (NoSQL), Microsoft SQL Server.
*   **(iv) Lập luận lựa chọn**:
    *   *So với MongoDB (NoSQL)*: MongoDB lưu trữ dữ liệu dưới dạng tài liệu JSON không có lược đồ cố định (schema-less). Điều này không phù hợp với các hệ thống có tính chất giao dịch tài chính như ví tiền và đơn hàng của WoodCert Auction, nơi tính toàn vẹn dữ liệu và ràng buộc khóa ngoại (foreign key constraints) là bắt buộc để ngăn chặn các dữ liệu rác hoặc sai lệch số dư.
    *   *So với PostgreSQL*: PostgreSQL mạnh về các tính năng xử lý truy vấn phức tạp và dữ liệu địa lý, nhưng đòi hỏi cấu hình tài nguyên RAM và CPU lớn hơn để hoạt động tối ưu. Trên môi trường VPS thực tế với RAM giới hạn (2 GB), MySQL 8 mang lại hiệu năng đọc vượt trội, cấu hình gọn nhẹ và chiếm dụng tài nguyên hệ thống ít hơn, đảm bảo hệ thống vận hành trơn tru.
    *   *Đảm bảo ACID*: MySQL sử dụng storage engine InnoDB hỗ trợ đầy đủ các tính chất ACID (Atomicity, Consistency, Isolation, Durability), giúp các thao tác thanh toán đơn hàng và trừ tiền đặt cọc diễn ra an toàn, không xảy ra hiện tượng mất mát dữ liệu khi server gặp sự cố.

### 3.3.2. Bộ nhớ đệm và Lưu trữ trạng thái phiên Redis 7.x

*   **(i) Giới thiệu**: Redis là hệ thống lưu trữ cấu trúc dữ liệu trong bộ nhớ RAM (in-memory data structure store), hoạt động như một cơ sở dữ liệu key-value có hiệu năng truy cập cực cao (độ trễ dưới 1 mili giây).
*   **(ii) Bài toán giải quyết**: Lưu trữ trạng thái runtime của các phiên đấu giá đang diễn ra (`ACTIVE`), quản lý bộ đếm ngược thời gian kết thúc đấu giá, lưu trữ thông tin tạm thời về các lượt đặt giá (bids) gần nhất để đối chiếu hợp lệ, xử lý logic anti-sniper (tự động gia hạn thêm 60 giây nếu có người đặt giá ở 30 giây cuối).
*   **(iii) Giải pháp thay thế**: Memcached, cơ chế lưu trữ In-memory trực tiếp trên bộ nhớ của ứng dụng Java (ví dụ: ConcurrentHashMap).
*   **(iv) Lập luận lựa chọn**:
    *   *So với Memcached*: Memcached chỉ hỗ trợ kiểu dữ liệu chuỗi (string) đơn giản và không có cơ chế bền vững hóa dữ liệu. Redis cung cấp các cấu trúc dữ liệu phong phú như Hashes (lưu thông tin phiên đấu giá), Sorted Sets (lập chỉ mục và sắp xếp thứ tự các lượt đặt giá theo thời gian và số tiền), giúp việc truy vấn dữ liệu đấu giá nhanh chóng và tối ưu.
    *   *So với JVM In-memory (ConcurrentHashMap)*: Lưu trực tiếp trên RAM của Java làm tăng dung lượng bộ nhớ heap của JVM, dễ dẫn đến hiện tượng treo ứng dụng do bộ dọn rác (Garbage Collector) hoạt động quá lâu. Hơn nữa, nếu ứng dụng backend bị restart hoặc nâng cấp, toàn bộ dữ liệu đấu giá đang diễn ra sẽ bị mất. Redis chạy độc lập với vòng đời của backend container, hỗ trợ cơ chế ghi log lưu trữ xuống đĩa (AOF - Append Only File) giúp khôi phục toàn bộ trạng thái phiên đấu giá ngay lập tức khi hệ thống gặp sự cố mất điện hoặc khởi động lại.

[HÌNH DỰ KIẾN: Sơ đồ kiến trúc lai (Hybrid) lưu trữ dữ liệu giữa MySQL và Redis]

### 3.3.3. Dịch vụ lưu trữ đám mây Cloudinary

*   **(i) Giới thiệu**: Cloudinary là nền tảng đám mây cung cấp dịch vụ quản lý, lưu trữ, tối ưu hóa và phân phối hình ảnh/video thông qua mạng phân phối nội dung (CDN).
*   **(ii) Bài toán giải quyết**: Lưu trữ ảnh đại diện người dùng, hình ảnh chụp chi tiết các lô gỗ đấu giá, các file ảnh chụp chứng thư và giấy tờ chứng nhận nguồn gốc gỗ hợp pháp.
*   **(iii) Giải pháp thay thế**: AWS S3, lưu trực tiếp trên ổ đĩa của máy chủ VPS (Local Storage).
*   **(iv) Lập luận lựa chọn**:
    *   *So với lưu file trên VPS*: Lưu trực tiếp trên VPS làm tiêu tốn dung lượng ổ đĩa của máy chủ rất nhanh (đặc biệt khi hình ảnh kiểm định gỗ có độ phân giải cao). Ngoài ra, việc sao lưu (backup) dữ liệu trở nên phức tạp hơn, và tốc độ tải ảnh của người dùng bị giới hạn bởi băng thông của VPS.
    *   *So với AWS S3*: AWS S3 chỉ là kho lưu trữ thô (raw storage), không hỗ trợ tự động tối ưu hóa dung lượng ảnh. Lập trình viên phải tự viết mã nguồn để nén ảnh, resize ảnh trước khi upload để tiết kiệm băng thông. Cloudinary cung cấp các API tự động nén ảnh, chuyển đổi định dạng ảnh sang các chuẩn hiện đại (như WebP) tùy thuộc vào trình duyệt của client, giúp giảm dung lượng ảnh tải về nhưng vẫn giữ nguyên chất lượng hiển thị, nâng cao đáng kể tốc độ tải trang của người dùng.

---

## 3.4. Công nghệ phía Frontend (Client-side)

Phía client chịu trách nhiệm cung cấp giao diện hiển thị trực quan, tương tác mượt mà trong phòng đấu giá thời gian thực và quản lý các luồng nhập liệu của người dùng.

### 3.4.1. React 19 và ngôn ngữ TypeScript

*   **(i) Giới thiệu**: React là thư viện JavaScript mã nguồn mở được phát triển bởi Meta dùng để xây dựng giao diện người dùng dựa trên các thành phần (components). TypeScript là một siêu tập (superset) của JavaScript, bổ sung cơ chế kiểm tra kiểu tĩnh (static typing).
*   **(ii) Bài toán giải quyết**: Xây dựng giao diện ứng dụng trang đơn (SPA) động, xử lý việc cập nhật liên tục giao diện phòng đấu giá khi có giá đấu mới được gửi về qua WebSocket.
*   **(iii) Giải pháp thay thế**: Angular, Vue.js, JavaScript thuần (Vanilla JS).
*   **(iv) Lập luận lựa chọn**:
    *   *So với Angular*: Angular là một framework hoàn chỉnh với kích thước tệp tin bundle rất lớn và độ phức tạp cao, yêu cầu thời gian phát triển dài hơn. React 19 có dung lượng nhẹ, tập trung vào tầng hiển thị (View) và có hiệu năng render tối ưu nhờ cơ chế Virtual DOM.
    *   *So với JavaScript thuần (Vanilla JS)*: Việc quản lý trạng thái giao diện đấu giá (thời gian đếm ngược, danh sách người đặt giá, trạng thái kết nối WebSocket) bằng Vanilla JS sẽ dẫn đến các đoạn mã nguồn thao tác DOM trực tiếp cực kỳ phức tạp, dễ phát sinh lỗi rò rỉ bộ nhớ (memory leaks).
    *   *Vai trò của TypeScript*: Việc sử dụng TypeScript giúp định nghĩa rõ ràng các kiểu dữ liệu của API trả về (DTOs) và các kiểu dữ liệu của sự kiện WebSocket. Các lỗi về kiểu dữ liệu hoặc thuộc tính không tồn tại sẽ bị phát hiện ngay lập tức trong quá trình biên dịch (compile-time) thay vì gây sập ứng dụng ở runtime khi người dùng đang sử dụng.

### 3.4.2. Quản lý trạng thái từ xa TanStack React Query v5 (React Query)

*   **(i) Giới thiệu**: TanStack React Query là thư viện quản lý trạng thái bất đồng bộ (server-state), giúp tự động hóa việc fetch dữ liệu, caching, đồng bộ hóa và làm mới dữ liệu từ các API backend.
*   **(ii) Bài toán giải quyết**: Quản lý dữ liệu lấy từ API backend như danh sách sản phẩm gỗ, thông tin chi tiết phiên đấu giá, lịch sử giao dịch ví tài chính và thông tin cá nhân.
*   **(iii) Giải pháp thay thế**: Sử dụng Axios kết hợp với `useEffect` thủ công, Redux Saga hoặc Redux Thunk.
*   **(iv) Lập luận lựa chọn**:
    *   *So với Axios + useEffect*: Viết logic fetch dữ liệu thủ công bằng `useEffect` đòi hỏi lập trình viên tự quản lý các trạng thái loading, error, và xử lý lỗi race condition (khi các request phản hồi không theo thứ tự gửi). Ngoài ra, không có cơ chế cache, dẫn đến việc mỗi lần người dùng chuyển trang thì ứng dụng phải gửi request mới lên server, gây lãng phí tài nguyên mạng.
    *   *So với Redux Saga/Thunk*: Redux đòi hỏi viết quá nhiều mã nguồn boilerplate (actions, reducers, types) chỉ để xử lý các tác vụ gọi API cơ bản.
    *   *Ưu điểm của React Query*: Tự động cache dữ liệu trong bộ nhớ client. Khi người dùng quay lại một trang cũ, React Query hiển thị ngay lập tức dữ liệu cũ từ cache (tránh màn hình trắng chờ đợi), đồng thời gửi một yêu cầu ngầm để cập nhật dữ liệu mới (stale-while-revalidate). Thư viện cũng tự động thử lại request (retry) khi mạng gặp sự cố chập chờn, cải thiện trải nghiệm người dùng rõ rệt.

### 3.4.3. Quản lý trạng thái ứng dụng Zustand

*   **(i) Giới thiệu**: Zustand là thư viện quản lý trạng thái (state management) toàn cục gọn nhẹ cho React, sử dụng cơ chế pub-sub đơn giản và không yêu cầu bọc ứng dụng trong các Provider.
*   **(ii) Bài toán giải quyết**: Lưu trữ các trạng thái client-state nội bộ của ứng dụng không phụ thuộc vào API như thông tin đăng nhập của người dùng hiện tại (được đồng bộ từ access token), trạng thái kết nối và client của WebSocket, và các trạng thái bật/tắt của các modal giao diện.
*   **(iii) Giải pháp thay thế**: Redux Toolkit, React Context API.
*   **(iv) Lập luận lựa chọn**:
    *   *So với React Context API*: Khi giá trị trong Context Provider thay đổi, tất cả các component con nằm trong Provider đó đều bị ép buộc render lại (re-render), ngay cả khi chúng không sử dụng giá trị thay đổi đó. Điều này gây suy giảm hiệu năng nghiêm trọng đối với các trang web có nhiều tương tác thời gian thực như phòng đấu giá.
    *   *So với Redux Toolkit*: Redux Toolkit quá nặng và phức tạp cho nhu cầu quản lý các trạng thái UI mỏng nhẹ của dự án.
    *   *Ưu điểm của Zustand*: Cú pháp định nghĩa store cực kỳ ngắn gọn (chỉ vài dòng code), hỗ trợ cơ chế selector thông minh giúp chỉ render lại các component thực sự sử dụng thuộc tính thay đổi, đảm bảo hiệu năng tối ưu cho ứng dụng React.

### 3.4.4. Thư viện giao diện TailwindCSS v4 và Radix UI

*   **(i) Giới thiệu**: TailwindCSS là một CSS framework theo hướng tiện ích (utility-first), cung cấp các class CSS viết sẵn để thiết kế giao diện trực tiếp trong file HTML/React. Radix UI là thư viện cung cấp các thành phần giao diện không chứa định dạng sẵn (headless UI components), tập trung vào khả năng tương tác và tiêu chuẩn tiếp cận (accessibility).
*   **(ii) Bài toán giải quyết**: Xây dựng giao diện responsive hoạt động mượt mà trên cả máy tính và thiết bị di động, nhất quán về mặt thiết kế (design system), tạo ra các hộp thoại (dialogs), menu thả xuống (dropdowns) hoạt động đúng chuẩn giao tiếp WAI-ARIA.
*   **(iii) Giải pháp thay thế**: Bootstrap, Material UI (MUI).
*   **(iv) Lập luận lựa chọn**:
    *   *So với Bootstrap*: Bootstrap đi kèm các định dạng mặc định tương đối cũ và khó tùy biến sâu. Việc ghi đè (override) CSS của Bootstrap tốn nhiều thời gian và dễ làm phình kích thước file CSS cuối cùng.
    *   *So với Material UI (MUI)*: MUI mang phong cách thiết kế Material Design rất đặc trưng của Google. Việc thay đổi MUI sang một phong cách thiết kế hiện đại, sang trọng phù hợp với sản phẩm gỗ tự nhiên đòi hỏi cấu hình theme cực kỳ phức tạp và làm tăng đáng kể dung lượng bundle của trang web.
    *   *Sự kết hợp TailwindCSS v4 + Radix UI*: TailwindCSS v4 sử dụng engine biên dịch thế hệ mới siêu nhanh, tự động tối ưu hóa kích thước file CSS khi build. Radix UI cung cấp các khối chức năng (như Dialog, Dropdown, Tabs) đã được tối ưu hóa khả năng điều khiển bằng bàn phím và trình đọc màn hình, nhưng hoàn toàn không có CSS style. Lập trình viên có thể dùng TailwindCSS để tự do trang trí giao diện theo đúng ý đồ thiết kế mà vẫn đảm bảo các component hoạt động chuẩn xác và mượt mà.

---

## 3.5. Hạ tầng triển khai và CI/CD (Infrastructure & DevOps)

Hạ tầng triển khai chịu trách nhiệm bảo đảm ứng dụng chạy ổn định, an toàn trước các truy cập trái phép và tự động hóa quy trình cập nhật phần mềm.

### 3.5.1. Nginx và chứng chỉ bảo mật Let's Encrypt (Certbot)

*   **(i) Giới thiệu**: Nginx là phần mềm máy chủ web mã nguồn mở, hoạt động như một reverse proxy và cân bằng tải hiệu năng cao. Let's Encrypt là nhà cung cấp chứng chỉ số SSL/TLS miễn phí, tự động hóa thông qua công cụ Certbot.
*   **(ii) Bài toán giải quyết**: Tiếp nhận các yêu cầu kết nối từ Internet gửi tới tên miền của hệ thống, giải mã SSL để cung cấp kết nối bảo mật HTTPS, định tuyến các yêu cầu có tiền tố `/api` và `/ws-auction` vào cổng backend nội bộ (8080) và các yêu cầu khác vào cổng frontend (3000).
*   **(iii) Giải pháp thay thế**: Apache HTTP Server, Traefik, HAProxy.
*   **(iv) Lập luận lựa chọn**:
    *   *So với Apache*: Apache sử dụng mô hình tạo luồng mới cho mỗi kết nối (process-per-connection), tiêu tốn nhiều RAM và CPU khi số lượng người dùng đồng thời tăng cao. Nginx sử dụng kiến trúc hướng sự kiện bất đồng bộ (asynchronous event-driven), có khả năng xử lý hàng chục nghìn kết nối đồng thời với lượng tài nguyên RAM cực kỳ nhỏ.
    *   *So với Traefik*: Traefik phù hợp với các hệ thống microservices chạy trên Kubernetes với khả năng tự động phát hiện dịch vụ. Đối với hệ thống chạy Docker Compose đơn lẻ trên một VPS, Nginx mang lại sự đơn giản, cấu hình tường minh và hiệu năng chuyển tiếp gói tin ổn định hơn.
    *   *Cấu hình WebSocket thực tế*: Nginx được cấu hình cụ thể để hỗ trợ nâng cấp giao thức (protocol upgrade headers) từ HTTP sang WebSocket, đảm bảo các kết nối thời gian thực tới endpoint `/ws-auction` không bị ngắt quãng giữa chừng.

### 3.5.2. Docker và Docker Compose

*   **(i) Giới thiệu**: Docker là nền tảng ảo hóa ở cấp độ hệ điều hành (containerization), giúp đóng gói ứng dụng và tất cả các thư viện phụ thuộc vào một container duy nhất. Docker Compose là công cụ để định nghĩa và chạy các ứng dụng Docker đa container thông qua một file cấu hình YAML.
*   **(ii) Bài toán giải quyết**: Đảm bảo toàn bộ hệ thống bao gồm backend (Java JRE), frontend (Nginx phục vụ file tĩnh), cơ sở dữ liệu MySQL và cache Redis hoạt động đồng nhất trên mọi máy tính của lập trình viên và trên VPS chạy hệ điều hành Ubuntu Server.
*   **(iii) Giải pháp thay thế**: Triển khai trực tiếp lên hệ điều hành của VPS không qua container (Bare-metal), Kubernetes (K8s).
*   **(iv) Lập luận lựa chọn**:
    *   *So với triển khai Bare-metal*: Việc cài đặt trực tiếp Java, Node.js, MySQL, Redis lên VPS rất dễ dẫn đến lỗi xung đột phiên bản phần mềm với các ứng dụng khác đang chạy trên hệ điều hành. Việc di chuyển hệ thống sang một server VPS mới đòi hỏi phải thực hiện lại toàn bộ quy trình cài đặt và cấu hình thủ công rất tốn thời gian và dễ xảy ra sai sót. Docker đóng gói mọi thứ thành các image độc lập, giúp việc triển khai chỉ gói gọn trong một câu lệnh khởi chạy container.
    *   *So với Kubernetes*: Kubernetes là giải pháp điều phối container ở quy mô lớn (cluster gồm nhiều máy chủ). Việc vận hành Kubernetes cực kỳ phức tạp và tiêu hao lượng lớn tài nguyên hệ thống (master node yêu cầu tối thiểu 2-4 GB RAM chỉ để chạy các tiến trình quản lý hệ thống), hoàn toàn vượt quá nhu cầu và ngân sách của một đồ án tốt nghiệp chạy trên VPS đơn lẻ.
    *   *Thiết lập mạng nội bộ an toàn*: File `docker-compose.prod.yml` được cấu hình để không mở (publish) các cổng 3306 (MySQL) và 6379 (Redis) ra bên ngoài Internet. Chỉ các container nằm trong mạng nội bộ của Docker Compose mới có thể truy cập được các dịch vụ này, ngăn chặn hoàn toàn nguy cơ bị tấn công dò mật khẩu CSDL từ Internet.

### 3.5.3. GitHub Actions

*   **(i) Giới thiệu**: GitHub Actions là dịch vụ tự động hóa quy trình phát triển phần mềm (CI/CD) được tích hợp trực tiếp vào nền tảng lưu trữ mã nguồn GitHub.
*   **(ii) Bài toán giải quyết**: Tự động chạy quy trình kiểm tra mã nguồn (linting), biên dịch thử (build check) khi có lập trình viên tạo Pull Request lên nhánh chính. Khi Pull Request được merge, tự động đóng gói ứng dụng thành Docker image, đẩy (push) lên GitHub Container Registry (GHCR) và gửi lệnh SSH để máy chủ VPS tự động kéo image mới về và khởi động lại container tương ứng.
*   **(iii) Giải pháp thay thế**: Jenkins, GitLab CI.
*   **(iv) Lập luận lựa chọn**:
    *   *So với Jenkins*: Jenkins yêu cầu cài đặt và vận hành một máy chủ CI riêng biệt, tiêu tốn tài nguyên CPU và RAM liên tục của hệ thống. Đồng thời, lập trình viên phải tự cấu hình bảo mật, cập nhật plugin và sao lưu cấu hình Jenkins thủ công.
    *   *So với GitLab CI*: Đòi hỏi kho lưu trữ mã nguồn phải được lưu trữ trên GitLab, trong khi mã nguồn của dự án hiện tại đang được quản lý trên GitHub để tận dụng các tính năng cộng tác và quản lý dự án.
    *   *Lý do chọn GitHub Actions*: Tích hợp sâu với GitHub, cung cấp tài nguyên chạy pipeline (runners) hoàn toàn miễn phí cho các kho lưu trữ cá nhân, cấu hình quy trình bằng tệp tin YAML đặt trực tiếp trong thư mục `.github/workflows/` giúp việc theo dõi và thay đổi cấu hình CI/CD trở nên tường minh và đơn giản.

---

## 3.6. Tổng kết các hình vẽ và sơ đồ cần thiết trong Chương 3

Để tăng tính trực quan và khoa học cho báo cáo đồ án tốt nghiệp, dưới đây là danh sách các sơ đồ kỹ thuật cần được thiết kế và chèn trực tiếp vào nội dung Chương 3:

### 3.6.1. Sơ đồ kiến trúc tổng thể hệ thống WoodCert Auction
*   **Mục đích**: Minh họa dòng chảy của các yêu cầu (requests) từ trình duyệt người dùng đi qua lớp bảo mật và định tuyến, vào đến các container ứng dụng bên trong mạng nội bộ Docker.
*   **Các thành phần cần vẽ**:
    *   *Client-side*: Browser (Trình duyệt web).
    *   *Entrypoint*: Host Firewall (UFW) -> Nginx Reverse Proxy (Cổng 443 / HTTPS và Cổng 80 / HTTP).
    *   *Docker Compose Network (Internal)*:
        *   Frontend Container (Cổng 3000 / phục vụ React SPA qua Nginx).
        *   Backend Container (Cổng 8080 / Spring Boot Java 17).
        *   MySQL Container (Cổng 3306 / Không public ra ngoài).
        *   Redis Container (Cổng 6379 / Không public ra ngoài).
    *   *External Integrations*: Cloudinary (Lưu ảnh), VNPay Sandbox (Cổng thanh toán), SMTP Server (Gửi Mail).

### 3.6.2. Sơ đồ luồng kết nối real-time WebSocket và STOMP Broker
*   **Mục đích**: Minh họa cách thức kết nối hai chiều được thiết lập và cách các thông điệp đặt giá (bid messages) được điều phối thông qua mô hình Publish/Subscribe.
*   **Các thành phần cần vẽ**:
    *   *Client A (Buyer A)* và *Client B (Buyer B)*.
    *   *WebSocket Connection* (Đường truyền song song hai chiều).
    *   *Backend STOMP Router*:
        *   Inbound Channel (Nhận tin đặt giá từ Client gửi tới `/app/auction/{id}/bid`).
        *   Outbound Channel (Broadcast giá mới về topic `/topic/auction/{id}`).
    *   *Redis Cache* (Nơi kiểm tra giá đặt mới có lớn hơn giá hiện tại hay không trước khi broadcast).

### 3.6.3. Sơ đồ kiến trúc lưu trữ lai (Hybrid Database Architecture)
*   **Mục đích**: Giải thích cơ chế phối hợp giữa MySQL và Redis để tối ưu hóa hiệu năng ghi và đảm bảo tính nhất quán dữ liệu cho các phiên đấu giá.
*   **Các bước cần mô tả trên sơ đồ**:
    *   *Bước 1 (Khởi tạo)*: Phiên đấu giá chuyển sang trạng thái `ACTIVE` -> Hệ thống đồng bộ thông tin phiên từ MySQL sang Redis.
    *   *Bước 2 (Runtime)*: Buyer gửi lượt đặt giá (Bid) -> Backend thực hiện kiểm tra và cập nhật trực tiếp trên Redis (tốc độ đọc ghi RAM siêu nhanh, xử lý anti-sniper).
    *   *Bước 3 (Kết thúc)*: Phiên đấu giá kết thúc (`CLOSED`) -> Worker của Backend lấy giá thắng cuộc cuối cùng từ Redis ghi bền vững xuống MySQL và giải phóng bộ nhớ trên Redis.
