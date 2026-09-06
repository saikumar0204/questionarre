'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitAnswer, sendAction, switchGameMode, startTruthOrDare, drawTruthOrDareCard, completeTruthOrDare } from '../../actions'
import { Flower, Heart, Copy, Check, Sparkles, RefreshCw, Flame, Compass, HelpCircle, Award, MessageCircleHeart, Smile, X, Send, Dices, Coffee, Cookie, Utensils, Crown, Sparkle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type RoomClientProps = {
  room: any
  currentUser: any
  questions: any[]
}

const CATEGORIES = [
  { id: 'ROMANTIC', name: '💕 Romantic', icon: Sparkles, color: 'from-pink-500 to-rose-500' },
  { id: 'SPICY_FUN', name: '😂 Playful', icon: Flame, color: 'from-amber-500 to-orange-500' },
  { id: 'FUTURE', name: '✈️ Dreams', icon: Compass, color: 'from-cyan-500 to-blue-500' },
  { id: 'WOULD_YOU_RATHER', name: '🤔 Dilemmas', icon: HelpCircle, color: 'from-purple-500 to-indigo-500' },
]

function getRelationshipRank(points: number) {
  if (points >= 300) return { title: 'Eternal Lovers 💎', color: 'text-cyan-400', border: 'border-cyan-500/40' }
  if (points >= 150) return { title: 'Soulmates 👑', color: 'text-amber-400', border: 'border-amber-500/40' }
  if (points >= 50) return { title: 'Sweethearts 💕', color: 'text-pink-400', border: 'border-pink-500/40' }
  return { title: 'Cute Crush 🌸', color: 'text-rose-300', border: 'border-rose-400/30' }
}

export default function RoomClient({ room, currentUser, questions }: RoomClientProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [customNote, setCustomNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [dismissedActions, setDismissedActions] = useState<string[]>([])

  const otherUser = room.users.find((u: any) => u.id !== currentUser.id)
  const isRoomFull = room.users.length === 2

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dismissed_actions_${currentUser.id}`)
      if (saved) {
        setDismissedActions(JSON.parse(saved))
      }
    } catch {
      // Ignore
    }
  }, [currentUser.id])

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  // Auto-sync data with router.refresh()
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 3000)
    return () => clearInterval(interval)
  }, [router])

  const receivedActions = currentUser.actionsReceived || []
  const latestAction = receivedActions.find((a: any) => !dismissedActions.includes(a.id))

  const dismissCurrentAction = () => {
    if (latestAction) {
      const updated = [...dismissedActions, latestAction.id]
      setDismissedActions(updated)
      try {
        localStorage.setItem(`dismissed_actions_${currentUser.id}`, JSON.stringify(updated))
      } catch {
        // Ignore
      }
    }
  }

  // Active Quiz question answering tracking
  const currentQuestionIds = new Set(questions.map(q => q.id))
  const myAnswers = currentUser.answers.filter((a: any) => currentQuestionIds.has(a.questionId))
  const otherAnswers = otherUser?.answers?.filter((a: any) => currentQuestionIds.has(a.questionId)) || []

  useEffect(() => {
    const nextUnanswered = questions.findIndex(
      q => !myAnswers.some((a: any) => a.questionId === q.id)
    )
    if (nextUnanswered !== -1) {
      setCurrentQuestionIndex(nextUnanswered)
    } else {
      setCurrentQuestionIndex(questions.length)
    }
  }, [myAnswers, questions])

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl || window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSelectOption = async (optionText: string) => {
    if (isSubmitting) return

    setSelectedOption(optionText)
    setIsSubmitting(true)
    await submitAnswer(room.id, questions[currentQuestionIndex].id, optionText)
    setSelectedOption(null)
    setIsSubmitting(false)
  }

  const handleSendLoveAction = async (type: string, content?: string) => {
    if (!otherUser) return
    await sendAction(room.id, otherUser.id, type, content)
    setCustomNote('')
    setShowNoteInput(false)
  }

  const handleCategorySwitch = async (catId: string) => {
    await switchGameMode(room.id, catId)
  }

  const handleStartTruthOrDare = async () => {
    await startTruthOrDare(room.id)
  }

  const handleDrawTOD = async (type: 'TRUTH' | 'DARE') => {
    await drawTruthOrDareCard(room.id, type)
  }

  const handleCompleteTOD = async () => {
    await completeTruthOrDare(room.id)
  }

  if (!isRoomFull) {
    return (
      <div className="text-center space-y-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <Heart className="w-10 h-10 text-pink-500" />
        </div>
        <h2 className="text-3xl font-bold">Waiting for your partner...</h2>
        <p className="text-slate-400 max-w-sm">Share this link with them to start playing together!</p>
        
        <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-700">
          <code className="px-4 text-pink-300 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] sm:max-w-xs text-sm">
            {shareUrl || 'Loading link...'}
          </code>
          <button 
            onClick={copyLink}
            className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 rounded-xl transition-all shadow-md"
          >
            {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 pt-4">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Auto-checking for partner...</span>
        </div>
      </div>
    )
  }

  const userRank = getRelationshipRank((currentUser.points || 0) + (otherUser?.points || 0))
  const isQuizMode = room.activeGame !== 'TRUTH_OR_DARE'
  const todState = room.todState ? JSON.parse(room.todState) : null

  const bothFinishedQuiz = 
    isQuizMode &&
    questions.length > 0 &&
    myAnswers.length === questions.length && 
    otherAnswers.length === questions.length

  let matchCount = 0
  if (bothFinishedQuiz) {
    questions.forEach(q => {
      const my = myAnswers.find((a: any) => a.questionId === q.id)?.answerText
      const th = otherAnswers.find((a: any) => a.questionId === q.id)?.answerText
      if (my && th && my === th) matchCount++
    })
  }

  const totalQ = questions.length || 1
  const rawMatchPct = Math.round((matchCount / totalQ) * 100)
  const soulmateScore = Math.min(100, Math.max(82, rawMatchPct + 15))

  return (
    <div className="w-full max-w-3xl flex flex-col items-center relative pb-16">
      
      {/* POPUP OVERLAY FOR RECEIVED ACTIONS */}
      <AnimatePresence>
        {latestAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-2 border-pink-500/50 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
              <button 
                onClick={dismissCurrentAction}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {latestAction.type === 'FLOWER' && (
                <div>
                  <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Flower className="w-12 h-12 text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">You Received Flowers! 💐</h3>
                  <p className="text-pink-300 font-medium mb-4">
                    <span className="font-bold text-white">{latestAction.sender?.name || otherUser?.name}</span> sent you a fresh bouquet of roses!
                  </p>
                </div>
              )}

              {latestAction.type === 'HUG' && (
                <div>
                  <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Smile className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Warm Hug Received! 🫂</h3>
                  <p className="text-purple-300 font-medium mb-4">
                    <span className="font-bold text-white">{latestAction.sender?.name || otherUser?.name}</span> sent you a cozy warm hug!
                  </p>
                </div>
              )}

              {latestAction.type === 'CHOCOLATE' && (
                <div>
                  <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Cookie className="w-12 h-12 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Sweet Chocolates! 🍫</h3>
                  <p className="text-amber-300 font-medium mb-4">
                    <span className="font-bold text-white">{latestAction.sender?.name || otherUser?.name}</span> sent you delicious chocolates!
                  </p>
                </div>
              )}

              {latestAction.type === 'KISS' && (
                <div>
                  <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Heart className="w-12 h-12 text-rose-400 fill-current" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Sweet Kiss Received! 💋</h3>
                  <p className="text-rose-300 font-medium mb-4">
                    <span className="font-bold text-white">{latestAction.sender?.name || otherUser?.name}</span> sent you a virtual kiss!
                  </p>
                </div>
              )}

              {latestAction.type === 'COFFEE' && (
                <div>
                  <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee className="w-12 h-12 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Coffee Date Invite! ☕</h3>
                  <p className="text-cyan-300 font-medium mb-4">
                    <span className="font-bold text-white">{latestAction.sender?.name || otherUser?.name}</span> invited you for a cozy coffee date!
                  </p>
                </div>
              )}

              {latestAction.type === 'NOTE' && (
                <div>
                  <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircleHeart className="w-10 h-10 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Secret Love Note! 💌</h3>
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">
                    From {latestAction.sender?.name || otherUser?.name}
                  </p>
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-pink-500/30 text-slate-100 italic mb-4">
                    "{latestAction.content || 'Sending you lots of love!'}"
                  </div>
                </div>
              )}

              <button
                onClick={dismissCurrentAction}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-2xl font-bold transition-all shadow-lg"
              >
                Accept with Love 💕 (+20 pts)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR: POINTS & RELATIONSHIP RANK */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 sm:p-5 rounded-3xl mb-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/80 border ${userRank.border} text-xs font-black shadow`}>
            <Crown className="w-4 h-4 text-amber-400" />
            <span className={userRank.color}>{userRank.title}</span>
          </div>

          <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
            <span className="bg-pink-500/20 border border-pink-500/30 px-3 py-1 rounded-full text-pink-300">
              {currentUser.name}: {currentUser.points || 0} 💕
            </span>
            {otherUser && (
              <span className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-purple-300">
                {otherUser.name}: {otherUser.points || 0} 💕
              </span>
            )}
          </div>
        </div>

        {/* GAME TYPE HUB TABS */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => handleCategorySwitch(room.gameMode || 'ROMANTIC')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isQuizMode ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Couples Quiz
          </button>

          <button
            onClick={handleStartTruthOrDare}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              !isQuizMode ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" /> Truth or Dare 🔥
          </button>
        </div>
      </div>

      {/* QUIZ CATEGORY SELECTOR (WHEN IN QUIZ MODE) */}
      {isQuizMode && (
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Quiz Category</span>
            <button
              onClick={() => handleCategorySwitch(room.gameMode)}
              className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-bold bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20"
            >
              <Dices className="w-3.5 h-3.5" /> Shuffle New 5 Questions
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map(cat => {
              const isActive = room.gameMode === cat.id
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySwitch(cat.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive 
                      ? `bg-gradient-to-r ${cat.color} border-white/40 text-white shadow-lg scale-[1.02]`
                      : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* GAME MODE 1: TRUTH OR DARE */}
      {!isQuizMode ? (
        <div className="w-full animate-fade-in space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-4">
              <Flame className="w-4 h-4 text-amber-400" /> Couples Truth or Dare Edition
            </div>

            <h2 className="text-3xl font-black text-white mb-2">Turn-Based Truth or Dare</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
              Pick Truth or Dare to draw a fun, romantic, or spicy challenge! Completing a challenge awards <span className="text-amber-400 font-bold">+30 Love Points</span>!
            </p>

            {/* ACTION DRAW BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <button
                onClick={() => handleDrawTOD('TRUTH')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-xl shadow-cyan-500/20 text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> Draw Truth 💡
              </button>

              <button
                onClick={() => handleDrawTOD('DARE')}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black rounded-2xl shadow-xl shadow-rose-500/20 text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Flame className="w-5 h-5" /> Draw Dare 🎯
              </button>
            </div>

            {/* DRAWN CARD DISPLAY */}
            {todState ? (
              <div className="bg-slate-950/90 border-2 border-amber-500/40 p-6 sm:p-8 rounded-3xl max-w-lg mx-auto shadow-2xl relative">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase mb-3 bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {todState.type === 'TRUTH' ? '💡 TRUTH CHALLENGE' : '🎯 DARE CHALLENGE'}
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  "{todState.text}"
                </h3>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Drawn by: <strong className="text-pink-400">{todState.turnUserId === currentUser.id ? 'You' : otherUser.name}</strong>
                  </span>

                  {todState.completed ? (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Completed! (+30 💕)
                    </span>
                  ) : (
                    <button
                      onClick={handleCompleteTOD}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1 shadow"
                    >
                      <Check className="w-4 h-4" /> Mark Complete (+30 💕)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs italic py-4">
                Click "Draw Truth" or "Draw Dare" to start the turn!
              </div>
            )}
          </div>
        </div>
      ) : (

        /* GAME MODE 2: COUPLES QUIZ MODE */
        bothFinishedQuiz ? (
          <div className="w-full animate-fade-in space-y-8">
            
            {/* COMPATIBILITY REPORT CARD */}
            <div className="bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-900/90 backdrop-blur-2xl border border-pink-500/30 p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold mb-4">
                <Sparkles className="w-4 h-4 text-pink-400" /> Couple Compatibility Report
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                {soulmateScore}% Soulmate Match!
              </h2>
              <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
                You matched on <span className="text-pink-400 font-bold">{matchCount} out of {totalQ}</span> answers! {
                  matchCount === totalQ 
                    ? "Mind-blowing harmony! You two think with one heart." 
                    : "Incredible chemistry! Your differences make you even more exciting."
                }
              </p>

              {/* Score Bar */}
              <div className="w-full bg-slate-950/80 rounded-full h-4 p-1 border border-slate-800 max-w-md mx-auto mb-6">
                <div 
                  className="bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 h-full rounded-full transition-all duration-1000 shadow-lg shadow-pink-500/40"
                  style={{ width: `${soulmateScore}%` }}
                ></div>
              </div>

              {/* AFFECTION SHOP / ACTION BUTTONS */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-2.5">
                <button 
                  onClick={() => handleSendLoveAction('FLOWER')}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow transition-all hover:scale-105"
                >
                  <Flower className="w-3.5 h-3.5" /> Flowers 💐 (+20)
                </button>
                <button 
                  onClick={() => handleSendLoveAction('HUG')}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow transition-all hover:scale-105"
                >
                  <Smile className="w-3.5 h-3.5" /> Hug 🫂 (+20)
                </button>
                <button 
                  onClick={() => handleSendLoveAction('CHOCOLATE')}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow transition-all hover:scale-105"
                >
                  <Cookie className="w-3.5 h-3.5" /> Chocolate 🍫 (+20)
                </button>
                <button 
                  onClick={() => handleSendLoveAction('KISS')}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow transition-all hover:scale-105"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" /> Kiss 💋 (+20)
                </button>
                <button 
                  onClick={() => handleSendLoveAction('COFFEE')}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow transition-all hover:scale-105"
                >
                  <Coffee className="w-3.5 h-3.5" /> Coffee ☕ (+20)
                </button>
                <button 
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30 px-4 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105"
                >
                  <MessageCircleHeart className="w-3.5 h-3.5" /> Note 📝
                </button>
              </div>

              {/* Note Input */}
              {showNoteInput && (
                <div className="mt-4 flex gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Write a sweet message..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    onClick={() => handleSendLoveAction('NOTE', customNote)}
                    className="bg-pink-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-pink-500 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              )}
            </div>

            {/* RECENT RECEIVED AFFECTION WALL */}
            {receivedActions.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-current" /> Love Wall & Received Affection
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {receivedActions.map((act: any) => (
                    <div key={act.id} className="text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300">
                      <span>
                        <strong className="text-white">{act.sender?.name || otherUser?.name}</strong> sent you{' '}
                        {act.type === 'FLOWER' ? 'Flowers 💐' : act.type === 'HUG' ? 'a Warm Hug 🫂' : act.type === 'CHOCOLATE' ? 'Chocolates 🍫' : act.type === 'KISS' ? 'a Sweet Kiss 💋' : act.type === 'COFFEE' ? 'Coffee ☕' : 'a Secret Note 💌'}
                        {act.content ? `: "${act.content}"` : ''}
                      </span>
                      <span className="text-pink-400 font-bold">+20 💕</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANSWERS SIDE-BY-SIDE */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-200 text-center mb-2">Question Breakdown</h3>
              {questions.map((q, idx) => {
                const myAns = myAnswers.find((a: any) => a.questionId === q.id)?.answerText
                const thAns = otherAnswers.find((a: any) => a.questionId === q.id)?.answerText
                const isMatch = myAns && thAns && myAns === thAns

                return (
                  <div key={q.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg relative">
                    {isMatch && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" /> Match!
                      </div>
                    )}

                    <h4 className="text-base font-bold mb-4 text-slate-100 pr-20">
                      {idx + 1}. {q.text}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`p-4 rounded-xl border ${isMatch ? 'bg-pink-500/10 border-pink-500/40' : 'bg-slate-900/60 border-slate-800'}`}>
                        <p className="text-[10px] text-pink-400 uppercase tracking-wider mb-1 font-bold">You</p>
                        <p className="text-sm font-medium text-slate-100">{myAns}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${isMatch ? 'bg-pink-500/10 border-pink-500/40' : 'bg-slate-900/60 border-slate-800'}`}>
                        <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1 font-bold">{otherUser.name}</p>
                        <p className="text-sm font-medium text-slate-100">{thAns}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        ) : currentQuestionIndex < questions.length ? (
          
          /* QUESTIONNAIRE FLOW */
          <div className="w-full max-w-xl">
            <div className="flex justify-between items-center mb-6 px-1">
              <span className="text-pink-400 font-semibold text-sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-400 text-xs bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700">
                {otherUser.name} is {otherAnswers.length === questions.length ? '✅ Done' : '⏳ Answering...'}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl"
              >
                <h2 className="text-2xl font-bold mb-6 text-slate-100">
                  {questions[currentQuestionIndex].text}
                </h2>

                <div className="space-y-3">
                  {(JSON.parse(questions[currentQuestionIndex].options || '[]') as string[]).map((opt, idx) => {
                    const isSelected = selectedOption === opt
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(opt)}
                        disabled={isSubmitting}
                        className={`w-full text-left p-5 rounded-2xl border font-medium transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-400 text-white shadow-lg shadow-pink-500/25 scale-[1.01]'
                            : 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-700/60 text-slate-200 hover:border-pink-500/40'
                        }`}
                      >
                        <span>{opt}</span>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-white bg-white/20' : 'border-slate-600 group-hover:border-pink-400'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        ) : (

          /* WAITING FOR PARTNER */
          <div className="text-center max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-white">You're all done!</h2>
            <p className="text-slate-300 text-base mb-6">
              Waiting for <span className="font-semibold text-pink-400">{otherUser.name}</span> to finish answering...
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-900/50 py-2 px-4 rounded-full w-fit mx-auto border border-slate-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
              <span>Calculating compatibility...</span>
            </div>
          </div>

        )
      )}

    </div>
  )
}
