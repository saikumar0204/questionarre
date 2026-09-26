import type { Metadata } from 'next'
import Legal from '@/components/Legal'
import { SITE } from '@/config/site'

export const metadata: Metadata = { title: 'Privacy' }

export default function Privacy() {
  return (
    <Legal title="Privacy" updated="26 September 2026">
      <p>{SITE.name} is a small app for two people. We collect as little as we can to make it work.</p>
      <h2>What we store</h2>
      <ul>
        <li>The first names and avatars you choose.</li>
        <li>What you answer in games and Daily Sparks, plus scores, streaks, gifts, love coupons and bucket-list items, so your partner can see them.</li>
        <li>A cookie on your device that keeps you signed in to your room. It contains a random identifier, not your name.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>No accounts, phone numbers or email addresses are collected.</li>
        <li>We do not sell your data or show ads.</li>
        <li>Your partner can only see your answers once both of you have answered; other people cannot see them at all.</li>
      </ul>
      <h2>Who can access a room</h2>
      <p>Anyone who has your private room link or code can join while a spot is free. Once two people have joined, nobody else can. Please do not post your invite link publicly.</p>
      <h2>Deleting your data</h2>
      <p>Rooms with no activity for 60 days are deleted automatically, together with everything in them. To delete a room sooner, email us with the room code at <a className="text-pink-300 underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      <h2>Children</h2>
      <p>{SITE.name} is meant for adults. The flirty mode requires both partners to confirm they are 18 or older.</p>
      <p className="text-xs text-white/40">This page is a plain-language summary and should be reviewed by a lawyer before you rely on it commercially.</p>
    </Legal>
  )
}
