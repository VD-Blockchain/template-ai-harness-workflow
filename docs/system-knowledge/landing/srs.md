# landing — SRS

## Purpose

The `landing` service is ChainPay's pre-launch marketing site: a single, responsive,
Vietnamese-language page that introduces the crypto payment gateway and captures demand
via an email-only waitlist form. It is content + form only; all persistence lives in the
`waitlist` service.

## Actors & Consumers

- **Anonymous visitor** — a prospective merchant browsing in Vietnamese; reads the page and
  optionally submits an email.
- Downstream: calls the `waitlist` API (same-origin via nginx reverse-proxy) — never a DB.

## Use Cases

### UC-1: View the landing page
- **Trigger:** `GET http://localhost:3000/`.
- **Main flow:** nginx serves the static Vite build (SPA fallback to `index.html`).
- **Outcome:** 200; renders Hero+CTA, Value, Features (4), HowItWorks (3), Waitlist, Footer
  — all copy in Vietnamese; usable at ≈375px with no horizontal scroll.

### UC-2: Submit the waitlist form
- **Trigger:** visitor enters an email and submits the Waitlist form.
- **Main flow:** client validates (`type=email` + JS `isEmail`); on pass, `POST /api/waitlist`.
- **Outcome:** success state for `created`, "đã đăng ký" style state for `already_registered`,
  inline error for invalid input or a non-2xx response. The displayed signup count refreshes.

## Business Rules

- **BR-1:** all user-facing copy is Vietnamese (no bilingual toggle).
- **BR-2:** client-side validation gates obviously-bad input, but the server is authoritative
  (the form never assumes its own check is sufficient).
- **BR-3:** the browser only ever talks to `landing` on port 3000 (same-origin); the API is
  reached through nginx, so there is no CORS.

## Out of Scope

- No real product functionality (payments/wallets/onboarding) — marketing page only.
- No analytics/tracking, no CMS, no auth.

## Related

- Parent: [root SRS](../srs.md)
- Architecture: [architecture.md](architecture.md)
- Peer: [waitlist SRS](../waitlist/srs.md)
