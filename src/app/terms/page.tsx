import type { Metadata } from 'next'
import Legal from '@/components/Legal'
import { SITE } from '@/config/site'

export const metadata: Metadata = { title: 'Terms' }

export default function Terms() {
  return (
    <Legal title="Terms of use" updated="26 September 2026">
      <p>By using {SITE.name} you agree to these simple terms.</p>
      <h2>Using the service</h2>
      <ul>
        <li>Use {SITE.name} kindly and only with a partner who has agreed to play.</li>
        <li>Do not use it to harass, threaten or share unlawful content.</li>
        <li>Keep your invite link private. You are responsible for who you share it with.</li>
      </ul>
      <h2>Content</h2>
      <p>What you write stays yours. You allow us to store it so the game can work. We may remove content or rooms that break these terms.</p>
      <h2>No guarantees</h2>
      <p>{SITE.name} is provided as is. Games are for fun and are not relationship advice or therapy. We may change or stop the service at any time, and rooms can be deleted after long inactivity.</p>
      <h2>Contact</h2>
      <p><a className="text-pink-300 underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></p>
      <p className="text-xs text-white/40">This page is a plain-language summary and should be reviewed by a lawyer before you rely on it commercially.</p>
    </Legal>
  )
}
