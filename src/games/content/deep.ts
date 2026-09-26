/**
 * Deep Talk: the 36 questions from Arthur Aron's closeness study (1997), lightly reworded, plus
 * two extra sets. Each card is read aloud by one partner and answered by BOTH.
 */
export type DeckId = 'SET1' | 'SET2' | 'SET3' | 'DATE'

export const DECKS: Record<DeckId, { name: string; emoji: string; blurb: string; cards: string[] }> = {
  SET1: {
    name: 'Set I · Warm-up',
    emoji: '🌱',
    blurb: 'Light, curious and easy to start with',
    cards: [
      'If you could invite anyone in the world to dinner, who would it be?',
      'Would you like to be famous? In what way?',
      'Before making a phone call, do you ever rehearse what you will say? Why?',
      'What would a "perfect day" look like for you?',
      'When did you last sing to yourself? And to someone else?',
      'You can keep either the mind or the body of a 30-year-old until you are 90. Which one?',
      'Do you have a secret hunch about how you will die?',
      'Name three things you think {a} and {b} have in common.',
      'What in your life are you most grateful for?',
      'If you could change one thing about how you were raised, what would it be?',
      'Take four minutes and tell your partner your life story in as much detail as you can.',
      'If you could wake up tomorrow with one new quality or ability, what would it be?',
    ],
  },
  SET2: {
    name: 'Set II · Getting closer',
    emoji: '🌿',
    blurb: 'More personal, still gentle',
    cards: [
      'If a crystal ball could tell you the truth about anything, what would you ask?',
      'Is there something you have dreamed of doing for a long time? Why have you not done it?',
      'What is the greatest accomplishment of your life so far?',
      'What do you value most in a friendship?',
      'What is your most treasured memory?',
      'What is your most terrible memory?',
      'If you knew you would die in a year, would you change how you live now? Why?',
      'What does friendship mean to you?',
      'What roles do love and affection play in your life?',
      'Take turns sharing something you like about your partner. Share five things each.',
      'How close and warm is your family? Was your childhood happier than most?',
      'How do you feel about your relationship with your mother?',
    ],
  },
  SET3: {
    name: 'Set III · Deep end',
    emoji: '🌌',
    blurb: 'Vulnerable and meaningful',
    cards: [
      'Each say three true "we" statements, e.g. "We are both in this room feeling…"',
      'Complete this sentence: "I wish I had someone with whom I could share…"',
      'If you were to become a very close friend of your partner, what would be important for them to know?',
      'Tell your partner what you like about them. Be honest, and say things you might not say to someone you just met.',
      'Share an embarrassing moment from your life.',
      'When did you last cry in front of another person? And by yourself?',
      'Tell your partner something you already like about them.',
      'What, if anything, is too serious to be joked about?',
      'If you died tonight with no chance to speak to anyone, what would you most regret not telling someone? Why have you not told them?',
      'Your home catches fire. After saving your loved ones and pets, you can save one more item. What is it and why?',
      'Of everyone in your family, whose death would disturb you most? Why?',
      'Share a personal problem and ask your partner how they would handle it. Ask them to reflect how you seem to feel about it.',
    ],
  },
  DATE: {
    name: 'Date-night starters',
    emoji: '🕯️',
    blurb: 'Fun conversation for any evening',
    cards: [
      'What is one small thing {a} or {b} did recently that made you feel cared for?',
      'If we could teleport for one night, where would we go and what would we eat?',
      'What is a memory of us you would put in a time capsule?',
      'What is something new you would love us to learn together this year?',
      'What is one thing you admired about your partner when you first met?',
      'What is a tradition you want us to create?',
      'Which moment from this year made you proudest of us?',
      'What is something you have been afraid to ask for, but would love?',
      'How can we make our ordinary days feel more special?',
      'If we wrote a book about our love story, what would the title be?',
      'What is one dream you want us to chase together in the next five years?',
      'What is one thing you want to say "thank you" for today?',
    ],
  },
}
