# Veri Senior Technical Officer Search

Hiring platform for Veri / Gravitas Finance LLC's Senior Technical Officer search.

Invite-only candidate intake → human-reviewed AI CV screening → in-platform technical assessment → AI scoring → admin pipeline dashboard.

## Stack

- **Next.js 15** (App Router, Server Actions, React 19)
- **TypeScript**
- **Tailwind CSS** with Veri brand tokens
- **Supabase** (Postgres + Auth + Storage)
- **Anthropic API** (CV screening + assessment scoring)
- **Resend** (transactional email — confirmations, sign-in links)

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Fill in .env.local with real values from:
#    - Supabase: project URL + publishable key + service role key
#    - Anthropic: API key
#    - Resend: API key (signed-up account)

# 4. Run dev server
npm run dev
```

App runs on http://localhost:3000.

## Routes

### Public
- `/` — landing (says "by invitation only")
- `/apply/[token]` — candidate application form
- `/apply/done` — submission confirmation

### Admin (Supabase Auth required)
- `/admin/login` — magic-link sign-in
- `/admin` — pipeline dashboard
- `/admin/invite` — generate invitation link
- `/admin/candidates/[id]` — candidate detail

### API
- `/api/sign-out` — admin sign-out

## Deployment

Set the env vars from `.env.example` in Vercel project settings. Push to GitHub; Vercel auto-deploys from `main`.

## Phase status

- ✅ **Phase 1** — Candidate intake site (form, CV upload, admin dashboard)
- ✅ **Phase 2** — AI CV screening (Claude reads each CV after submission, writes a structured screening report scored against 10 fit signals + 12 red flags + a recommendation)
- ⏳ **Phase 3** — In-platform assessment + AI scoring
