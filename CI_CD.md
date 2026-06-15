# CI/CD cho WoodCert Auction

Tài liệu này mô tả pipeline GitHub Actions cho repository public
`duynguyen312004/woodcert-auction`.

## Luồng triển khai

1. Mọi Pull Request và push vào `main` chạy workflow `CI`.
2. CI kiểm thử backend, frontend, Playwright, deployment script, Compose và hai Docker image.
3. Push vào `main` chỉ được phát hành khi toàn bộ CI đạt.
4. Hai image được build trên GitHub và đẩy lên GHCR với tag là full commit SHA.
5. Job production chờ phê duyệt của GitHub Environment `production`.
6. VPS pull image, backup MySQL, thay backend/frontend và chạy healthcheck.
7. Nếu healthcheck thất bại, script tự đưa backend/frontend về image đang chạy trước đó.

Production không nhận secret ứng dụng từ GitHub. File `.env.prod` tiếp tục chỉ nằm trên VPS.

## GitHub Environment

Tạo environment tên `production` và giới hạn deployment branch là `main`.
Environment phải yêu cầu phê duyệt trước khi job deploy bắt đầu. Với repository một người,
cho phép repository owner tự phê duyệt.

Environment variables:

```text
PROD_HOST=103.72.57.42
PROD_PORT=22
PROD_USER=deploy
PROD_APP_DIR=/home/deploy/woodauction-app
PROD_DOMAIN=woodauction.id.vn
```

Environment secrets:

```text
PROD_SSH_PRIVATE_KEY=<private key riêng của GitHub Actions>
PROD_SSH_KNOWN_HOSTS=<dòng known_hosts Ed25519 đã xác minh>
```

Tạo repository variable `CD_ENABLED=false` trong lúc bootstrap. Chỉ đổi thành
`CD_ENABLED=true` sau khi environment variables, hai secrets và visibility của cả hai package
GHCR đã hoàn tất. Nếu biến thiếu hoặc khác `true`, job production luôn bị bỏ qua.

Không dùng private key SSH cá nhân. Fingerprint Ed25519 hiện tại của VPS phải là:

```text
SHA256:kR2W9s69sEJKDehP1VgA96XphTmAMgvfXPYIqwG9u3c
```

## GitHub Container Registry

Workflow tạo hai package:

```text
ghcr.io/duynguyen312004/woodcert-auction-backend
ghcr.io/duynguyen312004/woodcert-auction-frontend
```

Sau lần publish đầu tiên, đặt visibility của cả hai package thành `Public`. Image không chứa
`.env.prod`; toàn bộ production credential chỉ được truyền khi container chạy.

Production luôn deploy tag full SHA. Tag `main` chỉ dùng để quan sát và không được dùng làm
deployment target.

## Bảo vệ nhánh main

Tạo GitHub Ruleset cho `main`:

- Bắt buộc Pull Request.
- Số approval yêu cầu là `0`.
- Bắt buộc status check `CI gate`.
- Yêu cầu branch được cập nhật trước khi merge.
- Yêu cầu resolve conversation.
- Bật linear history.
- Chặn force push và xóa branch.
- Chỉ repository owner được bypass khi xử lý sự cố.

Chỉ bật required check sau khi workflow `CI` đã chạy ít nhất một lần để GitHub nhận diện tên
`CI gate`.

## An toàn production

Deployment dừng trước khi thay container nếu:

- Worktree production không sạch.
- `.env.prod` thiếu hoặc không có mode `600`.
- Còn dưới 5 GiB dung lượng đĩa.
- Image không tồn tại hoặc label revision không khớp commit.
- Target không thuộc lịch sử `origin/main`.
- Deploy bình thường không nhắm đúng HEAD mới nhất của `main`.
- Có phiên đấu giá ở trạng thái `ACTIVE`.
- Backup MySQL rỗng hoặc không có completion marker.

Không workflow nào chạy `docker compose down`, `down -v`, xóa volume hay tự restore MySQL.
Migration phải tương thích ngược ít nhất một phiên bản ứng dụng.

## Deploy và rollback thủ công

Workflow `Release production` hỗ trợ `workflow_dispatch` với:

- `operation=deploy`: redeploy image của một commit đã được publish.
- `operation=rollback`: chạy image cũ đã có trên GHCR hoặc fallback image còn lưu trên VPS.
- `target_sha`: full 40-character SHA thuộc lịch sử `main`.

Mọi lần chạy thủ công vẫn phải qua phê duyệt environment production.

Nếu cả deploy lẫn rollback tự động không healthy:

1. Không restore database tự động.
2. Đọc artifact/log của workflow.
3. SSH vào VPS và kiểm tra `docker compose ps`.
4. Kiểm tra `.deploy/deployment-history.log` và `.deploy/running-sha`.
5. Dùng workflow rollback tới commit thành công gần nhất hoặc vận hành thủ công theo `DEPLOY.md`.
