# ChainPay — SRS (root)

## Purpose

ChainPay is a crypto payment gateway ("Stripe for crypto") that lets merchants accept
crypto & stablecoin payments online. This repo currently ships its **pre-launch marketing
site**: a Vietnamese landing page that introduces the product and captures pre-launch
demand through an email waitlist. No real payment functionality exists yet — this is a
marketing + demand-capture system only.

## Actors & Consumers

- **Anonymous visitor** — a prospective merchant browsing the landing page in Vietnamese,
  optionally joining the waitlist with their email.

## Use Cases

### UC-1: Join the waitlist
A visitor submits their email on the landing page; the system stores it uniquely and
acknowledges (new vs already-registered). See [waitlist SRS](waitlist/srs.md) UC-1.

### UC-2: View signup count (social proof)
The landing page displays the public total number of unique signups. See
[waitlist SRS](waitlist/srs.md) UC-2.

## Business Rules

- BR-1: Waitlist emails are unique (one signup per normalized email).
- BR-2: All user-facing copy is Vietnamese.
- BR-3: Only the aggregate signup count is public; individual signups are never exposed.

## Out of Scope

- Real payments, wallets, merchant onboarding (pre-launch marketing only).
- Email confirmation/SMTP, admin UI, analytics, bilingual toggle.
- Any environment beyond local Docker Compose.

## Related

- Conventions: [_meta/conventions.md](_meta/conventions.md)
- Architecture: [architecture.md](architecture.md)
- Services: [landing SRS](landing/srs.md) · [waitlist SRS](waitlist/srs.md)
