/**
 * Truth or Dare cards. {p} = the person doing the card, {o} = their partner.
 * Levels: SWEET (wholesome), FUN (silly & playful), SPICY (flirty, never explicit).
 */
export type Level = 'SWEET' | 'FUN' | 'SPICY'
export type TodCard = { id: string; type: 'TRUTH' | 'DARE'; level: Level; text: string }

const t = (level: Level, texts: string[]): TodCard[] =>
  texts.map((text, i) => ({ id: `tod.T.${level}.${i + 1}`, type: 'TRUTH', level, text }))
const d = (level: Level, texts: string[]): TodCard[] =>
  texts.map((text, i) => ({ id: `tod.D.${level}.${i + 1}`, type: 'DARE', level, text }))

export const TOD_CARDS: TodCard[] = [
  ...t('SWEET', [
    '{p}, what was the exact moment you realised you were falling for {o}?',
    '{p}, what is one compliment about {o} you have never said out loud?',
    '{p}, what does {o} do that makes your heart melt?',
    '{p}, what is your favourite memory of you and {o} together?',
    '{p}, what is one thing {o} has taught you about love?',
    '{p}, when did you feel most proud of {o}?',
    '{p}, what do you admire most about {o}\'s character?',
    '{p}, what small detail from your early days with {o} do you still remember?',
    '{p}, what is one thing you are really grateful to {o} for?',
    '{p}, what is one dream you would love to chase with {o}?',
  ]),
  ...d('SWEET', [
    '{p}, give {o} a 30-second shoulder or head massage.',
    '{p}, look into {o}\'s eyes for 20 seconds without laughing or blinking.',
    '{p}, whisper three genuine compliments in {o}\'s ear.',
    '{p}, hold {o}\'s hands and tell them your favourite memory together.',
    '{p}, write {o} a two-line love poem right now and read it aloud.',
    '{p}, give {o} the longest, tightest hug you can for 15 seconds.',
    '{p}, tell {o} three things you love about their smile, eyes or laugh.',
    '{p}, plan a mini date for this week and tell {o} the details.',
    '{p}, sing one line of a love song to {o}.',
    '{p}, say "thank you" to {o} for three specific things.',
  ]),
  ...t('FUN', [
    '{p}, what is the funniest thing you secretly worried about on your first date with {o}?',
    '{p}, if you could change one funny habit of {o}\'s, what would it be?',
    '{p}, what is the most embarrassing song on your playlist?',
    '{p}, what is the silliest lie you have ever told {o}?',
    '{p}, what is the weirdest thing you have ever googled?',
    '{p}, what is your most unpopular food opinion?',
    '{p}, which of {o}\'s outfits do you secretly find hilarious?',
    '{p}, what is your worst habit that {o} tolerates?',
    '{p}, what is the most childish thing you still do?',
    '{p}, if you were stuck in a lift with {o} for two hours, what would you do first?',
  ]),
  ...d('FUN', [
    '{p}, do a dramatic 15-second dance performance for {o}.',
    '{p}, send {o} a goofy selfie or a funny voice note right now.',
    '{p}, talk in an accent of {o}\'s choice for the next three rounds.',
    '{p}, act out your favourite movie scene and let {o} guess it.',
    '{p}, do your best impression of {o}.',
    '{p}, balance something on your head and walk across the room without dropping it.',
    '{p}, tell a joke. {o} rates it from 1 to 10 and you have to do a forfeit if it is under 5.',
    '{p}, let {o} draw a small doodle on your hand.',
    '{p}, sing your favourite song like an opera singer.',
    '{p}, pose for a ridiculous couple photo with {o}.',
  ]),
  ...t('SPICY', [
    '{p}, what is your favourite thing about how {o} kisses?',
    '{p}, what is a romantic fantasy you have about the two of you?',
    '{p}, what did you first find attractive about {o}?',
    '{p}, when did you last blush because of {o}?',
    '{p}, what outfit of {o}\'s drives you a little crazy?',
    '{p}, what is the most romantic place you would love to kiss {o}?',
    '{p}, what is one thing {o} does that instantly gives you butterflies?',
    '{p}, on a scale of 1 to 10, how flirty are you with {o} and why?',
  ]),
  ...d('SPICY', [
    '{p}, give {o} a slow 10-second kiss.',
    '{p}, whisper something flirty in {o}\'s ear.',
    '{p}, kiss {o} somewhere unexpected (keep it classy!).',
    '{p}, give {o} a one-minute back or neck massage.',
    '{p}, describe {o} in three words, in your sexiest voice.',
    '{p}, trace a heart on {o}\'s back and let them guess what you drew.',
    '{p}, tell {o} the top three things you find irresistible about them.',
    '{p}, give {o} your best flirty look for 10 seconds.',
  ]),
]
