# Hướng dẫn triển khai hệ thống đấu giá WoodCert trên VPS

Tài liệu này hướng dẫn cách triển khai cơ sở dữ liệu MySQL, hàng đợi Redis, backend Spring Boot và frontend React bằng Docker Compose. Nginx trên máy chủ đóng vai trò làm cổng reverse proxy để giải mã SSL (HTTPS) và chỉ định tuyến các yêu cầu (proxy traffic) đến các cổng nội bộ (loopback) của ứng dụng.

## 1. Yêu cầu hệ thống tối thiểu

- Hệ điều hành Ubuntu 22.04 hoặc mới hơn.
- Một tên miền đã được cấu hình bản ghi `A` trỏ về địa chỉ IP của VPS.
- RAM tối thiểu 2 GB và có phân vùng Swap; khuyên dùng RAM từ 4 GB trở lên nếu thực hiện build Docker image trực tiếp trên VPS.
- Đã cài đặt Docker Engine, plugin Docker Compose, Nginx và Certbot.

```bash
sudo apt update
sudo apt install -y ca-certificates curl nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Đăng xuất và đăng nhập lại sau khi thêm tài khoản vào nhóm `docker` để các thiết lập có hiệu lực.

### 1.1 Tăng Cường Bảo Mật Máy Chủ (UFW & SSH Hardening)

Để bảo vệ VPS khỏi các đợt quét port tự động và xâm nhập trái phép, hãy thiết lập Firewall và thắt chặt SSH:

**1. Cấu hình Firewall (UFW):**
Chỉ cho phép các lưu lượng HTTP, HTTPS và cổng SSH của bạn.
```bash
# Thiết lập quy tắc mặc định
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Mở các cổng cần thiết
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Kích hoạt Firewall
sudo ufw enable
```

**2. SSH Hardening (Khuyên dùng):**
Chỉnh sửa file cấu hình SSH `/etc/ssh/sshd_config` để tắt đăng nhập bằng mật khẩu (chỉ cho phép dùng SSH Key) và đổi cổng SSH mặc định (ví dụ sang 2282):
```text
Port 2282
PasswordAuthentication no
PubkeyAuthentication yes
```
Sau khi sửa, khởi động lại dịch vụ SSH:
```bash
sudo systemctl restart ssh
```
*Lưu ý: Nếu đổi cổng SSH, hãy nhớ mở cổng mới trên UFW (`sudo ufw allow 2282/tcp`) trước khi khởi động lại SSH.*

## 2. Cấu hình các thông số bảo mật (Secrets)

```bash
git clone <repository-url> woodcert-auction
cd woodcert-auction
cp .env.prod.example .env.prod
chmod 600 .env.prod
```

Tạo chuỗi băm mật khẩu độc lập sử dụng BCrypt:

```bash
docker run --rm httpd:2.4-alpine htpasswd -bnBC 12 "" 'admin-password' | tr -d ':\n'
docker run --rm httpd:2.4-alpine htpasswd -bnBC 12 "" 'appraiser-password' | tr -d ':\n'
```

Đặt các chuỗi băm vừa tạo vào file `.env.prod` và bao quanh bằng dấu nháy đơn để giữ nguyên ký tự `$`:

```dotenv
ADMIN_PASSWORD_HASH='$2y$12$...'
APPRAISER_PASSWORD_HASH='$2y$12$...'
```

Tạo các mã khoá bí mật khác bằng lệnh `openssl rand -base64 48`. Hãy điền đầy đủ tất cả các giá trị còn trống trong file `.env.prod`, thiết lập tham số `APP_DOMAIN` và đảm bảo mật khẩu của tài khoản admin và appraiser (kiểm định viên) phải khác nhau.

## 3. Xác minh cấu hình và Khởi động hệ thống

*Lưu ý: Lệnh xoá dưới đây có tính chất huỷ diệt dữ liệu cũ và chỉ nên thực hiện cho lần đầu tiên deploy hệ thống mới:*

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml down -v
docker compose --env-file .env.prod -f docker-compose.prod.yml config
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Dịch vụ MySQL và Redis sẽ không được publish cổng ra ngoài internet. Backend và frontend sẽ lần lượt lắng nghe nội bộ tại địa chỉ `127.0.0.1:8080` và `127.0.0.1:3000`.

## 4. Cấu hình Nginx và chứng chỉ TLS (HTTPS)

File `nginx-proxy.conf` đã được cấu hình cho tên miền `woodauction.id.vn`:

```bash
sudo cp nginx-proxy.conf /etc/nginx/sites-available/woodcert-auction
sudo ln -sfn /etc/nginx/sites-available/woodcert-auction /etc/nginx/sites-enabled/woodcert-auction
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d woodauction.id.vn
```

Certbot sẽ tự động chỉnh sửa cấu hình Nginx để kích hoạt HTTPS và thiết lập cơ chế tự động gia hạn chứng chỉ SSL. Hãy chạy lại lệnh `sudo nginx -t` mỗi khi bạn thực hiện thay đổi cấu hình proxy thủ công.

## 5. Xác minh hoạt động của hệ thống

```bash
curl --fail http://127.0.0.1:8080/actuator/health/readiness
curl --fail http://127.0.0.1:3000/
curl --fail https://woodauction.id.vn/actuator/health/readiness
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=200 backend
```

### 5.1 Xác nhận nạp tiền VNPay Sandbox

Đồ án dùng VNPay Sandbox và không có merchant production để đăng ký IPN công khai. Vì vậy
`VNPAY_CONFIRM_ON_RETURN_ENABLED=true` được bật có chủ đích. Backend chỉ xác nhận giao dịch
sau khi kiểm tra checksum, `TmnCode`, số tiền, trạng thái giao dịch và khóa bản ghi để chống
xử lý lặp. Endpoint IPN vẫn được giữ lại tại:

```text
https://woodauction.id.vn/api/v1/wallets/vnpay/ipn
```

Nếu chuyển sang tài khoản VNPay thật, phải đăng ký IPN và đặt
`VNPAY_CONFIRM_ON_RETURN_ENABLED=false`.

Các bước kiểm tra nhanh (Smoke test) trên trình duyệt:

1. Đăng ký tài khoản mới, xác thực email, đăng nhập, tải lại trang và đăng xuất.
2. Tải thử ảnh lên hệ thống qua Cloudinary.
3. Thử nạp tiền vào ví qua cổng VNPay Sandbox và kiểm tra lịch sử ví.
4. Tạo phiên đấu giá mới, đăng ký tham gia và đấu giá thời gian thực qua kết nối WebSocket.
5. Thanh toán đơn hàng thắng cuộc, xác nhận giao hàng, xác nhận đã nhận hàng và kiểm tra số dư được thanh toán.
6. Mở và giải quyết tranh chấp (kiểm tra cả 2 trường hợp giải quyết tranh chấp).
7. Xác minh quyền quản trị của admin đối với danh mục sản phẩm, kiểm định viên, các tranh chấp, lịch sử hệ thống (audit logs) và doanh thu nền tảng.

## 6. Sao lưu dữ liệu (Backup)

### 6.1 Backup thủ công
Chạy các lệnh sau để thực hiện backup nhanh MySQL và lưu trạng thái Redis:

```bash
mkdir -p backups
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T mysql-db \
  sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "backups/mysql-$(date +%F-%H%M%S).sql"
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T redis-cache \
  sh -c 'redis-cli -a "$REDIS_PASSWORD" SAVE'
```

Chỉ thực hiện sao chép dữ liệu thư mục `/var/lib/docker/volumes` khi các dịch vụ đã được dừng hoàn toàn, hoặc sử dụng tính năng chụp ảnh phân vùng (volume snapshot) của nhà cung cấp VPS.

### 6.2 Thiết lập tự động sao lưu với Cron Job

Để tự động sao lưu dữ liệu MySQL hàng ngày vào lúc 2:00 AM và tự động dọn dẹp các bản sao lưu cũ hơn 7 ngày:

1. Tạo một script backup tại `/home/ubuntu/backup-woodcert.sh`:
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/home/ubuntu/woodcert-auction/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/mysql-$(date +%F-%H%M%S).sql"

# Chạy mysqldump từ Docker
docker compose --env-file /home/ubuntu/woodcert-auction/.env.prod -f /home/ubuntu/woodcert-auction/docker-compose.prod.yml exec -T mysql-db \
  sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "$BACKUP_FILE"
test -s "$BACKUP_FILE"

# Xóa các bản backup cũ hơn 7 ngày
find "$BACKUP_DIR" -type f -name "mysql-*.sql" -mtime +7 -delete
```

2. Cấp quyền thực thi cho script:
```bash
chmod +x /home/ubuntu/backup-woodcert.sh
```

3. Thêm script vào Crontab:
```bash
crontab -e
```
Thêm dòng dưới đây vào cuối file:
```text
0 2 * * * /home/ubuntu/backup-woodcert.sh >> /home/ubuntu/backup-woodcert.log 2>&1
```

## 7. Nâng cấp và Rollback (Khôi phục phiên bản)

```bash
git pull --ff-only
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Để khôi phục lại phiên bản cũ (rollback), hãy thực hiện checkout commit hoạt động ổn định gần nhất trên Git và build lại Docker container. Tuyệt đối **không chạy** lệnh `down -v` trong quá trình rollback vì nó sẽ làm mất dữ liệu. Việc nâng cấp database (migration) chỉ hỗ trợ tiến lên phía trước; nếu một file migration bị lỗi và cần rollback, bạn phải khôi phục lại bản sao lưu cơ sở dữ liệu MySQL đã tạo trước khi nâng cấp.
