/**
 * Daily Spark prompts: one tiny ritual per day, done by both partners.
 *   pick   choose one option (mood check-ins, preferences)
 *   write  a short written answer, revealed when both have written
 *   do     a real-life mini challenge, tap "done" when you did it
 * {a}/{b} are player names; {partner}/{me} are rendered per viewer.
 */
export type SparkKind = 'pick' | 'write' | 'do'
export type SparkPrompt = { id: string; kind: SparkKind; text: string; options?: string[] }

const MOOD = 'Great 😄|Good 🙂|Okay 😐|A bit low 😔|Tired 😴'

const pick = (rows: [string, string][]): SparkPrompt[] =>
  rows.map(([text, opts], i) => ({ id: `spark.pick.${i + 1}`, kind: 'pick', text, options: opts.split('|').map((o) => o.trim()) }))
const write = (rows: string[]): SparkPrompt[] => rows.map((text, i) => ({ id: `spark.write.${i + 1}`, kind: 'write', text }))
const doIt = (rows: string[]): SparkPrompt[] => rows.map((text, i) => ({ id: `spark.do.${i + 1}`, kind: 'do', text }))

export const SPARK_PROMPTS: SparkPrompt[] = [
  ...pick([
    ['How are you feeling today, honestly?', MOOD],
    ['How is your energy right now?', 'Fully charged ⚡|Steady 🔋|Running low 🪫|Need a hug 🫂'],
    ['What would make today better for you?', 'A hug 🤗|A funny message 😂|Some quiet time 🎧|A treat 🍫|A long call 📞'],
    ['What are you craving tonight?', 'Something spicy 🌶️|Something sweet 🍰|Comfort food 🍜|Just chai ☕'],
    ['What should {a} and {b} do this weekend?', 'A slow lazy day 🛌|A little adventure 🥾|A movie marathon 🍿|Try a new café ☕'],
    ['Pick a vibe for our next date', 'Cosy at home 🕯️|Street-food walk 🌮|Fancy dinner 🍷|Sunset drive 🌅'],
    ['Which love language do you need most this week?', 'Kind words 💌|Time together ⏳|A thoughtful gift 🎁|A helping hand 🛠️|Cuddles 🤗'],
    ['How connected do you feel to {partner} today?', 'Super close 💞|Pretty good 🙂|A little distant 🌫️|Let us talk tonight 🗣️'],
    ['Pick a song mood for today', 'Romantic 🎻|Party 🎉|Chill 🌙|Nostalgic 📻'],
    ['If you could teleport for dinner, where would {a} and {b} eat?', 'Paris 🥐|Tokyo 🍣|Naples 🍕|Home, with home-cooked food 🏠'],
    ['What is your mood for tonight?', 'Cuddle & chill 🛋️|Go out & play 🎳|Talk for hours 💬|Early sleep 😴'],
    ['How was your day, in one pick?', 'Amazing ✨|Fine 👍|Stressful 😵|Rough 🌧️'],
    ['Which little thing would you love from {partner} today?', 'A good-morning text ☀️|A surprise call 📞|A photo of them 📸|A compliment 💬'],
    ['Pick our next mini-adventure', 'A new restaurant 🍽️|A short trip 🚗|A game night 🎲|A long walk 🌳'],
    ['What is one word for how today feels?', 'Bright ☀️|Busy 📆|Peaceful 🕊️|Heavy 🪨'],
  ]),
  ...write([
    'One thing {partner} did recently that made you smile…',
    'Something you are grateful to {partner} for today…',
    'The best part of your day so far was…',
    'A tiny thing about {partner} that you adore…',
    'Something you are looking forward to with {partner}…',
    'A memory with {partner} that popped into your head lately…',
    'One thing you would like more of in your life right now…',
    'What is one thing that made you laugh today?',
    'One thing {partner} could do that would make your week easier…',
    'A compliment for {partner} that you have not said in a while…',
    'Something you learned about yourself recently…',
    'Something you want to try together before the year ends…',
    'What is worrying you a little today? (It is safe to share.)',
    'Describe {partner} in exactly three words…',
    'A song that matches your mood today, and why…',
    'What does a perfect lazy Sunday with {partner} look like?',
    'Something small you are proud of this week…',
    'One thing you admire about how {partner} handles stress…',
    'If today were a movie scene, what would it be called?',
    'A wish you have for {partner} this week…',
  ]),
  ...doIt([
    'Send {partner} a voice note telling them one thing you love about them. Tap done once you have.',
    'Give {partner} a proper 20-second hug today. Tap done afterwards.',
    'Text {partner} a photo of something that reminded you of them.',
    'Tell {partner} three things you appreciate about them, out loud or on a call.',
    'Do one small chore that {partner} usually does, without being asked.',
    'Share a favourite photo of the two of you and tell the story behind it.',
    'Put your phones away for 15 minutes and just talk.',
    'Plan the next date together in 5 minutes: where, when and what to wear.',
    'Compliment {partner} on something you have never mentioned before.',
    'Make a tiny gift for {partner}: a note, a doodle or a playlist.',
  ]),
]

export const sparkById = (id: string) => SPARK_PROMPTS.find((p) => p.id === id)
