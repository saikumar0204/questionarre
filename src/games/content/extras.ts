/* ---------- Date night roulette ---------- */
export type DateIdea = { id: string; emoji: string; text: string; mood: 'HOME' | 'OUT' | 'ADVENTURE' | 'FOODIE' | 'CREATIVE'; budget: 'FREE' | 'LOW' | 'SPLURGE' }

export const DATE_MOODS = [
  { id: 'ANY', name: 'Surprise me', emoji: '🎲' },
  { id: 'HOME', name: 'Stay in', emoji: '🏠' },
  { id: 'OUT', name: 'Go out', emoji: '🌆' },
  { id: 'ADVENTURE', name: 'Adventure', emoji: '🧭' },
  { id: 'FOODIE', name: 'Foodie', emoji: '🍽️' },
  { id: 'CREATIVE', name: 'Creative', emoji: '🎨' },
] as const

const rows: [string, DateIdea['mood'], DateIdea['budget'], string][] = [
  ['🍿', 'HOME', 'FREE', 'Build a blanket fort and watch a movie neither of you has seen'],
  ['🎲', 'HOME', 'FREE', 'Board-game tournament: loser does the dishes'],
  ['👩‍🍳', 'HOME', 'LOW', 'Cook a dish from a country you both want to visit'],
  ['📽️', 'HOME', 'FREE', 'Host a "our love story" slideshow with old photos'],
  ['💆', 'HOME', 'FREE', 'Spa night: face masks, massages and soft music'],
  ['🕯️', 'HOME', 'LOW', 'Candlelit dinner on the balcony or terrace'],
  ['🎤', 'HOME', 'FREE', 'Karaoke night with your favourite Bollywood duets'],
  ['📖', 'HOME', 'FREE', 'Read a chapter aloud to each other before bed'],
  ['🧩', 'HOME', 'LOW', 'Do a 500-piece puzzle together with chai'],
  ['🎮', 'HOME', 'FREE', 'Co-op video game night'],
  ['🌅', 'OUT', 'FREE', 'Catch a sunrise or sunset at your favourite spot'],
  ['🚲', 'OUT', 'LOW', 'Rent cycles and explore a new neighbourhood'],
  ['🎬', 'OUT', 'LOW', 'Movie night at a cinema, with sharing popcorn'],
  ['🛍️', 'OUT', 'LOW', 'Flea-market walk: buy each other a surprise under ₹200'],
  ['🎳', 'OUT', 'LOW', 'Bowling or arcade date with a prize for the winner'],
  ['🎭', 'OUT', 'SPLURGE', 'Watch a live show, concert or stand-up night'],
  ['🌌', 'OUT', 'FREE', 'Stargaze from a rooftop or open ground'],
  ['📸', 'OUT', 'FREE', 'Photo walk: recreate your first photo together'],
  ['🥾', 'ADVENTURE', 'LOW', 'Sunrise hike to a viewpoint with a flask of chai'],
  ['🏕️', 'ADVENTURE', 'SPLURGE', 'Overnight camping trip'],
  ['🚗', 'ADVENTURE', 'LOW', 'Spontaneous road trip: pick a random direction'],
  ['🏄', 'ADVENTURE', 'SPLURGE', 'Try a new sport together: surfing, kayaking or paragliding'],
  ['🧗', 'ADVENTURE', 'LOW', 'Indoor rock climbing session'],
  ['🚂', 'ADVENTURE', 'LOW', 'Take a train to a town neither of you has visited'],
  ['🍜', 'FOODIE', 'LOW', 'Street-food crawl: five stalls, one favourite each'],
  ['🍰', 'FOODIE', 'LOW', 'Dessert-only dinner'],
  ['🍷', 'FOODIE', 'SPLURGE', 'Fine-dining night: dress up and try the tasting menu'],
  ['🥘', 'FOODIE', 'LOW', 'Cook-off: same ingredients, different dishes, blind taste test'],
  ['☕', 'FOODIE', 'LOW', 'Café hopping: rate every chai or coffee'],
  ['🍕', 'FOODIE', 'LOW', 'Make pizzas from scratch with silly toppings'],
  ['🎨', 'CREATIVE', 'LOW', 'Paint and sip: paint each other\'s portrait'],
  ['🏺', 'CREATIVE', 'SPLURGE', 'Pottery class date'],
  ['📝', 'CREATIVE', 'FREE', 'Write letters to your future selves and seal them'],
  ['🎶', 'CREATIVE', 'FREE', 'Create a shared playlist of "our songs"'],
  ['📔', 'CREATIVE', 'LOW', 'Make a scrapbook of your favourite moments'],
  ['💃', 'CREATIVE', 'LOW', 'Learn a dance together from a YouTube tutorial'],
  ['🌱', 'CREATIVE', 'LOW', 'Plant something together and name it'],
  ['🧁', 'CREATIVE', 'LOW', 'Bake and decorate cupcakes with each other\'s names'],
]
export const DATE_IDEAS: DateIdea[] = rows.map(([emoji, mood, budget, text], i) => ({ id: `date.${i + 1}`, emoji, mood, budget, text }))

/* ---------- Love coupons ---------- */
export const COUPON_TEMPLATES = [
  { emoji: '🍽️', title: 'Dinner of your choice' },
  { emoji: '💆', title: 'A 20-minute massage' },
  { emoji: '🎬', title: 'You pick the movie (no complaints)' },
  { emoji: '🛌', title: 'Breakfast in bed' },
  { emoji: '🧺', title: 'I do your chores for a day' },
  { emoji: '🤗', title: 'A hug whenever you ask' },
  { emoji: '🚗', title: 'A surprise drive with your playlist' },
  { emoji: '🍦', title: 'Ice-cream date, my treat' },
  { emoji: '🎁', title: 'A surprise gift, no occasion' },
  { emoji: '💌', title: 'A handwritten love letter' },
  { emoji: '🙏', title: 'One free "I am sorry" pass' },
  { emoji: '👑', title: 'King or Queen for a day' },
  { emoji: '📵', title: 'A phone-free evening, just us' },
  { emoji: '🎤', title: 'I will sing you a song' },
  { emoji: '🧖', title: 'Spa night at home' },
  { emoji: '✈️', title: 'A weekend getaway, planned by me' },
]

/* ---------- Gift catalogue ---------- */
export const GIFT_TYPES = [
  { id: 'FLOWER', emoji: '💐', label: 'Flowers', verb: 'sent you a bouquet of roses', color: 'from-pink-500 to-rose-500' },
  { id: 'HUG', emoji: '🫂', label: 'Hug', verb: 'sent you a big warm hug', color: 'from-violet-500 to-indigo-500' },
  { id: 'CHOCOLATE', emoji: '🍫', label: 'Chocolate', verb: 'sent you sweet chocolates', color: 'from-amber-600 to-yellow-600' },
  { id: 'KISS', emoji: '💋', label: 'Kiss', verb: 'sent you a virtual kiss', color: 'from-rose-600 to-pink-600' },
  { id: 'COFFEE', emoji: '☕', label: 'Coffee date', verb: 'invited you for a cosy coffee date', color: 'from-cyan-600 to-teal-600' },
  { id: 'TEDDY', emoji: '🧸', label: 'Teddy', verb: 'sent you a cuddly teddy bear', color: 'from-orange-500 to-amber-500' },
  { id: 'MISS_YOU', emoji: '🥺', label: 'Miss you', verb: 'is missing you right now', color: 'from-sky-500 to-blue-600' },
  { id: 'NOTE', emoji: '💌', label: 'Love note', verb: 'sent you a love note', color: 'from-fuchsia-500 to-pink-600' },
] as const

export type GiftId = (typeof GIFT_TYPES)[number]['id']

/* ---------- Badges (unlocked from room stats) ---------- */
export const BADGES: { id: string; emoji: string; name: string; desc: string; stat: string; goal: number }[] = [
  { id: 'first-game', emoji: '🎮', name: 'Player Two Ready', desc: 'Finish your first game together', stat: 'gamesFinished', goal: 1 },
  { id: 'game-lovers', emoji: '🕹️', name: 'Game Lovers', desc: 'Finish 10 games together', stat: 'gamesFinished', goal: 10 },
  { id: 'perfect-sync', emoji: '🧬', name: 'Perfect Sync', desc: 'Match on every question of a quiz', stat: 'perfectSync', goal: 1 },
  { id: 'mind-readers', emoji: '🔮', name: 'Mind Readers', desc: 'Guess 10 right in How Well Do You Know Me', stat: 'guessRight', goal: 10 },
  { id: 'truth-tellers', emoji: '💡', name: 'Truth Tellers', desc: 'Complete 5 truths', stat: 'truthsDone', goal: 5 },
  { id: 'daredevils', emoji: '🎯', name: 'Daredevils', desc: 'Complete 5 dares', stat: 'daresDone', goal: 5 },
  { id: 'deep-divers', emoji: '🌌', name: 'Deep Divers', desc: 'Talk through 12 Deep Talk cards', stat: 'deepCards', goal: 12 },
  { id: 'gift-givers', emoji: '🎁', name: 'Gift Givers', desc: 'Send 10 gifts', stat: 'giftsSent', goal: 10 },
  { id: 'coupon-clippers', emoji: '🎟️', name: 'Coupon Clippers', desc: 'Redeem 3 love coupons', stat: 'couponsRedeemed', goal: 3 },
  { id: 'bucket-list', emoji: '🪣', name: 'Bucket List Heroes', desc: 'Complete 3 bucket-list dates', stat: 'bucketDone', goal: 3 },
  { id: 'streak-7', emoji: '🔥', name: 'One Week Strong', desc: 'Keep a Daily Spark streak for 7 days', stat: 'bestStreak', goal: 7 },
  { id: 'streak-30', emoji: '🌋', name: 'Unstoppable', desc: 'Keep a Daily Spark streak for 30 days', stat: 'bestStreak', goal: 30 },
  { id: 'streak-100', emoji: '👑', name: 'Forever & Always', desc: 'Keep a Daily Spark streak for 100 days', stat: 'bestStreak', goal: 100 },
  { id: 'spark-fan', emoji: '✨', name: 'Daily Devotees', desc: 'Complete 10 Daily Sparks together', stat: 'sparksDone', goal: 10 },
  { id: 'telepathic', emoji: '📻', name: 'Telepathic', desc: 'Score 18+ in Tune In', stat: 'tuneBest', goal: 1 },
  { id: 'mind-meld', emoji: '🧠', name: 'One Mind', desc: 'Meet in the Middle within 3 rounds', stat: 'meldFast', goal: 1 },
  { id: 'liars', emoji: '🤥', name: 'Convincing Liars', desc: 'Play 5 rounds of Spot the Lie', stat: 'lieRounds', goal: 5 },
  { id: 'storytellers', emoji: '📖', name: 'Storytellers', desc: 'Finish a story together', stat: 'storiesWritten', goal: 1 },
  { id: 'board-champs', emoji: '🏆', name: 'Board Champs', desc: 'Win 5 board games', stat: 'boardWins', goal: 5 },
]
