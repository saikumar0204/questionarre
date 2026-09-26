import { build } from '../text.ts'

/** Same Wavelength: both partners answer separately, then see if they picked the same thing. */
export const QUIZ = build('quiz', [
  // ROMANTIC
  ['ROMANTIC', 'What is our ideal weekend date?', 'Cozy movie night & takeout 🍕|Spontaneous road trip 🚗|Fancy dinner & dressing up 🍷|Street-food walk & chai stop ☕'],
  ['ROMANTIC', 'Which love language do {a} and {b} speak most as a couple?', 'Words of affirmation 💌|Quality time ⏳|Physical touch 🤗|Gifts 🎁|Acts of service 🛠️'],
  ['ROMANTIC', 'What makes {a} feel most loved by {b}?', 'Surprise hugs & kisses 😘|Deep late-night talks 🌙|Their favourite snack showing up 🧁|Help when stressed 💆'],
  ['ROMANTIC', 'What makes {b} feel most loved by {a}?', 'Surprise hugs & kisses 😘|Deep late-night talks 🌙|Their favourite snack showing up 🧁|Help when stressed 💆'],
  ['ROMANTIC', 'How would we describe the very first spark between {a} and {b}?', 'Instant lightning ⚡|A slow, sweet burn 🌱|Friends first, then more 🤝|Awkward but adorable 😅'],
  ['ROMANTIC', 'What is our ultimate superpower as a couple?', 'Finishing each other\'s sentences 🧠|Best travel partners 🗺️|Unstoppable problem-solving team 🧩|Making fun out of anything 🎉'],
  ['ROMANTIC', 'Who is the more romantic one, {a} or {b}?', '{a} 💐|{b} 💐|Equally romantic 💞'],
  ['ROMANTIC', 'Where do {a} and {b} feel most peaceful together?', 'Cuddling on a rainy morning 🌧️|Sitting quietly with chai ☕|Walking hand-in-hand 🌳|Stargazing at night 🌌'],
  ['ROMANTIC', 'Which season feels most romantic for us?', 'Monsoon: rain, pakoras & playlists 🌧️|Winter: blankets & hot chocolate ❄️|Spring: flowers & picnics 🌸|Summer: beaches & sunset drives 🌅'],
  ['ROMANTIC', 'Who says "I love you" first more often, {a} or {b}?', '{a} 💌|{b} 💌|Usually at the same time 💞'],
  ['ROMANTIC', 'What couple nickname fits {a} and {b} best?', 'The Power Couple 👑|The Cozy Lovebirds 🐣|The Chaos Duo 🌪️|The Best-Friend Soulmates 👯'],
  ['ROMANTIC', 'What is the sweetest thing {a} and {b} do for each other?', 'Plan surprise dates 🌃|Comfort each other on bad days 🫂|Remember tiny details 💡|Write notes & messages 📝'],

  // PLAYFUL
  ['PLAYFUL', 'Who is the bigger drama queen/king when sick?', '{a} 🤒|{b} 🤒|Both, full hospital mode 🏥|Neither, we are super-soldiers 💪'],
  ['PLAYFUL', 'Who takes longer to get ready before going out?', '{a} 🪞|{b} 🪞|Both of us take forever 🐢|We are both fast ⚡'],
  ['PLAYFUL', 'In a horror movie, who survives longer?', '{a} 🏃|{b} 🧠|We survive together as a duo 💥|We get eaten in the first 5 minutes 🧟'],
  ['PLAYFUL', 'Who controls the TV remote or Spotify queue?', '{a} 🎧|{b} 📺|We playfully fight over it 🥊|Smooth 50/50 compromise 🤝'],
  ['PLAYFUL', 'Who is more likely to buy something unnecessary online at 2 AM?', '{a} 🛒|{b} 📦|Both of us 📬|Neither, we budget strictly 💰'],
  ['PLAYFUL', 'Who usually apologises first after a silly fight?', '{a} 🕊️|{b} 🫂|We both crack up halfway 🤣|We agree to disagree 🤝'],
  ['PLAYFUL', 'Who is the blanket thief at night?', '{a} 🛌|{b} 😴|Equally guilty 🐙|Perfectly balanced ⚖️'],
  ['PLAYFUL', 'Who would win a spicy food challenge?', '{a} 🌶️|{b} 🌋|Both crying after one bite 😭|Both of us love it extra spicy 😋'],
  ['PLAYFUL', 'Who has the worse sense of direction?', '{a} 🧭|{b} 🧭|Google Maps is our third wheel 📍|We both get lost happily 🚗'],
  ['PLAYFUL', 'Who falls asleep first during a movie?', '{a} 😴|{b} 😴|Both, in under 20 minutes 🍿|Neither, we stay up for the ending 👀'],
  ['PLAYFUL', 'Who is the better cook?', '{a} 👩‍🍳|{b} 👨‍🍳|We are equally good together 🍳|Zomato is our best chef 📱'],
  ['PLAYFUL', 'Who replies to texts slower?', '{a} 📵|{b} 📵|Both, we call instead 📞|Neither, instant replies ⚡'],

  // DREAMS
  ['DREAMS', 'Where should our next dream vacation be?', 'Tropical beach resort 🏝️|Cozy mountain cabin 🏔️|Historic European city 🏰|Safari or theme-park adventure 🎢'],
  ['DREAMS', 'What is our dream home vibe?', 'Modern apartment with skyline views 🏙️|Countryside cottage with a garden 🌻|Beachfront house 🐚|Smart minimalist home 🌿'],
  ['DREAMS', 'What pet should {a} and {b} get one day?', 'A golden retriever 🐶|A fluffy cat 🐱|Both a dog and a cat 🐾|No pets, we travel the world ✈️'],
  ['DREAMS', 'What milestone are we most excited to celebrate next?', 'A big anniversary trip 🎉|Moving in together 🔑|Adopting a pet 🐶|Hitting our career goals 🚀'],
  ['DREAMS', 'In 10 years, how will people describe {a} and {b}?', 'The couple that never stopped dating 🔥|The power couple 💼|The warm, hospitable hosts 🏡|The world travellers 🌍'],
  ['DREAMS', 'If {a} and {b} started a business together, it would be…', 'A cozy café & bakery ☕|A boutique travel agency ✈️|A creative design studio 🎨|A cute homestay 🏡'],
  ['DREAMS', 'Which new hobby should we try together?', 'Salsa or ballroom dancing 💃|Pottery & cooking class 🏺|Scuba diving or surfing 🤿|Trekking & camping ⛺'],
  ['DREAMS', 'What would be our ultimate road-trip vehicle?', 'Convertible with the top down 🏎️|Rugged 4x4 for off-roading 🚙|Camper van 🚐|Sleek electric SUV ⚡'],
  ['DREAMS', 'Which tradition should we start every festive season?', 'Matching outfits & sweet treats 🍬|Baking or cooking for friends 🍪|A yearly getaway just for us ✈️|Writing each other a love letter 📖'],
  ['DREAMS', 'What is the biggest promise {a} and {b} make for the future?', 'Support each other\'s dreams 🌟|Never stop laughing & flirting 😂|Keep exploring the world 🌍|Always talk openly with love 🤝'],
  ['DREAMS', 'Where would {a} and {b} live in a perfect world?', 'A big buzzing city 🌆|A calm hill town 🏔️|A beach town 🌴|A quiet village with land 🌾'],
  ['DREAMS', 'What should be our first big shared goal?', 'Travel to a new country 🛫|Save for our dream home 🏠|Start a project together 💡|Get fit & healthy together 🏋️'],
])
