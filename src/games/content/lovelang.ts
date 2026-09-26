export type LoveLang = 'WORDS' | 'TIME' | 'GIFTS' | 'SERVICE' | 'TOUCH'

export const LOVE_LANGS: Record<LoveLang, { name: string; emoji: string; blurb: string; tip: string }> = {
  WORDS: {
    name: 'Words of Affirmation',
    emoji: '💌',
    blurb: 'Feels loved through kind words, compliments and "I am proud of you".',
    tip: 'Send an unexpected message about something specific you admire.',
  },
  TIME: {
    name: 'Quality Time',
    emoji: '⏳',
    blurb: 'Feels loved through undivided attention and shared moments.',
    tip: 'Plan a phone-free hour together with no distractions.',
  },
  GIFTS: {
    name: 'Receiving Gifts',
    emoji: '🎁',
    blurb: 'Feels loved through thoughtful little surprises and keepsakes.',
    tip: 'Bring home something small that says "I was thinking of you".',
  },
  SERVICE: {
    name: 'Acts of Service',
    emoji: '🛠️',
    blurb: 'Feels loved when their load is shared and things get done for them.',
    tip: 'Quietly take care of a task they have been dreading.',
  },
  TOUCH: {
    name: 'Physical Touch',
    emoji: '🤗',
    blurb: 'Feels loved through hugs, cuddles and closeness.',
    tip: 'Offer a long hug or a shoulder rub when they least expect it.',
  },
}

/** Each pair covers one of the 10 unique combinations of the five languages. {partner} is rendered per viewer. */
export const LOVELANG_QUESTIONS: { id: string; text: string; options: [string, LoveLang][] }[] = [
  { id: 'll.1', text: 'I feel most loved when…', options: [['{partner} tells me how proud they are of me 💌', 'WORDS'], ['{partner} gives me a long, tight hug 🤗', 'TOUCH']] },
  { id: 'll.2', text: 'I feel most loved when…', options: [['{partner} plans a whole day just for us ⏳', 'TIME'], ['{partner} surprises me with a thoughtful gift 🎁', 'GIFTS']] },
  { id: 'll.3', text: 'I feel most loved when…', options: [['{partner} takes a chore off my plate 🛠️', 'SERVICE'], ['{partner} sends me a sweet, unexpected message 💌', 'WORDS']] },
  { id: 'll.4', text: 'I feel most loved when…', options: [['{partner} holds my hand or cuddles me 🤗', 'TOUCH'], ['{partner} gives me their full attention ⏳', 'TIME']] },
  { id: 'll.5', text: 'I feel most loved when…', options: [['{partner} brings me a little something they saw and thought of me 🎁', 'GIFTS'], ['{partner} helps me when I am overwhelmed 🛠️', 'SERVICE']] },
  { id: 'll.6', text: 'I feel most loved when…', options: [['{partner} says exactly why they love me 💌', 'WORDS'], ['{partner} spends a lazy afternoon just with me ⏳', 'TIME']] },
  { id: 'll.7', text: 'I feel most loved when…', options: [['{partner} kisses me hello and goodbye 🤗', 'TOUCH'], ['{partner} remembers and gives me a small gift 🎁', 'GIFTS']] },
  { id: 'll.8', text: 'I feel most loved when…', options: [['{partner} fixes or handles something for me 🛠️', 'SERVICE'], ['{partner} puts their phone away to talk with me ⏳', 'TIME']] },
  { id: 'll.9', text: 'I feel most loved when…', options: [['{partner} gives me a keepsake with meaning 🎁', 'GIFTS'], ['{partner} writes me a heartfelt note 💌', 'WORDS']] },
  { id: 'll.10', text: 'I feel most loved when…', options: [['{partner} snuggles up next to me 🤗', 'TOUCH'], ['{partner} makes my day easier without being asked 🛠️', 'SERVICE']] },
]
