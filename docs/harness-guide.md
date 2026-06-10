# Harness Guide — triết lý và cơ chế

Tài liệu này giải thích VÌ SAO harness được thiết kế như vậy. Luật vận hành nằm trong
`CLAUDE.md`; chi tiết từng bước nằm trong `.claude/commands/*.md`.

## Vấn đề harness giải quyết

Để AI code một mạch từ yêu cầu thô → code thường hỏng vì 4 lý do:

1. **Yêu cầu mơ hồ** — AI tự đoán thay vì hỏi, đoán sai thì sai cả chuỗi.
2. **Mất ngữ cảnh hệ thống** — AI không biết contract/invariant hiện có nên phá vỡ chúng.
3. **Không có điểm neo tiến độ** — session dài/đứt là mất dấu đã làm gì, còn gì.
4. **Tự chấm bài mình** — model viết code rồi tự test thì thừa hưởng đúng blind spot
   của chính nó; "tests pass" ≠ "hết bug".

Harness trả lời từng điểm: (1) brainstorm bắt buộc hỏi, (2) knowledge tree bắt buộc đọc
và bắt buộc cập nhật, (3) spec/plan là file vật lý có checkbox — history of work, (4)
tester là agent CON MỚI mỗi round, mù implementation, chỉ biết spec.

## Hai loại tài liệu — episodic vs cumulative

- `docs/superpowers/specs|plans/` — **episodic**: mỗi task một cặp file, đóng băng sau
  khi xong, là lịch sử "đã quyết gì, đã làm gì".
- `docs/system-knowledge/` — **cumulative**: cây tri thức về contract & intent của hệ
  thống hiện tại. Mỗi plan xong phải "fold" kết quả vào cây (doc-freshness epic).
  Code là truth cho implementation; cây là truth cho contract & lý do thiết kế.

Vòng đời: brainstorm ĐỌC cây để đặt câu hỏi → plan ĐỌC cây + code để đặc tả → implement
XONG thì GHI ngược vào cây. Cây càng dày, brainstorm các task sau càng sắc.

## Bước 1 — `/brainstorm` → spec

1. Lấy requirement thô của user.
2. Đọc knowledge tree, reflect: yêu cầu này chạm node nào, contract nào, invariant nào.
3. Hỏi theo round (≤5 câu/round, ưu tiên multiple-choice): câu hỏi từ chính requirement
   + câu hỏi sinh ra từ reflect cây. Sau mỗi round trả lời, reflect lại → hỏi tiếp hoặc dừng.
4. Chốt approach (2–3 phương án, trade-off, user chọn).
5. Viết `spec-<date>-<slug>.md`: Problem, **Decisions (with user)** — log Q→A đầy đủ,
   Chosen approach, Scope in/out, Affected nodes, **Acceptance criteria** (tester sẽ chạy
   đúng từng dòng này), Open questions. User approve thì mới sang bước 2.

Spec trả lời WHAT + WHY. Không chứa file path, tên hàm, code.

## Bước 2 — `/write-plan` → plan

1. Đọc spec + các node cây liên quan + **code thật** (verify convention bằng file thật,
   không tin trí nhớ — ghi rõ "Conventions verified in code" kèm path đã check).
2. Bổ nhỏ: epics → tasks (mỗi task xong-trong-một-phiên). Mỗi task có: **Files**,
   **What & How** (3–10 dòng đặc tả kỹ thuật), 1 sketch ngắn (code/config ≤25 dòng) nếu
   cần khử mơ hồ, và **Steps** dạng `- [ ]` kết thúc bằng bước verify CHẠY ĐƯỢC.
3. Epic cuối luôn là doc-freshness (cập nhật cây + đăng ký service mới).
4. Plan là **điểm neo**: bước 3 thực thi theo nó và tick `- [x]` trực tiếp vào file —
   vừa là tiến độ sống, vừa là history of work. User approve thì mới sang bước 3.

## Bước 3 — `/team-code-feature` → loop dev/devops/test

Team lead (session chính) chỉ điều phối, không tự code/deploy/test. 3 vai:

| Vai | Nhiệm vụ | Không được làm |
|---|---|---|
| **Developer** | implement theo plan order, tick checkbox, commit/merge/push, fix bug từ tester | tự deploy, tự test môi trường đã deploy |
| **DevOps** | `scripts/deploy-service.sh <svc> local`, verify TOÀN BỘ hệ thống healthy, fix lỗi infra | sửa code app (lỗi code → trả về dev kèm logs) |
| **Tester** | test 2 level từ spec/plan, báo bug reproducible | sửa bất cứ thứ gì |

**Một round** = Developer → DevOps → Tester. Luật quan trọng nhất:

- **Tester mới tinh mỗi round** (`tester-r1`, `tester-r2`, ...). Dev giữ nguyên (giữ ngữ
  cảnh code), tester thì không bao giờ reuse — context sạch, mù implementation, test lại
  từ đầu toàn bộ matrix. Spawn prompt của tester CHỈ chứa: plan path + báo cáo readiness
  của DevOps + (round ≥2) bug list cũ để re-verify. Không đưa note của dev vào.
- **Tư duy tester: tìm càng nhiều bug càng tốt.** Round mà rubber-stamp nhanh là round
  thất bại. 2 level:
  - **Level 1 — user e2e khách quan**: gọi API như client thật (happy/error/edge:
    auth sai, payload bẩn, boundary, idempotency, concurrent), mở browser thật
    (Playwright) bấm mọi nút, submit form valid + invalid, soi console.
  - **Level 2 — pentest** (trên chính deployment local của team): authz bypass, IDOR,
    SQLi/XSS/path traversal, security headers, CORS, secrets lộ trong bundle/response,
    rate limiting.
- Verdict chỉ có 2 giá trị: `ISSUES FOUND` (kèm bug list → quay lại dev, round mới) hoặc
  `TESTER CONFIRMED: NO ISSUES` (kèm matrix đã chạy → thoát loop). Bất kỳ commit nào sau
  verdict làm verdict vô hiệu → deploy lại + tester mới.

Thoát loop xong (tự động, không hỏi user): fold kết quả vào knowledge tree → merge/push
→ tổng kết cho user (số round, bug theo level, entry points).

## Mở rộng

- **Thêm môi trường** (staging/prod): runbook → script → CLAUDE.md, theo mục cuối của
  `docs/system-knowledge/platform/infra/runbook.md`.
- **Stack khác** (Java/Go/Python): chỉ cần service có Dockerfile + healthcheck + smoke
  label là toàn bộ harness chạy y nguyên.
- **Initiative dài nhiều spec**: viết recap vào `docs/superpowers/context/` để session
  sau (hoặc máy khác) nạp lại ngữ cảnh.
