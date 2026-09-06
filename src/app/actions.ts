'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

// Helper: Pick 5 random questions for a category
async function getRandom5QuestionIds(category: string): Promise<string[]> {
  const allCategoryQuestions = await prisma.question.findMany({
    where: { category },
    select: { id: true },
  })
  
  if (allCategoryQuestions.length === 0) {
    // Fallback: pick any questions
    const anyQuestions = await prisma.question.findMany({
      take: 5,
      select: { id: true },
    })
    return anyQuestions.map(q => q.id)
  }

  // Shuffle array
  const shuffled = [...allCategoryQuestions].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 5).map(q => q.id)
}

export async function createRoom(formData: FormData) {
  const name = formData.get('name') as string
  const gameMode = (formData.get('gameMode') as string) || 'ROMANTIC'
  if (!name) return

  // Pick 5 random question IDs for initial game mode
  const randomQIds = await getRandom5QuestionIds(gameMode)

  const room = await prisma.room.create({
    data: {
      gameMode,
      activeGame: 'QUIZ',
      activeQuestionIds: JSON.stringify(randomQIds),
    },
  })

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
  const randomQIds = await getRandom5QuestionIds(newMode)

  await prisma.room.update({
    where: { id: roomId },
    data: { 
      gameMode: newMode,
      activeGame: 'QUIZ',
      activeQuestionIds: JSON.stringify(randomQIds),
    },
  })

  revalidatePath(`/room/${roomId}`)
}

export async function startTruthOrDare(roomId: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { 
      activeGame: 'TRUTH_OR_DARE',
      todState: null,
    },
  })

  revalidatePath(`/room/${roomId}`)
}

export async function drawTruthOrDareCard(roomId: string, type: 'TRUTH' | 'DARE') {
  const { cookies } = await import('next/headers')
  const userId = (await cookies()).get('userId')?.value
  if (!userId) return

  const cards = await prisma.truthOrDareCard.findMany({
    where: { type }
  })

  if (cards.length === 0) return

  const randomCard = cards[Math.floor(Math.random() * cards.length)]

  const newState = {
    id: randomCard.id,
    type: randomCard.type,
    text: randomCard.text,
    turnUserId: userId,
    completed: false,
  }

  await prisma.room.update({
    where: { id: roomId },
    data: {
      todState: JSON.stringify(newState),
    }
  })

  revalidatePath(`/room/${roomId}`)
}

export async function completeTruthOrDare(roomId: string) {
  const { cookies } = await import('next/headers')
  const userId = (await cookies()).get('userId')?.value
  if (!userId) return

  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room || !room.todState) return

  let currentState = JSON.parse(room.todState)
  currentState.completed = true

  await prisma.room.update({
    where: { id: roomId },
    data: {
      todState: JSON.stringify(currentState),
    }
  })

  // Award +30 Love Points for completing Truth or Dare!
  await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: 30 } },
  })

  revalidatePath(`/room/${roomId}`)
}

export async function submitAnswer(roomId: string, questionId: string, answerText: string) {
  const { cookies } = await import('next/headers')
  const userId = (await cookies()).get('userId')?.value

  if (!userId) return { error: 'Not authorized' }

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

  await prisma.user.update({
    where: { id: senderId },
    data: { points: { increment: 20 } },
  })

  revalidatePath(`/room/${roomId}`)
}
