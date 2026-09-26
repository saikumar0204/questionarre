# SoulSync — a private game space for couples

18 two-player games, a **Daily Spark** streak, love notes, coupons and a shared bucket list. No accounts, no downloads: one person creates a room, sends the link, and both play live on their phones.

Live: https://www.vk-ent.in

## What's inside

| Area | What it does |
|---|---|
| **Daily Spark** | One tiny prompt a day. Both answer, then reveal together. A shared streak that only counts when *both* finish, streak freezes, milestone rewards, WhatsApp nudge, shareable streak card, memory journal. |
| **Sync games** | Tune In (dial), Meet in the Middle, Same Wavelength, Rank & Reveal |
| **Get to know** | How Well Do You Know Me?, Love Language Test, Spot the Lie |
| **Party** | Truth or Dare (partner judges), Would You Rather, Who's More Likely To, Never Have I Ever |
| **Deep** | Finish the Sentence, Deep Talk (incl. the "36 questions"), Once Upon Us (co-written story) |
| **Board** | Tic-Tac-Toe, Connect Four, Memory Match, Heart Hunt |
| **Extras** | Gifts & notes, love coupons, date-night roulette + bucket list, anniversary counter, levels & badges |

Every question uses the partners' real **names** (never a confusing "me / you"), and hidden answers are enforced **on the server** — the browser never receives a partner's answer before the reveal.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000 — uses a local SQLite file, nothing to configure
npm test           # 60+ unit tests: engines, content quality, streak maths
npm run test:e2e   # needs a running server: BASE_URL=http://localhost:3000 npm run test:e2e
npm run lint
```

`npm run dev|build|start` go through `scripts/run.mjs`, which picks the database automatically:

- `DATABASE_URL` starts with `postgres…` → uses `prisma/schema.prisma` as-is (production).
- anything else → generates a SQLite copy of the schema and uses `prisma/soulsync.db` (local; git-ignored).

## Architecture

```
src/games/            pure, server-side game engines (no React, no DB) + content banks + tests
  engines/            simul · guess · tod · cards · board · sync · play
  spark.ts            Daily Spark: prompt of the day, streak maths, freezes, timezone handling
src/lib/room.ts       snapshot builder (per-viewer, strips hidden info) and all mutations
src/app/api/          rooms, join, /room/[id]/state (cheap polling), /room/[id]/act (all actions), share card
src/components/room/  the UI (one component per game)
src/config/site.ts    white-label settings: name, tagline, domain, contact
```

- **Realtime** without websockets: clients poll `/api/room/[id]/state?v=<version>` every ~2s. When nothing changed the server reads a single integer and returns `{changed:false}`.
- **Concurrency**: game moves use optimistic locking on `Room.version`, so simultaneous answers from both phones are never lost (covered by tests).
- **Sessions**: an httpOnly cookie per room holds a random user id. No accounts.

## Deploying (Vercel + Postgres)

The build (`npm run build`) runs `prisma generate`, `prisma db push`, then `next build`.

**The schema change is additive.** The current tables are named `ss_*`; the previous version's tables are kept as `Legacy*` models mapped to their original names, so a deploy never drops or alters them. Once you're sure you no longer need the old data, delete the `Legacy*` models and drop those tables manually.

Set `PRISMA_STRICT=1` in Vercel once real customers use it, so any *destructive* schema change fails the build instead of silently dropping data.

Use a pooled connection string for `DATABASE_URL` on serverless (Vercel Postgres / Neon / Supabase pooler).

## Rebranding

Edit `src/config/site.ts` (name, tagline, domain, contact email) and the palette tokens in `src/app/globals.css`. Game copy lives in `src/games/content/`. Legal pages (`/privacy`, `/terms`) are plain-language templates — have a lawyer review them before selling commercially.

## Ideas for monetising

Free core game + a premium pack (extra Deep Talk decks, more Truth or Dare levels, themes), a one-time "keepsake" export of your Spark memories as a PDF, and white-label licences for relationship coaches.
