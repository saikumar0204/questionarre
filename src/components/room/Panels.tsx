'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BADGES, COUPON_TEMPLATES, DATE_IDEAS, DATE_MOODS, GIFT_TYPES } from '@/games/content/extras'
import { AVATARS } from '@/lib/level'
import { useRoom } from './store'
import { usePlayers } from './games/Frame'
import { Avatar, cn, EmptyState, HeartBurst, ProgressBar, Sheet, useCelebrate } from '@/components/ui'
import { SITE } from '@/config/site'

/* ---------------------------------------- Gifts ---------------------------------------- */
export function GiftsPanel() {
  const { snap, act, busy } = useRoom()
  const { me, partner } = usePlayers()
  const [note, setNote] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="glass p-5">
        <h2 className="display text-xl font-bold">Send {partner.name} some love</h2>
        <p className="mt-0.5 text-sm text-white/55">They get a little surprise the moment they open the app. +15 💕 for you.</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {GIFT_TYPES.map((g) => (
            <button key={g.id} disabled={busy} onClick={() => (g.id === 'NOTE' ? setNoteOpen(true) : act({ type: 'gift.send', gift: g.id }))} className={cn('flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br p-3.5 text-sm font-bold shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60', g.color)}>
              <span className="text-3xl" aria-hidden>{g.emoji}</span>{g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="display mb-2 text-lg font-bold">Love wall</h3>
        {snap.gifts.length === 0 ? <EmptyState emoji="💌" title="Nothing yet" body={`Send ${partner.name} the first little surprise.`} /> : (
          <ul className="space-y-2">
            {snap.gifts.map((g) => {
              const def = GIFT_TYPES.find((x) => x.id === g.type)
              return (
                <li key={g.id} className="glass flex items-start gap-3 p-3.5">
                  <span className="text-2xl" aria-hidden>{def?.emoji}</span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p><b>{g.fromMe ? me.name : g.senderName}</b> <span className="text-white/60">{g.fromMe ? `sent ${partner.name}` : 'sent you'} {def?.label.toLowerCase()}</span></p>
                    {g.content && <p className="mt-1 rounded-xl bg-white/[0.06] px-3 py-2 text-white/90 italic">“{g.content}”</p>}
                  </div>
                  <time className="shrink-0 text-[11px] text-white/40">{new Date(g.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</time>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Sheet open={noteOpen} onClose={() => setNoteOpen(false)} title="💌 Write a love note">
        <form onSubmit={async (e) => { e.preventDefault(); if (note.trim() && (await act({ type: 'gift.send', gift: 'NOTE', content: note.trim() }))) { setNote(''); setNoteOpen(false) } }} className="space-y-3">
          <textarea className="field min-h-28 resize-none" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Tell ${partner.name} something sweet…`} autoFocus />
          <button className="btn btn-primary w-full" disabled={busy || !note.trim()}>Send note 💌</button>
        </form>
      </Sheet>
    </div>
  )
}

/** Popup for a gift the partner sent; dismissing marks it as seen on the server. */
export function IncomingGift() {
  const { snap, act } = useRoom()
  const g = snap.incoming
  const def = g ? GIFT_TYPES.find((x) => x.id === g.type) : null
  const celebrate = useCelebrate(g?.id)
  return (
    <AnimatePresence>
      {g && def && (
        <motion.div key={g.id} className="fixed inset-0 z-[65] grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <HeartBurst show={celebrate} glyphs={['💖', '💐', '✨', def.emoji]} />
          <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className={cn('w-full max-w-sm rounded-3xl bg-gradient-to-br p-[2px] shadow-2xl', def.color)}>
            <div className="rounded-[calc(1.5rem-2px)] bg-night p-7 text-center">
              <div className="animate-pop text-7xl" aria-hidden>{def.emoji}</div>
              <h3 className="display mt-3 text-2xl font-black text-balance">{g.senderName} {def.verb}!</h3>
              {g.content && <p className="mt-3 rounded-2xl bg-white/[0.07] p-3 text-white/90 italic">“{g.content}”</p>}
              <button className="btn btn-primary mt-5 w-full" onClick={() => act({ type: 'gift.seen', id: g.id })}>Aww, thank you 💕</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* --------------------------------------- Coupons --------------------------------------- */
export function CouponsPanel() {
  const { snap, act, busy } = useRoom()
  const { partner } = usePlayers()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎟️')
  const [note, setNote] = useState('')
  const mine = snap.coupons.filter((c) => !c.fromMe)
  const given = snap.coupons.filter((c) => c.fromMe)

  const send = async () => {
    if (await act({ type: 'coupon.send', title, emoji, note })) { setOpen(false); setTitle(''); setNote(''); setEmoji('🎟️') }
  }

  const Coupon = ({ c }: { c: (typeof snap.coupons)[number] }) => (
    <li className={cn('relative flex overflow-hidden rounded-2xl border border-dashed', c.redeemed ? 'border-white/15 bg-white/[0.03] opacity-60' : 'border-amber-300/50 bg-gradient-to-r from-amber-500/15 to-pink-500/15')}>
      <div className="grid w-16 shrink-0 place-items-center border-r border-dashed border-white/20 text-3xl" aria-hidden>{c.emoji}</div>
      <div className="min-w-0 flex-1 p-3">
        <p className="font-bold text-balance">{c.title}</p>
        {c.note && <p className="text-xs text-white/60 italic">“{c.note}”</p>}
        <p className="mt-1 text-[11px] text-white/40">{c.redeemed ? `Redeemed ${new Date(c.redeemedAt!).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : c.fromMe ? `Waiting to be redeemed by ${partner.name}` : 'Valid for one use'}</p>
      </div>
      {!c.fromMe && !c.redeemed && <button className="btn btn-primary btn-sm m-3 self-center" disabled={busy} onClick={() => act({ type: 'coupon.redeem', id: c.id })}>Redeem</button>}
    </li>
  )

  return (
    <div className="space-y-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="display text-xl font-bold">Love coupons 🎟️</h2>
          <p className="text-sm text-white/55">Promise {partner.name} something real. They redeem it when they want it.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Create coupon</button>
      </div>

      <div>
        <h3 className="display mb-2 text-lg font-bold">For you</h3>
        {mine.length === 0 ? <EmptyState emoji="🎁" title="No coupons yet" body={`When ${partner.name} sends you one, it shows up here.`} /> : <ul className="space-y-2.5">{mine.map((c) => <Coupon key={c.id} c={c} />)}</ul>}
      </div>
      {given.length > 0 && (
        <div>
          <h3 className="display mb-2 text-lg font-bold">You gave</h3>
          <ul className="space-y-2.5">{given.map((c) => <Coupon key={c.id} c={c} />)}</ul>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Create a love coupon">
        <p className="label">Pick an idea</p>
        <div className="flex flex-wrap gap-1.5">
          {COUPON_TEMPLATES.map((t) => (
            <button key={t.title} className={cn('chip transition hover:bg-white/15', title === t.title && 'border-pink-400 bg-pink-500/25')} onClick={() => { setTitle(t.title); setEmoji(t.emoji) }}>{t.emoji} {t.title}</button>
          ))}
        </div>
        <p className="label mt-4">…or write your own</p>
        <div className="flex gap-2">
          <input className="field !w-16 text-center" maxLength={4} value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Emoji" />
          <input className="field" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you promising?" />
        </div>
        <input className="field mt-2" maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a sweet note (optional)" />
        <button className="btn btn-primary mt-4 w-full" disabled={busy || !title.trim()} onClick={send}>Give it to {partner.name} 🎟️</button>
      </Sheet>
    </div>
  )
}

/* --------------------------------------- Dates --------------------------------------- */
export function DatesPanel() {
  const { snap, act, busy } = useRoom()
  const [mood, setMood] = useState<string>('ANY')
  const [idea, setIdea] = useState<(typeof DATE_IDEAS)[number] | null>(null)
  const [spin, setSpin] = useState(false)
  const [custom, setCustom] = useState('')

  const roll = () => {
    const pool = DATE_IDEAS.filter((d) => mood === 'ANY' || d.mood === mood)
    setSpin(true)
    let n = 0
    const timer = setInterval(() => {
      setIdea(pool[Math.floor(Math.random() * pool.length)])
      if (++n >= 9) {
        clearInterval(timer)
        setSpin(false)
      }
    }, 90)
  }

  const open = snap.bucket.filter((b) => !b.done)
  const done = snap.bucket.filter((b) => b.done)

  return (
    <div className="space-y-5">
      <div className="glass-strong p-5 sm:p-6">
        <h2 className="display text-xl font-bold">Date night roulette 🎲</h2>
        <p className="text-sm text-white/55">Can’t decide what to do? Let fate pick.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {DATE_MOODS.map((m) => <button key={m.id} className={cn('chip transition hover:bg-white/15', mood === m.id && 'border-pink-400 bg-pink-500/25')} onClick={() => setMood(m.id)}>{m.emoji} {m.name}</button>)}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-5 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={idea?.id ?? 'none'} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {idea ? (
                <>
                  <div className="text-5xl" aria-hidden>{idea.emoji}</div>
                  <p className="display mt-2 text-xl leading-snug font-bold text-balance">{idea.text}</p>
                  <p className="mt-1 text-xs text-white/45">{idea.budget === 'FREE' ? '💸 Free' : idea.budget === 'LOW' ? '💰 Budget-friendly' : '✨ Splurge'}</p>
                </>
              ) : <p className="text-white/50">Tap the button to roll a date idea ✨</p>}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button className="btn btn-primary" disabled={spin} onClick={roll}>{spin ? 'Rolling…' : idea ? 'Roll again 🎲' : 'Roll a date 🎲'}</button>
          {idea && !spin && <button className="btn btn-soft" disabled={busy} onClick={() => act({ type: 'bucket.add', text: idea.text, emoji: idea.emoji })}>＋ Add to our bucket list</button>}
        </div>
      </div>

      <div>
        <h3 className="display mb-2 text-lg font-bold">Our bucket list 🪣</h3>
        <form className="mb-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (custom.trim() && (await act({ type: 'bucket.add', text: custom.trim() }))) setCustom('') }}>
          <input className="field" maxLength={120} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add something you want to do together…" />
          <button className="btn btn-soft" disabled={busy || !custom.trim()}>Add</button>
        </form>
        {snap.bucket.length === 0 ? <EmptyState emoji="🪣" title="Your bucket list is empty" body="Roll a date idea and add it, or write your own. Complete one together for +20 💕 each." /> : (
          <ul className="space-y-2">
            {[...open, ...done].map((b) => (
              <li key={b.id} className={cn('glass flex items-center gap-3 p-3', b.done && 'opacity-60')}>
                <button onClick={() => act({ type: 'bucket.toggle', id: b.id })} disabled={busy} aria-label={b.done ? 'Mark as not done' : 'Mark as done'} className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm transition', b.done ? 'border-emerald-400 bg-emerald-500/30' : 'border-white/30 hover:border-pink-300')}>{b.done ? '✓' : ''}</button>
                <span className="text-xl" aria-hidden>{b.emoji}</span>
                <span className={cn('flex-1 text-sm', b.done && 'line-through')}>{b.text}</span>
                <button onClick={() => act({ type: 'bucket.remove', id: b.id })} disabled={busy} className="text-white/30 hover:text-red-300" aria-label="Remove">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------- Us ---------------------------------------- */
export function UsPanel() {
  const { snap, act, busy, toast } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const [date, setDate] = useState(snap.anniversary ?? '')
  const [name, setName] = useState(me.name)
  const [editing, setEditing] = useState(false)
  const lv = snap.level
  const link = typeof window !== 'undefined' ? `${window.location.origin}/room/${snap.roomId}` : ''

  const share = async () => {
    const text = `Come play with me on ${SITE.name} 💕`
    try {
      if (navigator.share) await navigator.share({ text, url: link })
      else { await navigator.clipboard.writeText(link); toast('Link copied 📋') }
    } catch { /* cancelled */ }
  }

  return (
    <div className="space-y-5">
      <div className="glass-strong p-5 text-center sm:p-6">
        <div className="flex items-center justify-center gap-3">
          <Avatar emoji={ordered[0].avatar} index={0} size="lg" />
          <span className="text-2xl" aria-hidden>💞</span>
          <Avatar emoji={ordered[1].avatar} index={1} size="lg" />
        </div>
        <h2 className="display mt-3 text-2xl font-black">{ordered[0].name} & {ordered[1].name}</h2>
        {snap.together && <p className="mt-1 text-pink-200">{snap.together.future ? `🎉 ${snap.together.days} days until your day!` : `💗 Together for ${snap.together.days.toLocaleString()} days`}</p>}
        <p className="mt-3 text-sm font-semibold">Level {lv.level} · {lv.emoji} {lv.title}</p>
        <ProgressBar value={lv.progress} className="mx-auto mt-2 max-w-xs" />
        <p className="mt-1 text-xs text-white/50">{lv.nextAt ? `${lv.points} / ${lv.nextAt} 💕 to ${lv.nextTitle}` : 'Max level reached — legends! 🏆'}</p>
      </div>

      <div className="glass p-5">
        <h3 className="display text-lg font-bold">Your anniversary 💗</h3>
        <div className="mt-2 flex gap-2">
          <input type="date" className="field" value={date} max="2100-01-01" onChange={(e) => setDate(e.target.value)} />
          <button className="btn btn-soft" disabled={busy} onClick={() => act({ type: 'anniversary.set', date: date || null })}>Save</button>
        </div>
      </div>

      <div className="glass p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="display text-lg font-bold">Badges</h3>
          <span className="chip">{snap.badges.filter((b) => b.unlocked).length}/{BADGES.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {snap.badges.map((b) => (
            <div key={b.id} className={cn('rounded-2xl border p-3 text-center', b.unlocked ? 'border-amber-300/50 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]')}>
              <div className={cn('text-3xl', !b.unlocked && 'opacity-30 grayscale')} aria-hidden>{b.emoji}</div>
              <p className="mt-1 text-xs font-bold">{b.name}</p>
              <p className="text-[11px] text-white/50">{b.desc}</p>
              {!b.unlocked && <div className="mt-1.5"><ProgressBar value={b.progress / b.goal} className="h-1.5" /><p className="mt-0.5 text-[10px] text-white/40">{b.progress}/{b.goal}</p></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-5">
        <h3 className="display text-lg font-bold">Room</h3>
        <p className="mt-1 text-sm text-white/60">Code <b className="font-mono tracking-widest text-pink-200">{snap.code}</b> · share this room to be back anytime.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-soft btn-sm" onClick={share}>🔗 Share invite link</button>
          <button className="btn btn-soft btn-sm" onClick={() => setEditing(true)}>✏️ Edit my profile</button>
        </div>
        <p className="mt-3 text-xs text-white/40">{partner.name} has played {partner.points} 💕 · you have {me.points} 💕</p>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit my profile">
        <p className="label">My name</p>
        <input className="field" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
        <p className="label mt-4">My avatar</p>
        <div className="grid grid-cols-8 gap-1.5">
          {AVATARS.map((a) => (
            <button key={a} disabled={a === partner.avatar} onClick={() => act({ type: 'profile.update', avatar: a })} className={cn('grid aspect-square place-items-center rounded-xl text-2xl transition disabled:opacity-25', a === me.avatar ? 'bg-pink-500/30 ring-2 ring-pink-400' : 'bg-white/[0.06] hover:bg-white/15')}>{a}</button>
          ))}
        </div>
        <button className="btn btn-primary mt-4 w-full" disabled={busy || !name.trim()} onClick={async () => { if (await act({ type: 'profile.update', name })) setEditing(false) }}>Save name</button>
      </Sheet>
    </div>
  )
}
