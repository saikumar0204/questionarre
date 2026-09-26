import { cookies } from 'next/headers'

/** One cookie per room, so a person can be in several rooms (e.g. testing with two tabs) without clobbering each other. */
const name = (roomId: string) => `lz_${roomId}`

export async function setSession(roomId: string, userId: string) {
  ;(await cookies()).set(name(roomId), userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function getSessionUserId(roomId: string): Promise<string | null> {
  return (await cookies()).get(name(roomId))?.value ?? null
}
