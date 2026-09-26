'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/** Forgets this room on the current device (handy on a shared phone or computer). The room itself is untouched. */
export async function leaveRoomOnThisDevice(roomId: string) {
  ;(await cookies()).delete(`lz_${roomId}`)
  redirect('/')
}
