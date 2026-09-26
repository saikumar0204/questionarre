import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { normalizeCode } from '@/lib/codes'

/** Short, typeable invite link: /j/ABC123 */
export default async function JoinByCode({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const c = normalizeCode(code)
  if (!c) notFound()
  const room = await prisma.room.findUnique({ where: { code: c }, select: { id: true } })
  if (!room) notFound()
  redirect(`/room/${room.id}`)
}
