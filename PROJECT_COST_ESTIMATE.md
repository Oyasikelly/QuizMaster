# QuizMaster — Running Cost Estimate

**Prepared:** October 2026
**Covers:** Domain name, hosting, database, email notifications, and ongoing maintenance for the QuizMaster quiz platform, as it scales to serve RCCG Region 70's provinces, zones, areas and parishes.

---

## Where things stand today

The app is fully built and currently running on **free hosting tiers** while it's being tested and expanded. It costs **$0/month right now**. The numbers below are what it will cost once it's ready to go live for real, ongoing use — not what's being spent today.

---

## 1. Domain name (one-time choice, paid yearly)

A domain name is the web address people will type to reach the app (e.g. `quizmaster.church` or similar), instead of a long, unmemorable link.

| Option | First year | Every year after | Best fit |
|---|---|---|---|
| `.com` | ~$5–11 | ~$15–23/year | Most familiar to everyone, generic |
| `.org` | ~$5–10 | ~$10–20/year | Fits a church/ministry identity |
| `.ng` / `.com.ng` | ~₦9,000–15,000 (~$6–10) | similar | Matches our Nigerian base; requires registering through a NiRA-accredited provider |

**Budget: ~$15–25 per year.** The renewal price matters more than the first-year discount, since we'll be keeping this indefinitely.

---

## 2. Hosting and database (the ongoing monthly cost)

Two services run the app behind the scenes: one hosts the website itself, the other stores all the data (members, quiz results, questions).

| Service | What it does | Free tier | Paid tier (needed to go live) | Why we'd need to upgrade |
|---|---|---|---|---|
| **Vercel** | Hosts and serves the website | Free, but not licensed for real organizational use | **$20/month** (+$20 per extra team member added) | Required simply to use it for a real, public-facing church platform |
| **Supabase** | Stores all member and quiz data, handles logins | Free, but pauses after a week unused and has no backups | **$25/month** base | Needed to stay always-on and to keep the safety backups we've already set up |

**Starting monthly cost once live: approximately $45/month**, and this can grow as more provinces/parishes join and data/usage increases — it's based on actual usage, not a flat fee forever. A well-used deployment commonly runs **$60–130/month** once real traffic and data volume build up.

---

## 3. Email notifications

The app sends automated email notifications (e.g. quiz result alerts). This runs on a separate, small service.

| Volume | Cost |
|---|---|
| Up to 3,000 emails/month | Free |
| Up to 50,000 emails/month | $20/month |

Likely stays free for quite a while, until usage grows across many provinces.

---

## 4. Ongoing maintenance

This covers fixing bugs, adding features, and keeping things running smoothly — it's people's time, not a fixed bill, so the range below is a guide, not a quote.

- **Self-maintained** (project owner handles it): $0 cash cost — just ongoing time commitment.
- **Occasional freelance help** for fixes/small features: roughly ₦15,000–40,000 per day of work (~$10–27), as-needed rather than monthly.
- **A dedicated developer or retainer** for sustained, active development: a separate conversation and quote, scoped to whatever work is planned next — not something to estimate blind.

---

## Bottom line

| Item | Cost |
|---|---|
| Domain name | ~$15–25/year |
| Hosting + database (to go live) | ~$45/month to start, growing with usage |
| Email notifications | Free initially |
| Maintenance | Variable — time-based, not fixed |

**Minimum to launch for real, ongoing use: roughly $50–70/month, plus ~$20/year for the domain.**

---

*Figures are current estimates pulled from each provider's public pricing as of October 2026 and are subject to change — worth a final check on the official pricing pages (vercel.com/pricing, supabase.com/pricing, resend.com/pricing) before committing funds.*
