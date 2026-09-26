import Link from 'next/link'
import { SITE } from '@/config/site'

export default function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <Link href="/" className="text-sm text-pink-300 hover:underline">← {SITE.name}</Link>
      <h1 className="display mt-4 text-4xl font-black">{title}</h1>
      <p className="mt-1 text-xs text-white/45">Last updated {updated}</p>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/75 [&_h2]:display [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </main>
  )
}
