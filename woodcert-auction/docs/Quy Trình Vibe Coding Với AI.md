# Quy Trình Vibe Coding Với AI

> Hướng dẫn từ A → Z cho dự án HOIDANIT-SPRING-REST-WITH-AI.
> Áp dụng cho Claude Code, Cursor, hoặc bất kỳ AI coding tool nào.

---

## Cấu Trúc Đã Setup

```
project-root/
├── CLAUDE.md                          # Entry point — AI đọc file này đầu tiên
│
├── .claude/commands/                  # Các lệnh tắt cho AI
│   ├── start.md                       # Mở đầu session
│   ├── new-feature.md                 # Tạo feature mới
│   ├── write-tests.md                 # Viết test cho code có sẵn
│   ├── write-context.md              # Viết CONTEXT.md cho module
│   ├── review-pr.md                   # Review code
│   └── update-status.md              # Cập nhật tiến độ cuối session
│
├── docs/
│   ├── PROJECT-RULES.md              # Convention, naming, patterns
│   ├── PROJECT-STATUS.md             # Tiến độ hiện tại
│   ├── ARCHITECTURE.md               # Kiến trúc hệ thống
│   ├── DATABASE.md                    # Schema, relationships
│   ├── API_SPEC.md                    # Endpoints specification
│   └── decisions/                     # Architecture Decision Records
│       └── ADR-001_refresh_token_strategy.md, ...
│
└── src/                               # Source code
```

---

## Nguyên Tắc Cốt Lõi

```
1. Đầu session đọc docs, cuối session update docs
2. Hiểu trước, code sau — đọc CONTEXT.md trước khi sửa module
3. ADR trước, implement sau — ghi quyết định trước khi code
4. Không merge code không hiểu — AI viết, người review
5. Test đi kèm code — không có test = chưa xong
```

---

## Flow Tổng Quan

```
 /start                                              /update-status
    │                                                       │
    ▼                                                       ▼
┌────────┐    ┌──────────┐    ┌────────┐    ┌─────────┐    ┌────────┐
│  Đọc   │───▶│  Xác nhận │───▶│  Làm   │───▶│ Review  │───▶│  Đóng  │
│ context │    │   task    │    │  việc  │    │  + Test │    │session │
└────────┘    └──────────┘    └────────┘    └─────────┘    └────────┘
```

---

## Quy Trình Chi Tiết

### ═══════════════════════════════════════
### PHASE 1: MỞ SESSION
### ═══════════════════════════════════════

```
Bạn:  /start
```

AI sẽ tự động:
1. Đọc `CLAUDE.md` → biết project là gì
2. Đọc `PROJECT-STATUS.md` → biết đang ở đâu
3. Tóm tắt lại cho bạn: đã xong gì, đang dở gì, cảnh báo gì, task tiếp theo
4. Chờ bạn xác nhận

```
AI:   "Session trước đã xong User CRUD + test.
       Đang dở: Company CRUD — chưa viết test.
       Cảnh báo: CI flaky ở test concurrent payment.
       Đề xuất: hoàn thành Company test, sau đó làm Role CRUD."

Bạn:  "Ok, làm Company test trước"
      hoặc
      "Không, hôm nay fix bug auth trước"
```

**Tại sao phải làm bước này?**
AI không có memory giữa các session. Bỏ bước này = AI code mù, không biết convention, không biết context → tốn token sửa sai gấp 10 lần.

---

### ═══════════════════════════════════════
### PHASE 2: LÀM VIỆC
### ═══════════════════════════════════════

Tùy loại task, chọn đúng workflow:

---

#### WORKFLOW A — Tạo Feature Mới

Khi nào: thêm module CRUD mới (Company, Role, Permission...)

```
Bạn:  /new-feature — tạo Company CRUD
```

AI sẽ thực hiện theo thứ tự:

```
Step 1: Đọc docs
        ├── PROJECT-RULES.md  → convention
        ├── DATABASE.md       → schema của Company
        └── API_SPEC.md       → endpoints cần implement

Step 2: Scaffold package
        feature/company/
        ├── Company.java
        ├── CompanyController.java
        ├── CompanyService.java
        ├── CompanyServiceImpl.java
        ├── CompanyRepository.java
        └── dto/
            ├── CreateCompanyRequest.java
            ├── UpdateCompanyRequest.java
            └── CompanyResponse.java

Step 3: Implement (theo thứ tự)
        Entity → Repository → DTOs → Service Interface
        → ServiceImpl → Controller

Step 4: Viết test
        ├── CompanyServiceImplTest.java    (unit test)
        └── CompanyControllerTest.java     (integration test)

Step 5: Update docs
        ├── API_SPEC.md     (nếu endpoint mới)
        ├── DATABASE.md     (nếu schema mới)
        └── CONTEXT.md      (viết cho module mới)
```

**Sau mỗi step, bạn nên review trước khi AI làm step tiếp.**
Đừng để AI chạy hết 5 step rồi mới review — nếu step 1 sai, tất cả sau đó đều sai.

```
Bạn:  "Viết entity Company trước, tôi review"
AI:   [viết Company.java]
Bạn:  "Ok, tiếp DTOs"
AI:   [viết DTOs]
Bạn:  "CompanyResponse thiếu field logo, thêm vào"
AI:   [sửa]
Bạn:  "Ok, tiếp service"
...
```

---

#### WORKFLOW B — Fix Bug

Khi nào: có lỗi cần sửa trong code đã có

```
Bạn:  "Đọc CONTEXT.md của auth module, sau đó fix lỗi:
       refresh token không bị revoke khi delete user"
```

AI sẽ:

```
Step 1: Đọc CONTEXT.md
        → hiểu design decisions, known limitations, trade-offs
        → tránh "fix" thứ là intentional

Step 2: Phân tích bug
        → trace từ symptom → root cause
        → xác nhận đây là bug thật, không phải trade-off đã biết

Step 3: Đề xuất fix
        → giải thích cách fix
        → chờ bạn confirm trước khi code

Step 4: Implement fix
        → scope nhỏ nhất có thể
        → không refactor thêm thứ không liên quan

Step 5: Viết test cover bug
        → test case cho đúng case bị lỗi
        → đảm bảo bug không quay lại

Step 6: Update docs
        → CONTEXT.md: thêm entry Refactor Log
        → PROJECT-STATUS.md: ghi lại bug đã fix
```

**Quan trọng: luôn bảo AI đọc CONTEXT.md trước khi sửa.** Không có bước này, AI có thể "fix" một thứ mà team đã cố tình thiết kế như vậy.

---

#### WORKFLOW C — Viết Test Cho Code Có Sẵn

Khi nào: code đã viết nhưng chưa có test

```
Bạn:  /write-tests — viết test cho company module
```

AI sẽ:

```
Step 1: Đọc source code
        → entity, service, serviceImpl, controller, DTOs
        → đọc CONTEXT.md (nếu có) để hiểu edge cases

Step 2: Viết Unit Test — CompanyServiceImplTest.java
        → mock repository + dependencies
        → test mỗi method: success + error cases
        → create: success, duplicate, not found (related entity)
        → getById: found, not found
        → update: success, not found, conflict
        → delete: success, not found

Step 3: Viết Integration Test — CompanyControllerTest.java
        → full HTTP flow với MockMvc
        → test mỗi endpoint: success + validation + 404 + 401
        → verify response format (statusCode, data, message)

Step 4: Chạy test
        → đảm bảo all pass
        → không break test cũ
```

---

#### WORKFLOW D — Thêm Logic Vào Feature Có Sẵn

Khi nào: feature đã có, cần thêm chức năng (vd: thêm search, filter, export...)

```
Bạn:  "Đọc CONTEXT.md của user module.
       Thêm chức năng search user theo name và email"
```

AI sẽ:

```
Step 1: Đọc CONTEXT.md → hiểu thiết kế hiện tại
Step 2: Đề xuất cách implement → bạn confirm
Step 3: Implement đúng pattern hiện tại (không tự ý đổi pattern)
Step 4: Viết test cho logic mới
Step 5: Update API_SPEC.md (query params mới)
Step 6: Update CONTEXT.md (thêm Refactor Log)
```

---

#### WORKFLOW E — Quyết Định Kiến Trúc

Khi nào: cần chọn giữa nhiều cách tiếp cận (vd: cách lưu file, cách handle cache...)

```
Bạn:  "Tôi cần thêm upload avatar cho user. Nên lưu ở đâu?"
```

**Luôn theo thứ tự: phân tích → quyết định → ghi ADR → rồi mới code.**

```
Step 1: AI phân tích options (local storage vs S3 vs database)
Step 2: So sánh pros/cons cho từng option
Step 3: Bạn chọn
Step 4: AI viết ADR → docs/decisions/002-file-upload-strategy.md
Step 5: Rồi mới implement
```

**Không bao giờ code trước, ghi lý do sau.** Lúc code xong rồi sẽ quên tại sao chọn cách đó.

---

#### WORKFLOW F — Review Code

Khi nào: trước khi commit/merge

```
Bạn:  /review-pr
```

AI sẽ check:

```
Architecture    → controller chỉ gọi service, không có logic?
DTOs            → entity không lộ ra ngoài?
DI              → constructor injection, không @Autowired?
Error handling  → custom exception, không try/catch trong controller?
Security        → không hardcode secret, không log password?
JPA             → LAZY fetch, @Transactional, Optional?
Code quality    → file < 300 lines, method < 50 lines?
Convention      → đúng naming theo PROJECT-RULES?
Docs            → CONTEXT.md, API_SPEC updated?
Tests           → có test cho happy path + error cases?
```

Output:
```
🔴 Blockers    — phải fix trước khi merge
🟡 Suggestions — nên fix nhưng không chặn
🟢 Good parts  — điểm tốt, giữ nguyên
```

---

### ═══════════════════════════════════════
### PHASE 3: ĐÓNG SESSION
### ═══════════════════════════════════════

```
Bạn:  /update-status
```

AI sẽ tự động cập nhật `PROJECT-STATUS.md`:

```
- Chuyển task xong → "Completed" (kèm ngày)
- Task dang dở → "In Progress" (ghi rõ đến đâu)
- Bug phát hiện → "Deferred Issues" (kèm priority)
- Cảnh báo → "Warnings"
- Sắp xếp lại "Next Tasks"
- Tăng session number
```

Sau đó **commit tất cả**:

```bash
git add .
git commit -m "feat: add company CRUD + tests

- Company entity, service, controller, repository
- Unit tests (8 cases) + integration tests (12 cases)
- Updated API_SPEC.md, DATABASE.md
- Added CONTEXT.md for company module"
```

**Commit code và docs cùng lúc.** Docs không đi kèm code = docs sẽ lỗi thời.

---

## Bảng Tham Chiếu Nhanh

### Commands

| Lệnh | Khi nào | Làm gì |
|-------|---------|--------|
| `/start` | Đầu mỗi session | Đọc context, tóm tắt tiến độ |
| `/new-feature` | Tạo module CRUD mới | Scaffold + implement + test + docs |
| `/write-tests` | Code có sẵn chưa có test | Viết unit test + integration test |
| `/write-context` | Module mới hoặc logic quan trọng | Tạo CONTEXT.md snapshot |
| `/review-pr` | Trước khi commit | Check code theo checklist |
| `/update-status` | Cuối mỗi session | Cập nhật PROJECT-STATUS.md |

### Câu lệnh thường dùng

| Bạn muốn | Nói với AI |
|-----------|-----------|
| Bắt đầu ngày mới | `/start` |
| Tạo feature mới | `/new-feature — tạo [tên] CRUD` |
| Fix bug | `Đọc CONTEXT.md của [module], fix lỗi [mô tả]` |
| Thêm logic | `Đọc CONTEXT.md của [module], thêm [chức năng]` |
| Viết test | `/write-tests — viết test cho [module]` |
| Quyết định kiến trúc | `Tôi cần [yêu cầu], nên dùng cách nào?` |
| Review | `/review-pr` |
| Kết thúc ngày | `/update-status` |

### Khi AI làm sai

| Tình huống | Cách xử lý |
|-----------|-----------|
| Code sai convention | `Đọc lại PROJECT-RULES.md section [X], sửa lại` |
| Sửa nhầm trade-off | `Đọc CONTEXT.md, phần Known Limitations. Đây là intentional` |
| Code quá phức tạp | `Đơn giản hóa. File không quá 300 dòng, method không quá 50` |
| Không hiểu yêu cầu | `Dừng lại, hỏi tôi trước khi code tiếp` |
| Bỏ qua test | `Chưa xong. Viết test theo /write-tests` |
| Quên update docs | `Chạy /update-status và update [file] trước khi commit` |

---

## Ví Dụ Session Thực Tế

```
╔══════════════════════════════════════════════════╗
║  SESSION #5 — Thứ 3, 04/03/2026                 ║
╚══════════════════════════════════════════════════╝

Bạn:  /start

AI:   "Đã đọc context.
       ✅ Completed: User CRUD + tests, Company CRUD + tests
       🔧 In progress: không có
       ⚠️ Warning: CI flaky ở concurrent test
       📋 Next: Role CRUD
       Bạn muốn làm Role CRUD?"

Bạn:  "Đúng, bắt đầu Role CRUD"

Bạn:  /new-feature — tạo Role CRUD

AI:   [đọc docs → scaffold package]
      "Tôi đã tạo cấu trúc package cho Role.
       Bắt đầu viết Entity. Role có ManyToMany với
       Permission (theo DATABASE.md). Confirm?"

Bạn:  "Ok"

AI:   [viết Role.java entity]

Bạn:  "Ok, tiếp"

AI:   [viết Repository → DTOs → Service → Controller]

Bạn:  "Review nhanh controller"

AI:   [review → không có blocker]

Bạn:  "Viết test"

AI:   [viết RoleServiceImplTest + RoleControllerTest]
      "Đã viết 8 unit tests + 14 integration tests. All pass."

Bạn:  "Viết CONTEXT.md cho role module"

Bạn:  /write-context

AI:   [tạo feature/role/CONTEXT.md]

Bạn:  /update-status

AI:   [cập nhật PROJECT-STATUS.md]
      "Updated: Role CRUD → Completed. Next: Permission CRUD."

Bạn:  git add . && git commit -m "feat: add role CRUD + tests"

╔══════════════════════════════════════════════════╗
║  HẾT SESSION #5                                 ║
╚══════════════════════════════════════════════════╝
```