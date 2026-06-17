# template-harness-ai-workflow

Boilerplate **AI delivery harness** cho Claude Code: mọi feature / bug / enhancement đi
qua 3 bước chuẩn hoá bằng slash command, với artifact rõ ràng ở từng bước và một team
agent (Developer → DevOps → Tester) tự loop đến khi sạch bug.

```
┌─────────────────────────────────────────────────────────────────────┐
│  /brainstorm "<yêu cầu>"                                            │
│     hỏi đáp làm rõ + reflect knowledge tree                         │
│     → docs/superpowers/specs/spec-<date>-<slug>.md   (user approve) │
├─────────────────────────────────────────────────────────────────────┤
│  /write-plan <spec>                                                 │
│     epics → tasks (mỗi task: files + đặc tả + sketch + verify)      │
│     → docs/superpowers/plans/plan-<date>-<slug>.md   (user approve) │
├─────────────────────────────────────────────────────────────────────┤
│  /team-code-feature <plan>                                          │
│     loop: Developer → DevOps (deploy local) → Tester-r<N> (mới 100%)│
│     Tester 2 level: (1) user e2e khách quan  (2) pentest            │
│     lặp đến khi TESTER CONFIRMED: NO ISSUES                         │
│     → code merged + plan tick hết + knowledge tree được cập nhật    │
└─────────────────────────────────────────────────────────────────────┘
```

## Cấu trúc repo

```
.claude/
  commands/   brainstorm.md, write-plan.md, team-code-feature.md   ← 3 bước của harness
  agents/     harness-developer.md, harness-devops.md, harness-tester.md
  skills/     harness-devops/SKILL.md
docs/
  harness-guide.md          ← triết lý + giải thích chi tiết 3 bước (đọc đầu tiên)
  demo-walkthrough.md       ← chạy thử end-to-end: blockchain landing page
  superpowers/
    specs/                  ← spec-<date>-<slug>.md (history of work, bước 1)
    plans/                  ← plan-<date>-<slug>.md (anchor thực thi, bước 2-3)
    context/                ← recap cross-session cho initiative dài hơi
  system-knowledge/         ← knowledge tree: contracts & intent (cumulative)
    _meta/conventions.md    ← template srs.md / architecture.md cho node mới
    platform/infra/runbook.md  ← single source of truth về ops/deploy local
scripts/
  deploy-service.sh         ← deploy 1 service lên môi trường local (docker compose)
CLAUDE.md                   ← luật của repo mà mọi agent phải theo
```

## Các nhánh (Branches)

- **`main`**: Chứa phần boilerplate code thuần túy, là điểm khởi đầu cho một dự án mới.
- **`done-harness`**: Chứa kết quả hoàn chỉnh sau khi chạy thành công toàn bộ ví dụ mẫu trong `demo-walkthrough`. Bạn có thể tham khảo nhánh này để xem ví dụ thực tế một dự án đã được AI harness xử lý sẽ trông như thế nào.

## Yêu cầu

- [Claude Code](https://claude.com/claude-code) (CLI hoặc desktop app)
- **Superpowers framework** (plugin của Claude Code) — xem mục cài đặt bên dưới
- Docker Desktop (hoặc docker engine + compose v2)
- Node.js ≥ 20 (cho frontend demo + Playwright)
- git

## Cài đặt Superpowers framework (BẮT BUỘC — làm trước tiên)

Harness này được xây trên **Superpowers** — bộ plugin skill cho Claude Code. Các agent
(Developer / DevOps / Tester) gọi trực tiếp skill `superpowers:test-driven-development`
và `superpowers:systematic-debugging`, và `.claude/settings.json` của repo đã khai báo
bật sẵn plugin `superpowers`. **Bạn phải cài plugin này TRƯỚC khi chạy bất kỳ lệnh
`/brainstorm`, `/write-plan`, `/team-code-feature` nào** — nếu thiếu, agent sẽ không có
skill và flow sẽ chạy sai.

Mở Claude Code tại repo root, rồi chạy 2 lệnh sau (chỉ cần làm một lần cho mỗi máy):

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Kiểm tra đã cài thành công:

```
/plugin
```

→ trong danh sách phải thấy `superpowers` ở trạng thái **enabled**. Nếu Claude Code hỏi
restart, hãy khởi động lại. Chỉ khi bước này xong mới chuyển sang Quickstart bên dưới.

> [!NOTE]
> Vì `.claude/settings.json` đã bật sẵn plugin, lần đầu mở repo Claude Code có thể tự
> nhắc bạn enable `superpowers` — chấp nhận lời nhắc đó cũng tương đương 2 lệnh trên.

## Quickstart (5 phút)

```bash
git clone <repo-url> && cd template-harness-ai-workflow
docker info        # docker phải đang chạy
claude             # mở Claude Code tại repo root
```

> [!IMPORTANT]
> Chưa cài Superpowers? Quay lại mục **Cài đặt Superpowers framework** ở trên và cài xong
> trước khi chạy các lệnh dưới đây.

Trong Claude Code, chạy thử flow đầu tiên:

```
/brainstorm Build một landing page cho blockchain app: hero, features, roadmap, footer
```

→ trả lời các câu hỏi → approve spec → `/write-plan <spec>` → approve plan →
`/team-code-feature <plan>` → mở http://localhost:3000 chiêm nghiệm kết quả.

> [!TIP]
> **Lưu ý:** Lệnh `/team-code-feature` nên được chạy trong **tmux** để có thể nhìn thấy được các agent riêng lẻ đang làm việc ở các pane khác nhau và có thể chat với từng agent teammate nếu cần.

**Hướng dẫn từng bước chi tiết (nên đọc lần đầu): [docs/demo-walkthrough.md](docs/demo-walkthrough.md)**

## Dùng cho dự án thật

1. Clone template, đổi tên repo.
2. Sửa header `CLAUDE.md` (mô tả hệ thống), giữ nguyên phần luật.
3. Hệ thống lớn dần thì knowledge tree tự lớn theo (doc-freshness epic của mỗi plan).
4. Thêm môi trường staging/prod: làm theo mục "Adding a new environment" trong
   `docs/system-knowledge/platform/infra/runbook.md`.

Đọc thêm: [docs/harness-guide.md](docs/harness-guide.md)
