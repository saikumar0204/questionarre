// NOTE: this file is bundled into the browser, so it must not import the (large) question banks.
// tests/content.test.ts verifies that every category listed here really exists in its bank.

const QUIZ_CATEGORIES = [
  { id: 'ROMANTIC', name: 'Romantic', emoji: '💕', blurb: 'Dates, feelings & butterflies' },
  { id: 'PLAYFUL', name: 'Playful', emoji: '😂', blurb: 'Who is more likely to…' },
  { id: 'DREAMS', name: 'Dreams', emoji: '✈️', blurb: 'Your future together' },
]
const WYR_CATEGORIES = [
  { id: 'COZY', name: 'Cozy', emoji: '🧸', blurb: 'Sweet & snuggly choices' },
  { id: 'WILD', name: 'Adventure', emoji: '🌋', blurb: 'Big, bold what-ifs' },
  { id: 'SILLY', name: 'Silly', emoji: '🤪', blurb: 'Absurd & hilarious' },
]
const LIKELY_CATEGORIES = [
  { id: 'SWEET', name: 'Sweet', emoji: '🥰', blurb: 'Kind, caring & romantic' },
  { id: 'FUNNY', name: 'Funny', emoji: '😆', blurb: 'Habits & quirks' },
  { id: 'CHAOS', name: 'Chaos', emoji: '🌪️', blurb: 'Dramatic & wild' },
]
const NHIE_CATEGORIES = [
  { id: 'SWEET', name: 'Sweet', emoji: '🌸', blurb: 'Warm & wholesome' },
  { id: 'FUN', name: 'Fun', emoji: '🎈', blurb: 'Embarrassing & funny' },
  { id: 'SPICY', name: 'Flirty', emoji: '🔥', blurb: 'A little cheeky (keeps it classy)' },
]
const SENTENCE_CATEGORIES = [
  { id: 'SWEET', name: 'Sweet', emoji: '💗', blurb: 'Appreciation & affection' },
  { id: 'DEEP', name: 'Deep', emoji: '🌙', blurb: 'Feelings & dreams' },
  { id: 'FUN', name: 'Fun', emoji: '🎉', blurb: 'Playful & lighthearted' },
]
const LEVELS = [
  { id: 'SWEET', name: 'Sweet', emoji: '🌸', blurb: 'Wholesome & heart-warming' },
  { id: 'FUN', name: 'Fun', emoji: '🎈', blurb: 'Silly, playful & laugh-out-loud' },
  { id: 'SPICY', name: 'Flirty', emoji: '🔥', blurb: 'Cheeky & flirty (18+)' },
]
const DECK_CHOICES = [
  { id: 'SET1', name: 'Set I · Warm-up', emoji: '🌱', blurb: 'Light, curious and easy to start with' },
  { id: 'SET2', name: 'Set II · Getting closer', emoji: '🌿', blurb: 'More personal, still gentle' },
  { id: 'SET3', name: 'Set III · Deep end', emoji: '🌌', blurb: 'Vulnerable and meaningful' },
  { id: 'DATE', name: 'Date-night starters', emoji: '🕯️', blurb: 'Fun conversation for any evening' },
]

export type GameId =
  | 'quiz' | 'knowme' | 'tod' | 'wyr' | 'likely' | 'nhie' | 'sentence' | 'lovelang' | 'deep' | 'ttt' | 'c4' | 'memory'
  | 'tunein' | 'meld' | 'rank' | 'lie' | 'hunt' | 'story'
export const GROUP_ORDER = ['Sync', 'Get to know', 'Party', 'Deep', 'Board'] as const
export type GameGroup = (typeof GROUP_ORDER)[number]

export type Choice = { id: string; name: string; emoji: string; blurb: string }
export type GameDef = {
  id: GameId
  title: string
  tagline: string
  emoji: string
  group: GameGroup
  gradient: string
  duration: string
  badge?: 'Popular' | 'New' | 'Classic'
  featured?: boolean
  /** short line about why it is fun, shown on the card */
  hook?: string
  /** a pre-game choice (category, level, deck) */
  option?: { key: 'category' | 'level' | 'deck'; label: string; choices: Choice[]; default: string; adultOnly?: string[] }
}

const mixed: Choice = { id: 'MIXED', name: 'Mix it up', emoji: '🎲', blurb: 'A bit of everything' }
const withMixed = (list: readonly Choice[]): Choice[] => [mixed, ...list]

export const GAMES: GameDef[] = [
  {
    id: 'knowme', title: 'How Well Do You Know Me?', tagline: 'Answer about yourself, then guess your partner. Who knows who better?',
    emoji: '🔮', group: 'Get to know', gradient: 'from-fuchsia-500 to-purple-600', duration: '10 min', badge: 'Popular', featured: true,
  },
  {
    id: 'quiz', title: 'Same Wavelength', tagline: 'Answer separately — then see if you picked the same thing.',
    emoji: '💞', group: 'Sync', gradient: 'from-pink-500 to-rose-500', duration: '8 min',
    option: { key: 'category', label: 'Pick a vibe', choices: withMixed(QUIZ_CATEGORIES), default: 'MIXED' },
  },
  {
    id: 'lovelang', title: 'Love Language Test', tagline: 'Discover how each of you feels loved and how to love each other better.',
    emoji: '💌', group: 'Get to know', gradient: 'from-rose-500 to-orange-400', duration: '5 min', badge: 'New',
  },
  {
    id: 'tod', title: 'Truth or Dare', tagline: 'Turn by turn, with your partner as the judge. Sweet, fun or flirty.',
    emoji: '🔥', group: 'Party', gradient: 'from-amber-500 to-rose-600', duration: 'Endless', badge: 'Popular', featured: true,
    option: { key: 'level', label: 'Choose the heat', choices: LEVELS, default: 'FUN', adultOnly: ['SPICY'] },
  },
  {
    id: 'wyr', title: 'Would You Rather', tagline: 'Pick your side in secret, then reveal and debate.',
    emoji: '🤔', group: 'Party', gradient: 'from-indigo-500 to-blue-500', duration: '8 min',
    option: { key: 'category', label: 'Pick a vibe', choices: withMixed(WYR_CATEGORIES), default: 'MIXED' },
  },
  {
    id: 'likely', title: 'Who\'s More Likely To…', tagline: 'Point at each other. Do you agree on who?',
    emoji: '👉', group: 'Party', gradient: 'from-teal-500 to-emerald-500', duration: '8 min',
    option: { key: 'category', label: 'Pick a vibe', choices: withMixed(LIKELY_CATEGORIES), default: 'MIXED' },
  },
  {
    id: 'nhie', title: 'Never Have I Ever', tagline: 'Confess, laugh and learn something new about each other.',
    emoji: '🙊', group: 'Party', gradient: 'from-orange-500 to-red-500', duration: '8 min',
    option: { key: 'category', label: 'Pick a vibe', choices: withMixed(NHIE_CATEGORIES), default: 'MIXED' },
  },
  {
    id: 'sentence', title: 'Finish the Sentence', tagline: 'Complete sweet, funny and deep prompts about each other, revealed together.',
    emoji: '✍️', group: 'Deep', gradient: 'from-violet-500 to-fuchsia-500', duration: '10 min',
    option: { key: 'category', label: 'Pick a vibe', choices: withMixed(SENTENCE_CATEGORIES), default: 'MIXED' },
  },
  {
    id: 'deep', title: 'Deep Talk', tagline: 'Conversation cards, including the famous "36 questions to fall in love".',
    emoji: '🌌', group: 'Deep', gradient: 'from-slate-600 to-indigo-700', duration: '30 min', badge: 'Classic',
    option: {
      key: 'deck', label: 'Choose a deck',
      choices: DECK_CHOICES,
      default: 'SET1',
    },
  },
  {
    id: 'ttt', title: 'Tic-Tac-Toe', tagline: 'A quick duel. Best of as many rounds as you like.',
    emoji: '⭕', group: 'Board', gradient: 'from-cyan-500 to-sky-600', duration: '3 min',
  },
  {
    id: 'c4', title: 'Connect Four', tagline: 'Drop your discs and line up four before your partner does.',
    emoji: '🔴', group: 'Board', gradient: 'from-red-500 to-yellow-500', duration: '10 min',
  },
  {
    id: 'memory', title: 'Memory Match', tagline: 'Flip cards and find the pairs. Remember where your partner missed.',
    emoji: '🃏', group: 'Board', gradient: 'from-emerald-500 to-cyan-500', duration: '5 min',
  },
  {
    id: 'tunein', title: 'Tune In', tagline: 'One gives a clue, the other finds it on the dial. Score together.',
    emoji: '📻', group: 'Sync', gradient: 'from-violet-500 to-fuchsia-500', duration: '10 min', badge: 'New', featured: true,
    hook: 'Are you really on the same wavelength?',
  },
  {
    id: 'meld', title: 'Meet in the Middle', tagline: 'Start with two random words. Keep bridging until you both say the SAME word.',
    emoji: '🧠', group: 'Sync', gradient: 'from-sky-500 to-indigo-500', duration: '5 min', badge: 'New', featured: true,
    hook: 'How few rounds can you do it in?',
  },
  {
    id: 'rank', title: 'Rank & Reveal', tagline: 'Secretly rank five things, then see how alike your tastes really are.',
    emoji: '📊', group: 'Sync', gradient: 'from-emerald-500 to-teal-500', duration: '8 min', badge: 'New',
  },
  {
    id: 'lie', title: 'Spot the Lie', tagline: 'Two truths and a lie about yourself. Can your partner spot the lie?',
    emoji: '🤥', group: 'Party', gradient: 'from-rose-500 to-red-600', duration: '6 min', badge: 'New',
    hook: 'Find out who is the better liar 😏',
  },
  {
    id: 'story', title: 'Once Upon Us', tagline: 'Write a story together, one sentence each. It gets wild fast.',
    emoji: '📖', group: 'Deep', gradient: 'from-amber-500 to-orange-500', duration: '10 min', badge: 'New',
  },
  {
    id: 'hunt', title: 'Heart Hunt', tagline: 'Hide three hearts on a secret grid and find your partner\'s first.',
    emoji: '💘', group: 'Board', gradient: 'from-pink-500 to-red-500', duration: '6 min', badge: 'New',
    hook: 'A hit earns another shot!',
  },
]

export const gameById = (id: string) => GAMES.find((g) => g.id === id)
