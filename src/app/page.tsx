import { createRoom } from './actions'
import { Heart, Sparkles, Flame, Compass, HelpCircle } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-12 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
        
        <div className="bg-gradient-to-tr from-pink-500 to-rose-400 p-4 rounded-full mb-6 shadow-lg shadow-pink-500/30">
          <Heart className="w-10 h-10 text-white fill-white animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-pink-400 via-purple-300 to-rose-400 bg-clip-text text-transparent">
          SoulSync
        </h1>
        <p className="text-slate-300 mb-8 text-sm sm:text-base">
          A private couple's space to answer quizzes, reveal soulmate compatibility, and send affection points!
        </p>

        <form action={createRoom} className="w-full space-y-6">
          <div className="space-y-2 text-left">
            <label htmlFor="name" className="text-sm font-semibold text-slate-300 ml-1">Your Name</label>
            <input 
              type="text" 
              name="name" 
              id="name"
              required
              className="w-full px-5 py-4 bg-slate-900/60 border border-slate-700/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-white placeholder-slate-500"
              placeholder="Enter your name..."
            />
          </div>

          <div className="space-y-3 text-left">
            <label className="text-sm font-semibold text-slate-300 ml-1">Select First Game Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <label className="relative flex items-center p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60 cursor-pointer transition-all has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10">
                <input type="radio" name="gameMode" value="ROMANTIC" defaultChecked className="sr-only" />
                <Sparkles className="w-5 h-5 text-pink-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">💕 Romantic Soulmates</div>
                  <div className="text-[10px] text-slate-400">Deep love & connection</div>
                </div>
              </label>

              <label className="relative flex items-center p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60 cursor-pointer transition-all has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10">
                <input type="radio" name="gameMode" value="SPICY_FUN" className="sr-only" />
                <Flame className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">😂 Funny & Playful</div>
                  <div className="text-[10px] text-slate-400">Hilarious couple habits</div>
                </div>
              </label>

              <label className="relative flex items-center p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60 cursor-pointer transition-all has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10">
                <input type="radio" name="gameMode" value="FUTURE" className="sr-only" />
                <Compass className="w-5 h-5 text-cyan-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">✈️ Future & Dreams</div>
                  <div className="text-[10px] text-slate-400">Travel, pets & life goals</div>
                </div>
              </label>

              <label className="relative flex items-center p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60 cursor-pointer transition-all has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10">
                <input type="radio" name="gameMode" value="WOULD_YOU_RATHER" className="sr-only" />
                <HelpCircle className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">🤔 Would You Rather</div>
                  <div className="text-[10px] text-slate-400">Fun couple dilemmas</div>
                </div>
              </label>

            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/25 transition-all active:scale-[0.98] text-base"
          >
            Create Private Room
          </button>
        </form>

      </div>
    </main>
  )
}
