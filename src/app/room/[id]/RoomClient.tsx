'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitAnswer, sendAction, switchGameMode } from '../../actions'
import { Flower, Heart, Copy, Check, Sparkles, RefreshCw, Flame, Compass, HelpCircle, Award, MessageCircleHeart, Smile, X, Send } from 'lucide-react'

type RoomClientProps = {
  room: any
  currentUser: any
  questions: any[]
}

const GAME_MODES = [
  { id: 'ROMANTIC', name: '💕 Romantic', icon: Sparkles, color: 'text-pink-400' },
  { id: 'SPICY_FUN', name: '😂 Playful', icon: Flame, color: 'text-amber-400' },
  { id: 'FUTURE', name: '✈️ Dreams', icon: Compass, color: 'text-cyan-400' },
  { id: 'WOULD_YOU_RATHER', name: '🤔 Dilemmas', icon: HelpCircle, color: 'text-purple-400' },
]

import { useRouter } from 'next/navigation'

export default function RoomClient({ room, currentUser, questions }: RoomClientProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [customNote, setCustomNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)

  // Track dismissed action IDs in localStorage so popups never repeat across refreshes
  const [dismissedActions, setDismissedActions] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dismissed_actions_${currentUser.id}`)
      if (saved) {
        setDismissedActions(JSON.parse(saved))
      }
    } catch {
      // Ignore storage errors
    }
  }, [currentUser.id])

  const otherUser = room.users.find((u: any) => u.id !== currentUser.id)
  const isRoomFull = room.users.length === 2

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  // Auto-sync data cleanly using router.refresh() without resetting client state or reloading the window!
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 3000)
    return () => clearInterval(interval)
  }, [router])

  // Check for newly received action that hasn't been dismissed
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

  // Questions answered for the current game mode
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

  const handleGameSwitch = async (modeId: string) => {
    await switchGameMode(room.id, modeId)
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

  const bothFinished = 
    questions.length > 0 &&
    myAnswers.length === questions.length && 
    otherAnswers.length === questions.length

  // Calculate Match Score & Compatibility Report
  let matchCount = 0
  if (bothFinished) {
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
    <div className="w-full max-w-3xl flex flex-col items-center relative">
      
      {/* POPUP OVERLAY FOR RECEIVED ACTIONS (FLOWERS, HUGS, NOTES) */}
      <AnimatePresence>
        {latestAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
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
                Accept with Love 💕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar: Points & Game Mode Switcher */}
      <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl mb-8 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-pink-500/20 px-3.5 py-1.5 rounded-full border border-pink-500/30 text-pink-300 text-xs font-bold">
            <Award className="w-4 h-4 text-pink-400" />
            <span>{currentUser.name}: {currentUser.points || 0} 💕</span>
          </div>
          {otherUser && (
            <div className="flex items-center gap-1.5 bg-purple-500/20 px-3.5 py-1.5 rounded-full border border-purple-500/30 text-purple-300 text-xs font-bold">
              <span>{otherUser.name}: {otherUser.points || 0} 💕</span>
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
          {GAME_MODES.map(mode => {
            const isActive = room.gameMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => handleGameSwitch(mode.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{mode.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {bothFinished ? (
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

            {/* Affection Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => handleSendLoveAction('FLOWER')}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-pink-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Flower className="w-4 h-4" /> Send Flowers 💐
              </button>
              <button 
                onClick={() => handleSendLoveAction('HUG')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Smile className="w-4 h-4" /> Send Warm Hug 🫂
              </button>
              <button 
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircleHeart className="w-4 h-4" /> Send Secret Note 📝
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
                  className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-500 flex items-center gap-1"
                >
                  <Send className="w-4 h-4" /> Send
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
                      <strong className="text-white">{act.sender?.name || otherUser?.name}</strong> sent you a{' '}
                      {act.type === 'FLOWER' ? 'Bouquet of Flowers 💐' : act.type === 'HUG' ? 'Warm Hug 🫂' : 'Secret Note 💌'}
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

          {/* NEXT GAME MODE BUTTON */}
          <div className="text-center pt-6">
            <p className="text-slate-400 text-sm mb-3">Want to play another round?</p>
            <div className="flex flex-wrap justify-center gap-3">
              {GAME_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleGameSwitch(mode.id)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all hover:scale-105"
                >
                  Play {mode.name}
                </button>
              ))}
            </div>
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

      )}
    </div>
  )
}
