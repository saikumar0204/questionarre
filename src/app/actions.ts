'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function createRoom(formData: FormData) {
  const name = formData.get('name') as string
  const gameMode = (formData.get('gameMode') as string) || 'ROMANTIC'
  if (!name) return

  // Create a new room with selected game mode
  const room = await prisma.room.create({
    data: {
      gameMode,
    },
  })

  // Create the first user (the creator)
  const user = await prisma.user.create({
    data: {
      roomId: room.id,
      name,
    },
  })

  const { cookies } = await import('next/headers')
  ;(await cookies()).set('userId', user.id, { path: '/' })

  redirect(`/room/${room.id}`)
}

export async function joinRoom(roomId: string, formData: FormData) {
  const name = formData.get('name') as string
  if (!name) return

  // Create the second user
  const user = await prisma.user.create({
    data: {
      roomId,
      name,
    },
  })

  const { cookies } = await import('next/headers')
  ;(await cookies()).set('userId', user.id, { path: '/' })

  revalidatePath(`/room/${roomId}`)
  redirect(`/room/${roomId}`)
}

export async function switchGameMode(roomId: string, newMode: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { gameMode: newMode },
  })

  revalidatePath(`/room/${roomId}`)
}

export async function submitAnswer(roomId: string, questionId: string, answerText: string) {
  const { cookies } = await import('next/headers')
  const userId = (await cookies()).get('userId')?.value

  if (!userId) return { error: 'Not authorized' }

  // Use upsert to safely create or update answer without throwing unique constraint error
  await prisma.answer.upsert({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
    update: {
      answerText,
    },
    create: {
      userId,
      questionId,
      answerText,
    },
  })

  // Award +10 points for answering
  await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: 10 } },
  })

  revalidatePath(`/room/${roomId}`)
}

export async function sendAction(roomId: string, receiverId: string, type: string, content?: string) {
  const { cookies } = await import('next/headers')
  const senderId = (await cookies()).get('userId')?.value

  if (!senderId) return { error: 'Not authorized' }

  await prisma.action.create({
    data: {
      senderId,
      receiverId,
      type,
      content,
    },
  })

  // Award +20 points for sending love actions
  await prisma.user.update({
    where: { id: senderId },
    data: { points: { increment: 20 } },
  })

  revalidatePath(`/room/${roomId}`)
}
