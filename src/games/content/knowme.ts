import { build } from '../text.ts'

/**
 * How Well Do You Know Me? {who} is the person the question is about.
 * Options are neutral (no "me"/"you") so they read the same for both partners.
 */
export const KNOWME = build('knowme', [
  ['LIFE', 'What is {who}\'s ideal way to spend a free Sunday?', 'Sleeping in & binge-watching 🛌|Brunch with friends 🥞|A hike or a long drive 🥾|Getting things done at home 🧹'],
  ['LIFE', 'How does {who} recharge after a stressful day?', 'Quiet time with music 🎧|Talking it all out 🗣️|Comfort food 🍜|A workout or a walk 🏃'],
  ['FOOD', 'What would {who} pick as a last meal?', 'Biryani 🍛|Pizza 🍕|Pasta 🍝|Desserts & ice cream 🍨'],
  ['FOOD', 'What is {who}\'s morning drink?', 'Chai ☕|Coffee ☕|Juice or cold drink 🧃|Just water 💧'],
  ['FOOD', 'Which snack would {who} never say no to?', 'Chips & namkeen 🥔|Chocolate 🍫|Street chaat 🌮|Fresh fruit 🍓'],
  ['FUN', 'What is {who}\'s go-to comfort watch?', 'Rom-coms 💞|Thrillers 🔪|Comedy 😂|Fantasy or anime ✨'],
  ['FUN', 'Which app does {who} open the most?', 'Instagram 📸|YouTube ▶️|WhatsApp 💬|A game 🎮'],
  ['FUN', 'How would {who} spend a surprise ₹10,000?', 'New gadgets 📱|Clothes & shoes 👟|Food & experiences 🍽️|Save it all 🏦'],
  ['FUN', 'What is {who}\'s dream travel style?', 'Luxury resort 🏨|Backpacking on a budget 🎒|A road trip 🚗|Culture & city tours 🏛️'],
  ['FUN', 'What superpower would {who} choose?', 'Teleportation 🌀|Time travel ⏳|Reading minds 🧠|Invisibility 👻'],
  ['FUN', 'How does {who} celebrate a birthday?', 'A big party 🎉|A quiet dinner for two 🕯️|A surprise trip ✈️|Sleeping all day 😴'],
  ['PERSONALITY', 'What is {who}\'s biggest pet peeve?', 'Loud chewing 😖|People being late ⏰|A messy room 🧦|Slow replies 📵'],
  ['PERSONALITY', 'When {who} is upset, they usually…', 'Go quiet 🤐|Talk it out right away 🗣️|Need some space 🚪|Crack jokes to cope 🤡'],
  ['PERSONALITY', 'Is {who} more of a…', 'Early bird 🌅|Night owl 🦉|Depends on the day 🤷|Napper at any hour 😴'],
  ['PERSONALITY', 'What does {who} overthink the most?', 'Things they said 💭|The future 🔮|What others think 👀|Work or studies 📚'],
  ['PERSONALITY', 'What is {who}\'s biggest fear?', 'Heights 🏔️|Bugs & lizards 🦎|Being alone 🌑|Failing 📉'],
  ['PERSONALITY', 'How would {who} handle a surprise party for themselves?', 'Love it, full drama 🥳|Cry happy tears 🥹|Pretend to be shocked 😅|Hate it, secretly 😬'],
  ['LOVE', 'What is {who}\'s favourite way to be surprised?', 'A thoughtful gift 🎁|A planned trip ✈️|A home-cooked meal 🍲|A handwritten note 💌'],
  ['LOVE', 'What does {who} love most about a date night?', 'The food 🍽️|The conversation 💬|The outfit & getting ready 👗|Coming home together 🏠'],
  ['LOVE', 'Which romantic gesture melts {who} the most?', 'A long hug 🤗|A compliment out of nowhere 💌|Remembering small things 🧠|Doing chores for them 🧺'],
  ['LOVE', 'What is {who}\'s idea of a perfect proposal or big moment?', 'Private & intimate 🕯️|Big public surprise 🎊|In a beautiful place 🏞️|With family present 👨‍👩‍👧'],
  ['CHILDHOOD', 'What was {who} like as a kid?', 'A little troublemaker 😈|Shy & quiet 🤫|Class topper 📚|Always outside playing ⚽'],
  ['CHILDHOOD', 'What was {who}\'s favourite childhood activity?', 'Cartoons 📺|Cricket or outdoor games 🏏|Drawing & crafts 🎨|Reading stories 📖'],
  ['DAILY', 'What is {who}\'s typical bedtime routine?', 'Phone until they drop 📱|A book or a show 📖|Skincare & sleep 🧴|Overthinking in the dark 🌙'],
  ['DAILY', 'How does {who} handle mornings?', 'Alarm, snooze, snooze, snooze ⏰|Up & energetic 🌞|Needs coffee first ☕|Rushes out the door 🏃'],
  ['DAILY', 'What does {who} usually do while waiting in a queue?', 'Scroll the phone 📱|Chat with strangers 💬|People-watch 👀|Complain politely 😤'],
  ['DREAMS', 'What would {who} love to learn next?', 'A new language 🗣️|An instrument 🎸|Cooking like a chef 👩‍🍳|Something outdoorsy 🧗'],
  ['DREAMS', 'Where would {who} most want to travel next?', 'Europe 🗼|Japan or Korea 🎌|A beach paradise 🏝️|The mountains 🏔️'],
  ['DREAMS', 'What matters most to {who} in life right now?', 'Career & growth 🚀|Family & relationships 👨‍👩‍👧|Health & peace 🧘|Fun & adventure 🎢'],
  ['HABITS', 'How is {who} in the kitchen?', 'Master chef 👨‍🍳|Can just about make maggi 🍜|Only assists (and tastes) 🥄|Orders in, always 📱'],
  ['HABITS', 'What is {who}\'s texting style?', 'Long paragraphs 📜|Short & dry 🌵|Voice notes 🎙️|Memes only 😹'],
  ['HABITS', 'How does {who} feel about being on camera?', 'Loves selfies 🤳|Photogenic but shy 📷|Always hides 🙈|Only candid shots 🎞️'],
  ['HABITS', 'What is {who}\'s go-to karaoke or shower song vibe?', 'Bollywood classics 🎶|Pop hits 🎤|Rock & indie 🎸|Whatever is trending 📈'],
  ['MEMORIES', 'Which memory with their partner would {who} pick to relive?', 'Our first date 🌹|A special trip 🧳|A random perfect day ☀️|A moment we laughed the hardest 😂'],
  ['MEMORIES', 'What did {who} first notice about their partner?', 'The smile 😊|The eyes 👀|The sense of humour 😂|The kindness 💗'],
])
