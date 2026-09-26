import Link from 'next/link'
import StartForms from '@/components/StartForms'
import { FloatingHearts } from '@/components/ui'
import { GAMES } from '@/games/registry'
import { SITE } from '@/config/site'

const STEPS = [
  { n: '1', title: 'Create a room', body: 'Type your name. That is the whole sign-up.' },
  { n: '2', title: 'Send the link', body: 'One tap on WhatsApp. Your partner joins in seconds, on any phone.' },
  { n: '3', title: 'Play together', body: 'Games, dares, deep questions and a daily streak — live, together or apart.' },
]

const FEATURES = [
  { emoji: '🔥', title: 'A daily streak for two', body: 'One tiny question a day. You both answer, then reveal together. Keep the streak alive — miss a day and a streak freeze has your back.' },
  { emoji: '🙈', title: 'Answers stay secret', body: 'Hidden answers are enforced on our server, not just hidden on screen. Nobody peeks, nobody spoils the reveal.' },
  { emoji: '🏷️', title: 'Names, not "me" and "you"', body: 'Every question uses your real names, so it is never confusing who "you" is.' },
  { emoji: '🌍', title: 'Perfect for long distance', body: 'Everything syncs live between two phones. Play across cities, time zones or the sofa.' },
  { emoji: '🔒', title: 'Private by design', body: 'No accounts, no ads, no tracking of your answers. A room is just for the two of you.' },
  { emoji: '🎁', title: 'More than games', body: 'Send flowers and love notes, give redeemable love coupons, roll date-night ideas and keep a shared bucket list.' },
]

const FAQ = [
  ['Do we need to install anything?', 'No. SoulSync runs in the browser on any phone or computer. Add it to your home screen if you like.'],
  ['Do we both need an account?', 'No accounts at all. You create a room with your first name and send your partner the link. That is it.'],
  ['Is it really private?', 'Rooms are for exactly two people and are found only through your private link or code. We never show your answers to anyone else, and inactive rooms are deleted automatically.'],
  ['Is it free?', 'Yes, everything you see is free to play right now.'],
  ['Is the flirty mode explicit?', 'No. It is flirty and playful, never explicit, and it needs both of you to confirm you are 18+.'],
  ['What if we live in different time zones?', 'The Daily Spark day follows the time zone of whoever created the room, so you always share one "today".'],
]

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE.name,
    description: SITE.description,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  }
  return (
    <>
      <FloatingHearts count={14} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <span className="display flex items-center gap-2 text-xl font-black"><span aria-hidden>💞</span>{SITE.name}</span>
        <a href="#start" className="btn btn-ghost btn-sm">Start a room</a>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        <section className="grid items-center gap-10 py-8 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div>
            <span className="chip border-pink-400/40 bg-pink-500/15 text-pink-100">✨ {GAMES.length} games · daily streak · no sign-up</span>
            <h1 className="display mt-4 text-[2.6rem] leading-[1.05] font-black text-balance sm:text-6xl">
              Date night, <span className="bg-gradient-to-r from-rose-300 via-pink-400 to-violet-400 bg-clip-text text-transparent">anywhere.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">{SITE.description}</p>
            <ul className="mt-6 grid max-w-xl gap-2.5 text-[15px] text-white/85 sm:grid-cols-2">
              {['Truth or Dare with your partner as judge', 'Tune In: are you on the same wavelength?', '“How well do you know me?” duels', 'A daily streak you keep alive together'].map((t) => (
                <li key={t} className="flex items-start gap-2"><span className="mt-0.5 text-pink-300" aria-hidden>♥</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end"><StartForms /></div>
        </section>

        <section className="py-12" aria-labelledby="how">
          <h2 id="how" className="display text-center text-3xl font-black">Playing in under a minute</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="glass p-6 text-center">
                <div className="display mx-auto grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 text-xl font-black">{s.n}</div>
                <h3 className="display mt-3 text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12" aria-labelledby="games">
          <h2 id="games" className="display text-center text-3xl font-black">{GAMES.length} games made for two</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-white/60">From silly to soulful. Every one is built so both of you play at the same time.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {GAMES.map((g) => (
              <div key={g.id} className="glass relative overflow-hidden p-4">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-2xl ${g.gradient}`} aria-hidden>{g.emoji}</span>
                <h3 className="display mt-3 text-base leading-tight font-bold">{g.title}</h3>
                <p className="mt-1 line-clamp-3 text-xs text-white/55">{g.tagline}</p>
                {g.badge === 'New' && <span className="absolute top-3 right-3 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-emerald-950 uppercase">New</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="py-12" aria-labelledby="why">
          <h2 id="why" className="display text-center text-3xl font-black">Why couples keep coming back</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass p-6">
                <div className="text-3xl" aria-hidden>{f.emoji}</div>
                <h3 className="display mt-3 text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12" aria-labelledby="faq">
          <h2 id="faq" className="display text-center text-3xl font-black">Good questions</h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-2.5">
            {FAQ.map(([q, a]) => (
              <details key={q} className="glass group p-4 open:bg-white/[0.09]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<span className="text-pink-300 transition group-open:rotate-45" aria-hidden>＋</span></summary>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="py-12 text-center">
          <div className="glass-strong mx-auto max-w-2xl p-8">
            <h2 className="display text-3xl font-black text-balance">Your partner is one link away</h2>
            <a href="#start" className="btn btn-primary mt-5 !min-h-12 px-8 text-base">Start our room 💞</a>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 py-8 text-center text-xs text-white/40">
        <nav className="mb-2 flex justify-center gap-4" aria-label="Legal">
          <Link href="/privacy" className="hover:text-white/70">Privacy</Link>
          <Link href="/terms" className="hover:text-white/70">Terms</Link>
          <a href={`mailto:${SITE.contactEmail}`} className="hover:text-white/70">Contact</a>
        </nav>
        © {new Date().getFullYear()} {SITE.name} · Made with 💗 for couples
      </footer>
    </>
  )
}
