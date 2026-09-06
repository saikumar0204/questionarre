import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { joinRoom } from '../../actions'
import RoomClient from './RoomClient'

const prisma = new PrismaClient()

export default async function RoomPage({ params }: { params: { id: string } }) {
  const { id: roomId } = await params
  
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      users: {
        include: {
          answers: true,
          actionsReceived: {
            include: { sender: true },
            orderBy: { createdAt: 'desc' }
          },
        }
      }
    }
  })

  if (!room) {
    return <div className="min-h-screen flex items-center justify-center text-white">Room not found</div>
  }

  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  const currentUser = room.users.find(u => u.id === userId)

  // If user is not in the room
  if (!currentUser) {
    if (room.users.length >= 2) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-white text-center">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-2">Room Full</h2>
            <p className="text-slate-400">Two lovers are already in this room.</p>
          </div>
        </div>
      )
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <h1 className="text-3xl font-bold mb-2 text-center text-white">Join Room</h1>
          <p className="text-slate-400 mb-8 text-center">Your partner is waiting for you!</p>
          
          <form action={joinRoom.bind(null, roomId)} className="w-full space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-300 ml-1">Your Name</label>
              <input 
                type="text" 
                name="name" 
                id="name"
                required
                className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-white"
                placeholder="Enter your name..."
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-2xl font-semibold transition-all"
            >
              Join
            </button>
          </form>
        </div>
      </main>
    )
  }

  const questions = await prisma.question.findMany({ 
    where: { category: room.gameMode || 'ROMANTIC' },
    orderBy: { order: 'asc' } 
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden text-white">
      <RoomClient 
        room={room} 
        currentUser={currentUser} 
        questions={questions} 
      />
    </main>
  )
}
