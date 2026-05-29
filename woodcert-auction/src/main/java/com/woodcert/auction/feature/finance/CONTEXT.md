# Finance - Implementation Context
> Updated: 2026-05-28 | Session: wallet-vnpay-ipn-authoritative

## Business Context
`finance` là module ví nội bộ của WoodCert Auction. Phạm vi hiện tại gồm số dư ví, audit log giao dịch ví, idempotent wallet operations, lịch sử nạp tiền VNPay và tích hợp VNPay Sandbox cho luồng nạp tiền.

## Locked Rules
1. Mỗi user có đúng một ví; lazy creation khi truy cập lần đầu.
2. Mọi mutation số dư thành công phải tạo đúng một hàng trong `wallet_transactions`.
3. Các wallet mutation nội bộ (`depositFunds`, `freezeFunds`, `unfreezeFunds`, `deductFrozenFunds`) idempotent theo `operationKey`.
4. Số tiền được chuẩn hóa về scale 2, HALF_UP một lần duy nhất trước khi validate, so sánh idempotency và lưu DB.
5. `freeze` chuyển tiền từ `available_balance` sang `frozen_balance`.
6. `unfreeze` chuyển tiền từ `frozen_balance` về `available_balance`.
7. `deductFrozen` trừ thẳng từ `frozen_balance`, ghi transaction `PAYMENT`.
8. `WalletTransaction.amount` là delta có dấu trên available balance:
   - `DEPOSIT` dương
   - `FREEZE` âm
   - `UNFREEZE` dương
   - `PAYMENT` âm
9. `wallet_operations` theo dõi các business command idempotent với vòng đời `PENDING -> SUCCESS/FAILED`.
10. Operation `FAILED` là terminal; retry phải dùng `operationKey` mới.
11. Operation `PENDING` quá hạn `finance.wallet.operation.pending-timeout` bị đánh dấu `FAILED`.
12. `WalletTransactionStatus.PENDING/FAILED` được giữ lại cho các luồng thanh toán mở rộng; wallet mutation nội bộ đang ghi transaction `SUCCESS`.

## Public API
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/wallets/me` | Authenticated | Lấy số dư ví hiện tại |
| GET | `/api/v1/wallets/me/transactions` | Authenticated | Lấy lịch sử giao dịch ví |
| GET | `/api/v1/wallets/me/deposits` | Authenticated | Lấy lịch sử nạp tiền VNPay |
| GET | `/api/v1/wallets/me/deposits/{txnRef}` | Authenticated | Lấy trạng thái một giao dịch VNPay |
| POST | `/api/v1/wallets/me/deposit` | Authenticated | Tạo giao dịch nạp tiền và URL thanh toán VNPay |
| GET | `/api/v1/wallets/vnpay/return` | Public | VNPay redirect người dùng về sau thanh toán |
| GET | `/api/v1/wallets/vnpay/ipn` | Public | VNPay IPN server-to-server callback |

## Internal Service Contract
- `depositFunds(userId, operationKey, amount, referenceId, referenceType)`
- `freezeFunds(userId, operationKey, amount, referenceId, referenceType)`
- `unfreezeFunds(userId, operationKey, amount, referenceId, referenceType)`
- `deductFrozenFunds(userId, operationKey, amount, referenceId, referenceType)`

Các method này là contract trực tiếp cho các phase auction-runtime.

## VNPay Integration
- Luồng: FE → `POST /wallets/me/deposit` → backend tạo `vnpay_deposits(PENDING)` và URL VNPay → user thanh toán → VNPay gọi IPN + redirect Return URL.
- IPN cập nhật `vnpay_deposits`, dùng pessimistic lock theo `txnRef`, validate checksum/TmnCode/amount/status và cộng tiền ví bằng operation key `vnpay:{txnRef}`.
- Return URL verify checksum và redirect FE; FE polling `GET /wallets/me/deposits/{txnRef}` để hiển thị kết quả.
- Local/dev có thể bật `vnpay.confirm-on-return-enabled=true` để Return URL localhost xác nhận giao dịch khi không có public IPN callback. Production phải để tắt và dùng IPN.
- Checksum: HMAC-SHA512 theo chuẩn VNPay 2.1.0.
- Config prefix `vnpay:` gồm `tmn-code`, `hash-secret`, `pay-url`, `return-url`, `api-url`, `fe-return-url`, `confirm-on-return-enabled`.

## Current Alignment
- Finance tích hợp với auction registration (freeze) và close settlement (deduct/unfreeze).
- VNPay deposit có API tạo giao dịch, callback IPN/Return, history và status polling.
- Wallet reads được FE header balance và trang `/wallet` sử dụng.
- Withdraw, thanh toán phần còn lại đơn hàng, seller payout và dispute escrow thuộc phase fulfillment/payment.
