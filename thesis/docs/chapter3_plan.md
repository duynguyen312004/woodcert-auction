# KẾ HOẠCH CHI TIẾT VIẾT CHƯƠNG 3: NỀN TẢNG LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG
*Hệ thống Đấu giá Chứng nhận Gỗ - WoodCert Auction*

---

## I. Yêu cầu chung đối với Chương 3 (Dựa trên hướng dẫn và Quy định)

1. **Độ dài giới hạn**: Chương này có độ dài tối đa là **10 trang**. Nội dung cần cô đọng, đi thẳng vào phân tích thực tế, tránh trình bày dài dòng mang tính giáo trình hoặc lý thuyết suông.
2. **Tính liên kết và nhất quán**: 
   - Các công nghệ, nền tảng lý thuyết được chọn phải khớp hoàn toàn với thực tế codebase hiện tại của dự án WoodCert Auction.
   - Mỗi công nghệ được nêu ra phải tương ứng với một vấn đề, yêu cầu nghiệp vụ cụ thể đã được phân tích ở Chương 2 (ví dụ: Real-time bidding cần WebSocket, Caching trạng thái phiên đấu giá cần Redis, nạp tiền cần VNPay, bảo mật tài khoản cần Spring Security và JWT).
3. **Cấu trúc bắt buộc đối với mỗi công nghệ**:
   - (i) **Giới thiệu**: Tóm tắt ngắn gọn định nghĩa và vai trò của công nghệ trong hệ thống.
   - (ii) **Bài toán giải quyết**: Chỉ rõ công nghệ đó giải quyết yêu cầu cụ thể nào trong hệ thống WoodCert Auction.
   - (iii) **Giải pháp thay thế**: Liệt kê các công nghệ/hướng tiếp cận tương đương.
   - (iv) **Lập luận lựa chọn (Trade-offs)**: So sánh chi tiết ưu/nhược điểm và giải thích tại sao chọn công nghệ đó mà không chọn phương án thay thế.
4. **Học thuật và Minh bạch**:
   - Sử dụng trích dẫn chéo theo chuẩn IEEE (ví dụ: `\cite{key}`).
   - Không bịa đặt chức năng, công nghệ hay số liệu. Phản ánh đúng trạng thái hiện tại của codebase.
   - Tuân thủ văn phong tiếng Việt học thuật, trang trọng, không viết dạng gạch đầu dòng tự do (sử dụng ký hiệu La Mã hoặc danh sách thống nhất).

---

## II. Đề cương chi tiết Chương 3 (LaTeX Structure)

Dưới đây là cấu trúc chi tiết được thiết kế cho file `Chapter3.tex` trong thư mục `thesis/`:

### 3.1. Giới thiệu tổng quan kiến trúc hệ thống
Trình bày sơ lược về mô hình kiến trúc tổng thể của hệ thống WoodCert Auction (Modular Monolith ở backend kết hợp Single Page Application ở frontend). Phần này làm cầu nối để dẫn dắt vào các công nghệ cụ thể.

### 3.2. Công nghệ và Nền tảng phía Backend (Server-side)
*   **3.2.1. Ngôn ngữ Java 17 và Spring Boot Framework 3.5.x**
    *   *Bài toán giải quyết*: Xây dựng lõi nghiệp vụ ổn định, an toàn giao dịch tài chính và modular hóa hệ thống.
    *   *Giải pháp thay thế*: Node.js (NestJS), Go (Golang), Python (Django).
    *   *Lập luận lựa chọn*: Khả năng xử lý đa luồng mạnh mẽ, hệ sinh thái Enterprise vững chắc, Spring Boot Starter hỗ trợ tích hợp sẵn tốt, quản lý transaction tin cậy cho tài chính.
*   **3.2.2. Spring Security và cơ chế xác thực JWT (HS512)**
    *   *Bài toán giải quyết*: Quản lý phiên đăng nhập không trạng thái (stateless), phân quyền chặt chẽ (Admin, Appraiser, Seller, Buyer), bảo mật refresh token dưới dạng hash lưu trữ trong database và Cookie HttpOnly.
    *   *Giải pháp thay thế*: OAuth2 Server bên ngoài (Keycloak, Auth0), Cookie-Session truyền thống.
    *   *Lập luận lựa chọn*: Tích hợp sâu với Spring Boot, hiệu năng cao nhờ stateless JWT, tăng tính bảo mật bằng cách chỉ lưu hash của các token nhạy cảm (verification, reset, refresh).
*   **3.2.3. WebSocket và giao thức STOMP (Spring WebSocket)**
    *   *Bài toán giải quyết*: Truyền tải dữ liệu đặt giá (bid) thời gian thực và đồng bộ trạng thái phiên đấu giá tức thời đến toàn bộ người tham gia mà không cần tải lại trang.
    *   *Giải pháp thay thế*: Server-Sent Events (SSE), HTTP Long Polling, Socket.IO.
    *   *Lập luận lựa chọn*: Giao thức STOMP hỗ trợ mô hình publish-subscribe (Pub/Sub) rất mạnh mẽ, dễ dàng tích hợp với bảo mật Spring Security trên kênh WebSocket, hỗ trợ truyền tin hai chiều hiệu quả.
*   **3.2.4. Công cụ quản lý di cư cơ sở dữ liệu Flyway**
    *   *Bài toán giải quyết*: Đồng bộ hóa và tự động hóa schema cơ sở dữ liệu MySQL qua các môi trường phát triển và production, bảo đảm tính nhất quán của cấu trúc bảng dữ liệu.
    *   *Giải pháp thay thế*: Liquibase, SQL script chạy thủ công.
    *   *Lập luận lựa chọn*: Cấu hình đơn giản hơn Liquibase (viết bằng SQL thuần túy), dễ đọc, tích hợp hoàn hảo vào tiến trình khởi động của Spring Boot, phù hợp với mô hình phát triển Agile.

### 3.3. Hệ quản trị cơ sở dữ liệu và Lưu trữ dữ liệu (Database & Storage)
*   **3.3.1. Hệ quản trị cơ sở dữ liệu quan hệ MySQL 8.x**
    *   *Bài toán giải quyết*: Lưu trữ bền vững (persistence) dữ liệu người dùng, ví tài chính, sản phẩm gỗ, chứng chỉ, lịch sử đấu giá, đơn hàng và tranh chấp. Bảo đảm tính toàn vẹn dữ liệu (ACID).
    *   *Giải pháp thay thế*: PostgreSQL, SQL Server, MongoDB (NoSQL).
    *   *Lập luận lựa chọn*: MySQL là cơ sở dữ liệu quan hệ phổ biến, hiệu năng đọc rất tốt, hỗ trợ giao dịch ACID nghiêm ngặt cần thiết cho module ví tài chính và đơn hàng. So với PostgreSQL, MySQL 8 dễ cấu hình và tối ưu hơn trên tài nguyên VPS giới hạn (2GB RAM).
*   **3.3.2. Bộ nhớ đệm và Lưu trữ trạng thái phiên Redis 7.x**
    *   *Bài toán giải quyết*: Lưu trữ trạng thái runtime của các phiên đấu giá đang kích hoạt (`ACTIVE`), đếm ngược thời gian, xử lý cơ chế anti-sniper (gia hạn thời gian đấu giá ở những giây cuối), giảm tải truy vấn trực tiếp xuống CSDL MySQL.
    *   *Giải pháp thay thế*: Memcached, In-memory Map của JVM.
    *   *Lập luận lựa chọn*: Redis hỗ trợ nhiều cấu trúc dữ liệu phong phú (Hashes, Sorted Sets), cơ chế Persistence (AOF) giúp khôi phục trạng thái khi server gặp sự cố, và hỗ trợ TTL (Time-To-Live) tự động dọn dẹp bộ nhớ.
*   **3.3.3. Dịch vụ lưu trữ đám mây Cloudinary**
    *   *Bài toán giải quyết*: Lưu trữ và tối ưu hóa hình ảnh/video về chứng chỉ gỗ, ảnh sản phẩm đấu giá, avatar người dùng.
    *   *Giải pháp thay thế*: AWS S3, lưu trữ trực tiếp trên ổ đĩa VPS (Local Storage).
    *   *Lập luận lựa chọn*: Tiết kiệm dung lượng ổ đĩa VPS, tự động tối ưu hóa định dạng và kích thước ảnh qua CDN, cung cấp SDK Java và React rất dễ sử dụng.

### 3.4. Công nghệ phía Frontend (Client-side)
*   **3.4.1. React 19 và ngôn ngữ TypeScript**
    *   *Bài toán giải quyết*: Xây dựng giao diện người dùng Single Page Application (SPA) phản ứng nhanh, tương tác mượt mà trong phòng đấu giá thời gian thực.
    *   *Giải pháp thay thế*: Angular, Vue.js, JavaScript thuần (Vanilla JS).
    *   *Lập luận lựa chọn*: React 19 tối ưu hóa hiệu năng render với Virtual DOM, TypeScript cung cấp cơ chế kiểm tra kiểu tĩnh (static typing) giúp giảm thiểu lỗi runtime trong các cấu trúc dữ liệu phức tạp của đấu giá.
*   **3.4.2. Quản lý trạng thái từ xa TanStack React Query v5 (React Query)**
    *   *Bài toán giải quyết*: Đồng bộ, caching và tự động làm mới (refetch) dữ liệu từ các API backend (danh sách sản phẩm, số dư ví, lịch sử đặt giá) lên giao diện.
    *   *Giải pháp thay thế*: Redux Saga/Thunk cho API calling, Axios kết hợp với `useEffect` thủ công.
    *   *Lập luận lựa chọn*: Tự động xử lý cache, tự động gọi lại khi mất mạng hoặc focus lại cửa sổ, giảm tải code boilerplate so với Redux, cải thiện trải nghiệm người dùng vượt trội.
*   **3.4.3. Quản lý trạng thái ứng dụng Zustand**
    *   *Bài toán giải quyết*: Quản lý global state nội bộ của client (thông tin đăng nhập của người dùng hiện tại, trạng thái các modal giao diện, trạng thái kết nối WebSocket).
    *   *Giải pháp thay thế*: Redux Toolkit, React Context API.
    *   *Lập luận lựa chọn*: Zustand cực kỳ nhẹ, không cần boilerplate code phức tạp như Redux, không bị vấn đề re-render thừa như Context API, cú pháp định nghĩa store đơn giản và trực quan.
*   **3.4.4. Thư viện giao diện TailwindCSS v4 và Radix UI**
    *   *Bài toán giải quyết*: Phát triển giao diện responsive nhanh chóng, nhất quán về thiết kế và bảo đảm khả năng truy cập (accessibility).
    *   *Giải pháp thay thế*: Bootstrap, Material UI (MUI).
    *   *Lập luận lựa chọn*: TailwindCSS v4 biên dịch cực nhanh, giảm kích thước file CSS build, Radix UI cung cấp các headless component (như Dialog, Dropdown) không chứa style giúp dễ dàng tùy biến giao diện mà vẫn giữ đúng chuẩn hoạt động.

### 3.5. Hạ tầng triển khai và CI/CD (Infrastructure & DevOps)
*   **3.5.1. Nginx và chứng chỉ bảo mật Let's Encrypt (Certbot)**
    *   *Bài toán giải quyết*: Làm cổng Reverse Proxy tiếp nhận request từ Internet, giải mã SSL/TLS (HTTPS), định tuyến lưu lượng API sang cổng 8080 và frontend sang cổng 3000.
    *   *Giải pháp thay thế*: Apache, HAProxy, Traefik.
    *   *Lập luận lựa chọn*: Nginx nhẹ, hiệu năng xử lý kết nối đồng thời cực tốt, dễ cấu hình chuyển tiếp WebSocket (Upgrade headers), Certbot tích hợp hoàn hảo giúp tự động gia hạn SSL miễn phí.
*   **3.5.2. Docker và Docker Compose**
    *   *Bài toán giải quyết*: Đóng gói toàn bộ các thành phần (Backend, Frontend, MySQL, Redis) thành các container độc lập, bảo đảm hệ thống chạy giống nhau giữa môi trường phát triển và production trên VPS.
    *   *Giải pháp thay thế*: Triển khai trực tiếp lên VPS không qua container (Bare-metal), Kubernetes (quá phức tạp cho quy mô đồ án).
    *   *Lập luận lựa chọn*: Giúp cô lập tài nguyên, dễ dàng thiết lập mạng nội bộ an toàn (không public cổng MySQL, Redis ra ngoài), khởi chạy toàn bộ hệ thống chỉ bằng một câu lệnh, quản lý dependency sạch sẽ.
*   **3.5.3. GitHub Actions**
    *   *Bài toán giải quyết*: Xây dựng luồng CI/CD tự động kiểm thử mã nguồn (linter, unit test) khi tạo Pull Request và tự động build/push Docker image lên GHCR (GitHub Container Registry) rồi cập nhật VPS khi merge vào nhánh chính.
    *   *Giải pháp thay thế*: Jenkins, GitLab CI.
    *   *Lập luận lựa chọn*: Tích hợp sẵn với kho lưu trữ GitHub, miễn phí cho tài khoản cá nhân, cấu hình bằng YAML đơn giản, không tốn tài nguyên cài đặt server CI riêng.

---

## III. Phân tích chi tiết so sánh và lập luận lựa chọn công nghệ (Nội dung cốt lõi của Chương 3)

Để viết nội dung chính thức, ta sẽ cấu trúc so sánh theo các bảng và đoạn văn phân tích trade-offs. Dưới đây là các luận điểm cốt lõi sẽ được đưa vào báo cáo:

### 1. Phân tích chọn Spring Boot cho Backend
*   **Node.js (NestJS)**: Rất nhanh cho I/O-heavy applications nhưng dễ gặp bất lợi khi xử lý các nghiệp vụ tài chính phức tạp, tính toán số dư ví chính xác và quản lý transaction đa luồng đồng thời.
*   **Go (Golang)**: Hiệu năng cực cao, tuy nhiên hệ sinh thái ORM và các thư viện bảo mật (như Spring Security) không phong phú bằng, đòi hỏi lập trình viên viết nhiều code thủ công hơn (boilerplate).
*   *Lập luận chọn Spring Boot*: Cung cấp cơ chế `@Transactional` cực kỳ mạnh mẽ và an toàn cho các thao tác cộng/trừ tiền trong ví tài chính của WoodCert Auction. Spring Security tích hợp sẵn các chuẩn bảo mật OAuth2/JWT giúp ngăn chặn tấn công tấn công chiếm quyền.

### 2. Phân tích chọn MySQL kết hợp Redis
*   **Chỉ dùng MySQL**: Khi số lượng lượt đặt giá (bid) tăng đột biến ở những giây cuối của phiên đấu giá, MySQL sẽ bị quá tải kết nối và ghi (Disk I/O), dẫn đến nghẽn hệ thống và mất mát lượt đặt giá của người dùng.
*   **Chỉ dùng Redis**: Không bảo đảm tính bền vững lâu dài cho dữ liệu quan trọng như số dư ví, tài khoản người dùng do dữ liệu Redis lưu chính trên RAM và cơ chế persistence không an toàn tuyệt đối như RDBMS.
*   *Lập luận chọn mô hình lai (Hybrid)*: Sử dụng MySQL làm CSDL chính để lưu dữ liệu bền vững. Redis được sử dụng làm nơi quản lý trạng thái của các phiên đấu giá đang diễn ra (ACTIVE). Mỗi lượt bid được gửi lên sẽ được cập nhật và kiểm tra hợp lệ tức thời trên Redis. Khi phiên đấu giá kết thúc, kết quả cuối cùng mới được ghi bền vững xuống MySQL. Đây là thiết kế tối ưu nhất cho hiệu năng và độ an toàn dữ liệu.

### 3. Phân tích chọn WebSockets (STOMP) thay vì Long Polling / SSE
*   **Long Polling**: Tạo ra liên tiếp các request HTTP gửi tới server, gây lãng phí tài nguyên mạng và quá tải CPU server khi có hàng trăm người dùng truy cập.
*   **Server-Sent Events (SSE)**: Truyền dữ liệu một chiều từ server về client. Tuy nhiên đấu giá cần tương tác hai chiều (client gửi lượt bid lên và server phát giá mới về). Nếu dùng SSE, lượt bid vẫn phải gửi qua HTTP POST thông thường, làm tăng độ trễ (latency).
*   *Lập luận chọn WebSocket + STOMP*: WebSocket tạo kết nối hai chiều liên tục với độ trễ cực thấp (miliseconds). Giao thức STOMP chạy trên WebSocket cho phép chia phòng đấu giá thành các topic (ví dụ: `/topic/auction/{id}`). Khi một buyer đặt giá, tin nhắn được gửi lên server qua kết nối WebSocket, server xử lý và broadcast giá mới về topic đó, tất cả những người tham gia phòng đó sẽ nhận được giá mới ngay lập tức.

### 4. Phân tích chọn Zustand và React Query cho Frontend
*   **Chỉ dùng React Context API**: Khi state thay đổi (ví dụ: đếm ngược giây đấu giá), toàn bộ các component con nằm trong Context Provider sẽ bị re-render không cần thiết, làm giảm hiệu năng giao diện nghiêm trọng.
*   **Dùng Redux Toolkit**: Quá cồng kềnh đối với quy mô ứng dụng, đòi hỏi quá nhiều file cấu hình (actions, reducers, selectors) làm tăng độ phức tạp không đáng có.
*   *Lập luận chọn Zustand + React Query*: React Query chịu trách nhiệm quản lý toàn bộ dữ liệu từ server (caching API, tự động làm mới danh sách sản phẩm). Zustand chỉ quản lý các state UI mỏng gọn (trạng thái đóng mở modal, user info hiện tại). Sự kết hợp này giúp frontend hoạt động mượt mà, cấu trúc code sạch sẽ và tối ưu hiệu năng render.

---

## IV. Danh sách tài liệu tham khảo dự kiến (IEEE Format - BibTeX)

Trong quá trình viết, các nguồn lý thuyết sẽ được tham chiếu trực tiếp đến các tài liệu chính thống. Dưới đây là các tài liệu tham khảo dự kiến:

```bibtex
@book{fielding2000architectural,
  title={Architectural styles and the design of network-based software architectures},
  author={Fielding, Roy Thomas},
  year={2000},
  publisher={University of California, Irvine}
}

@book{walls2022spring,
  title={Spring in Action, Sixth Edition},
  author={Walls, Craig},
  year={2022},
  publisher={Manning Publications}
}

@book{fowler2002patterns,
  title={Patterns of enterprise application architecture},
  author={Fowler, Martin},
  year={2002},
  publisher={Addison-Wesley Professional}
}

@article{bierman2014typescript,
  title={Understanding typescript},
  author={Bierman, Gavin and Abadi, Mart{\'\i}n and Torgersen, Mads},
  journal={ECOOP 2014--Object-Oriented Programming},
  pages={329--354},
  year={2014},
  publisher={Springer}
}

@book{richardson2018microservices,
  title={Microservices patterns: with examples in Java},
  author={Richardson, Chris},
  year={2018},
  publisher={Manning Publications}
}
```

---

## V. Kế hoạch viết và Phê duyệt từng phần

Để đảm bảo tiến độ và tuân thủ nguyên tắc "viết từng phần, không viết dồn", tiến trình viết Chương 3 sẽ được chia thành các bước duyệt cụ thể:

| Giai đoạn | Nội dung công việc | Đầu ra dự kiến | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Bước 1** | Người dùng xem xét và phê duyệt bản kế hoạch tổng quan này. | Bản kế hoạch được thống nhất | **Đang chờ duyệt** |
| **Bước 2** | Viết bản Markdown cho **Mục 3.1 & 3.2** (Giới thiệu kiến trúc & Công nghệ Backend). | [chapter3_backend.md](file:///c:/Users/ADMIN/Downloads/Documents/Project/DATN/thesis/chapter3_backend.md) | Chưa bắt đầu |
| **Bước 3** | Viết bản Markdown cho **Mục 3.3 & 3.4** (Cơ sở dữ liệu, Storage & Frontend). | [chapter3_frontend.md](file:///c:/Users/ADMIN/Downloads/Documents/Project/DATN/thesis/chapter3_frontend.md) | Chưa bắt đầu |
| **Bước 4** | Viết bản Markdown cho **Mục 3.5** (Triển khai, Hạ tầng VPS, Nginx, Docker, CI/CD). | [chapter3_devops.md](file:///c:/Users/ADMIN/Downloads/Documents/Project/DATN/thesis/chapter3_devops.md) | Chưa bắt đầu |
| **Bước 5** | Tổng hợp toàn bộ bản Markdown đã được duyệt và chuyển đổi sang định dạng LaTeX trong thư mục `thesis/`. | File `Chapter3.tex` compile sạch | Chưa bắt đầu |
| **Bước 6** | Compile, kiểm tra chéo tham chiếu hình ảnh, bảng biểu và tài liệu tham khảo. | Bản PDF Chương 3 hoàn chỉnh | Chưa bắt đầu |
