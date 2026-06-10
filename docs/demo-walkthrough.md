# Demo walkthrough — blockchain landing page, end-to-end

Mục tiêu: người mới clone repo về, tự setup, chạy đủ 3 bước harness cho một bài toán
nhỏ — **build landing page cho một blockchain app** — và chiêm nghiệm cách harness
vận hành. Toàn bộ mất khoảng 30–60 phút, phần lớn là ngồi xem agent làm việc.

## 0. Setup

```bash
git clone <repo-url> && cd blockchain-template-harness-ai
docker info                 # Docker phải đang chạy
node --version              # >= 20
claude                      # mở Claude Code tại repo root
```

Kiểm tra harness đã nạp: gõ `/` trong Claude Code, phải thấy 3 command
`brainstorm`, `write-plan`, `team-code-feature`.

## 1. Bước 1 — `/brainstorm`

Gõ:

```
/brainstorm Build một landing page cho blockchain app tên "ChainPay": giới thiệu sản phẩm, kêu gọi người dùng đăng ký waitlist
```

**Điều sẽ xảy ra:** Claude đọc `docs/system-knowledge/` (đang greenfield) rồi hỏi bạn
theo từng round, ví dụ:

- Sections nào? (hero / features / how-it-works / roadmap / FAQ / footer)
- Waitlist là form thật (cần API + lưu email) hay chỉ nút placeholder?
- Stack? (gợi ý mặc định: Vite + React, static, không backend)
- Responsive mobile? Dark theme? Nội dung thật hay placeholder copy?

**Cách trả lời để demo gọn:** chọn mặc định được gợi ý; với waitlist nên chọn
"form thật, API nhỏ lưu vào file/SQLite" — để có cả backend cho tester pentest.

Kết quả: file `docs/superpowers/specs/spec-<date>-chainpay-landing.md`. **Hãy mở đọc**:
phần *Decisions (with user)* chính là log Q→A của bạn; *Acceptance criteria* là thứ
tester sẽ chạy từng dòng. Ưng thì trả lời "approve".

## 2. Bước 2 — `/write-plan`

```
/write-plan docs/superpowers/specs/spec-<date>-chainpay-landing.md
```

**Điều sẽ xảy ra:** Claude đọc spec + runbook + code template, rồi đề xuất plan dạng
epics → tasks, thường cỡ:

- Epic A: scaffold app (Vite+React) + Dockerfile + đăng ký docker-compose & runbook
- Epic B: các section UI (hero, features, roadmap, footer)
- Epic C: waitlist API + nối form
- Epic D: doc freshness (tạo node `docs/system-knowledge/landing/`, cập nhật system map)

Mỗi task có Files / What & How / sketch ngắn / checkbox `- [ ]` kết thúc bằng lệnh
verify. **Hãy mở file plan đọc trước khi approve** — đây là điểm neo của toàn bộ bước 3.

## 3. Bước 3 — `/team-code-feature`

```
/team-code-feature docs/superpowers/plans/plan-<date>-chainpay-landing.md
```

**Điều sẽ xảy ra (1 round):**

1. **developer** implement từng task theo plan, tick `- [x]` vào plan file, commit, merge
   `main`, rồi nhắn devops.
2. **devops** chạy `scripts/deploy-service.sh landing local` (và service API nếu tách),
   chờ healthcheck + smoke `http://localhost:3000/`, verify cả hệ thống, báo readiness.
3. Lead spawn **tester-r1** (context trắng tinh, chỉ biết plan + readiness report):
   - Level 1: curl API waitlist (email hợp lệ / rỗng / sai format / trùng / payload bẩn),
     mở Playwright bấm mọi nút, submit form, soi console, chụp screenshot.
   - Level 2: thử XSS vào field email, soi security headers, CORS, secrets trong bundle.
4. Tester thường sẽ `ISSUES FOUND` (thiếu validate, thiếu header, lỗi mobile...) → bug
   list quay về developer → round 2 với **tester-r2 mới** test lại TỪ ĐẦU.
5. Đến khi `TESTER CONFIRMED: NO ISSUES` → tự động fold docs vào knowledge tree, merge,
   tổng kết.

## 4. Chiêm nghiệm — nhìn vào đâu để đánh giá harness

| Nhìn | Thấy gì |
|---|---|
| `http://localhost:3000` | sản phẩm chạy thật |
| `docs/superpowers/specs/spec-*.md` | mọi quyết định + lý do, dạng Q→A |
| `docs/superpowers/plans/plan-*.md` | tick `- [x]` đầy đủ = tiến độ + history of work |
| round log của lead | số round, bug tìm được mỗi round, level 1 vs level 2 |
| `docs/system-knowledge/landing/` + root `architecture.md` | knowledge tree đã lớn lên sau task |
| `git log --oneline` | commit per task, message rõ ràng |
| `docker compose ps` | service healthy, có healthcheck + smoke label |

Thử thêm để thấy vòng lặp tri thức: chạy tiếp
`/brainstorm Thêm trang FAQ cho ChainPay landing` — lần này brainstorm sẽ đặt câu hỏi
dựa trên node `landing` vừa được fold vào cây, không còn hỏi kiểu greenfield nữa.

## Troubleshooting

| Vấn đề | Xử lý |
|---|---|
| `/brainstorm` không xuất hiện | Phải mở `claude` đúng tại repo root (nơi có `.claude/`). |
| Deploy fail "port already in use" | `lsof -i :3000` → tắt app đang chiếm port, hoặc cho agent đổi port (nó sẽ cập nhật runbook). |
| Tester không mở được browser | `npx playwright install chromium` một lần ở host. |
| Agent xin permission liên tục | Xem `.claude/settings.json` — thêm allow rule cho lệnh lặp lại, hoặc chạy với chế độ cho phép rộng hơn nếu bạn chấp nhận. |
| Loop chạy quá dài / tốn token | Bài demo nên giữ scope nhỏ (đó là lý do walkthrough khuyên chọn mặc định khi brainstorm). |
