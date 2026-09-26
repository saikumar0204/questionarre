/* ---------- Tune In: spectrum cards ---------- */
export type Spectrum = { id: string; left: string; right: string }
const sp = (rows: [string, string][]): Spectrum[] => rows.map(([left, right], i) => ({ id: `spectrum.${i + 1}`, left, right }))

export const SPECTRA: Spectrum[] = sp([
  ['Cold', 'Hot'],
  ['Overrated', 'Underrated'],
  ['Terrible first-date idea', 'Perfect first-date idea'],
  ['Not romantic at all', 'Ridiculously romantic'],
  ['Tiny snack', 'Full meal'],
  ['Early bird habit', 'Night owl habit'],
  ['Whisper quiet', 'Stadium loud'],
  ['Easy to cook', 'Chef-level hard'],
  ['Guilty pleasure', 'Proud pleasure'],
  ['Would never wear', 'Would wear every day'],
  ['Boring movie', 'Edge-of-your-seat movie'],
  ['Rain is gloomy', 'Rain is romantic'],
  ['Cheap gift', 'Priceless gift'],
  ['Green flag', 'Red flag'],
  ['Lazy Sunday', 'Party Saturday'],
  ['Bad haircut', 'Great haircut'],
  ['Safe & predictable', 'Wild adventure'],
  ['Awkward', 'Smooth'],
  ['Introvert activity', 'Extrovert activity'],
  ['Sad song', 'Happy song'],
  ['Tiny problem', 'Huge problem'],
  ['Bad idea at 2 AM', 'Great idea at 2 AM'],
  ['Outdated', 'Trendy'],
  ['Nobody has heard of it', 'Everybody knows it'],
  ['Lazy', 'Productive'],
  ['Terrible chai', 'Perfect chai'],
  ['Bad pickup line', 'Smooth pickup line'],
  ['Small talk', 'Deep talk'],
  ['Homebody thing', 'Adventurer thing'],
  ['Cringe', 'Cool'],
  ['Mild spice', 'Fire spice'],
  ['Not a couple thing', 'Very much a couple thing'],
  ['Weekend getaway', 'Month-long trip'],
  ['Bad movie snack', 'Perfect movie snack'],
  ['Rare', 'Common'],
  ['Gentle', 'Intense'],
  ['Just friends', 'Soulmates'],
  ['Forgettable', 'Unforgettable'],
  ['Silly', 'Serious'],
  ['Old-school romance', 'Modern romance'],
])

/* ---------- Meet in the Middle: start word pairs ---------- */
export const MELD_PAIRS: [string, string][] = [
  ['Pizza', 'Moon'], ['Beach', 'Winter'], ['Chai', 'Rocket'], ['Elephant', 'Umbrella'], ['Love', 'Money'],
  ['Sunrise', 'Bicycle'], ['Cricket', 'Chocolate'], ['Guitar', 'Ocean'], ['Mango', 'Snow'], ['Movie', 'Mountain'],
  ['Kiss', 'Thunder'], ['Diary', 'Airport'], ['Coffee', 'Dinosaur'], ['Wedding', 'Football'], ['Rain', 'Cake'],
  ['Bollywood', 'Robot'], ['Balloon', 'Library'], ['Candle', 'Train'], ['Tiger', 'Pillow'], ['Perfume', 'Volcano'],
  ['Diwali', 'Astronaut'], ['Popcorn', 'Castle'], ['Sunglasses', 'Midnight'], ['Butterfly', 'Cricket bat'], ['Honey', 'Lightning'],
  ['Dance', 'Desert'], ['Selfie', 'Jungle'], ['Notebook', 'Fireworks'], ['Biryani', 'Space'], ['Puppy', 'Skyscraper'],
]

/* ---------- Rank & Reveal ---------- */
export type RankPrompt = { id: string; title: string; items: string[] }
const rk = (rows: [string, string][]): RankPrompt[] => rows.map(([title, items], i) => ({ id: `rank.${i + 1}`, title, items: items.split('|').map((s) => s.trim()) }))

export const RANK_PROMPTS: RankPrompt[] = rk([
  ['Rank these date ideas, most tempting first', 'Candlelit dinner 🕯️|Sunrise trek 🥾|Movie marathon 🍿|Street-food crawl 🌮|Spontaneous road trip 🚗'],
  ['Rank these gifts, best first', 'Handwritten letter 💌|Surprise trip tickets ✈️|Home-cooked meal 🍲|Bouquet of flowers 💐|Custom photo book 📖'],
  ['Rank these superpowers, most wanted first', 'Teleportation 🌀|Time travel ⏳|Reading minds 🧠|Invisibility 👻|Flying 🦅'],
  ['Rank these snacks, favourite first', 'Chips 🥔|Chocolate 🍫|Pani puri 🥟|Popcorn 🍿|Fresh fruit 🍓'],
  ['Rank these places to visit next', 'Paris 🗼|Tokyo 🗾|Goa 🏖️|Bali 🌴|Manali 🏔️'],
  ['Rank these habits, most annoying first', 'Loud chewing 😖|Late replies 📵|Leaving lights on 💡|Snoring 😴|Being late ⏰'],
  ['Rank these weekend plans, most tempting first', 'Sleep in all day 🛌|Brunch with friends 🥞|Long drive 🚙|Cook together 👩‍🍳|Game night 🎲'],
  ['Rank these movie genres, favourite first', 'Rom-com 💞|Thriller 🔪|Comedy 😂|Fantasy ✨|Horror 👻'],
  ['Rank these ways to relax, best first', 'Music 🎧|A long bath 🛁|A nap 😴|A walk 🌳|Scrolling the phone 📱'],
  ['Rank these celebrations, most fun first', 'Birthday party 🎂|Anniversary dinner 🥂|Festival day 🪔|New Year 🎆|Surprise party 🎉'],
  ['Rank these comfort foods, favourite first', 'Biryani 🍛|Pasta 🍝|Maggi 🍜|Pizza 🍕|Ice cream 🍨'],
  ['Rank these as reasons to fall in love, strongest first', 'A great laugh 😂|Kindness 💗|Ambition 🚀|Looks 😍|Loyalty 🤝'],
  ['Rank these seasons, favourite first', 'Monsoon 🌧️|Winter ❄️|Spring 🌸|Summer ☀️|Autumn 🍂'],
  ['Rank these couple activities, most romantic first', 'Stargazing 🌌|Slow dancing 💃|Cooking together 🍳|Watching sunsets 🌅|Writing letters ✍️'],
  ['Rank these pets, cutest first', 'Puppy 🐶|Kitten 🐱|Bunny 🐰|Parrot 🦜|Hamster 🐹'],
  ['Rank these morning routines, best first', 'Chai in silence ☕|Workout 🏃|Long shower 🚿|Snooze 5 more times ⏰|Breakfast together 🥞'],
  ['Rank these dealbreakers, biggest first', 'Dishonesty 🤥|Never being on time ⏰|Ignoring messages 📵|Messy home 🧦|Bad table manners 🍽️'],
  ['Rank these ways to say "I love you", best first', 'Hug 🤗|Words 💌|Gift 🎁|Doing chores 🧺|Quality time ⏳'],
  ['Rank these music moods, favourite first', 'Romantic 🎻|Party 🎉|Chill 🌙|Sad 🌧️|Retro 📻'],
  ['Rank these dream homes, favourite first', 'Beach house 🐚|Mountain cabin 🏔️|City apartment 🏙️|Countryside cottage 🌻|Houseboat ⛵'],
  ['Rank these date-night outfits, most fun first', 'Fully dressed up 👗|Matching outfits 👯|Cosy pyjamas 🧸|Traditional wear 🪷|Whatever is clean 🤷'],
])

/* ---------- Once Upon Us: story openers ---------- */
export const STORY_OPENERS = [
  'One rainy evening, {a} and {b} found a mysterious door in the back of their kitchen.',
  'When {a} opened the old suitcase, a glowing map with {b}\'s name on it fell out.',
  'The last train left without {a} and {b}, and the platform started to hum.',
  '{a} and {b} woke up in a tiny boat, floating on a lake made of stars.',
  'It started with a text from an unknown number: "Meet me where you had your first date."',
  'On the night of the big storm, {a} and {b} discovered their cat could talk.',
  'Nobody in town believed {a} and {b} had found a treasure map on a chai-stained napkin.',
  'The fortune cookie said: "Tonight, {b} will change {a}\'s life."',
  '{a} and {b} took a wrong turn and ended up in a village that only appears at midnight.',
  'The old lighthouse keeper looked at {a} and {b} and whispered, "You are finally here."',
  'They swapped phones for a day, and {a} found a message that made everything strange.',
  'An invitation arrived for {a} and {b}: "You are cordially invited to your own wedding… in another universe."',
  'The moon dropped a tiny door into the garden, and {b} dared {a} to walk through it.',
  'On the very first day of monsoon, {a} and {b} opened a cafe that only served wishes.',
  '{a} and {b} bought a second-hand piano, and it started playing a song neither of them knew.',
]

/* ---------- Doodle Dash & Emoji Charades ---------- */
export type SecretWord = { id: string; word: string; cat: string }
const words = (prefix: string, rows: [string, string][]): SecretWord[] => rows.map(([cat, word], i) => ({ id: `${prefix}.${i + 1}`, cat, word }))

export const DOODLE_WORDS: SecretWord[] = words('doodle', [
  ['Food', 'Pizza'], ['Food', 'Ice cream'], ['Food', 'Chai'], ['Food', 'Cake'], ['Food', 'Burger'], ['Food', 'Popcorn'],
  ['Place', 'Airport'], ['Place', 'Beach'], ['Place', 'Mountain'], ['Place', 'Castle'], ['Place', 'Cinema'], ['Place', 'Lighthouse'],
  ['Thing', 'Umbrella'], ['Thing', 'Guitar'], ['Thing', 'Camera'], ['Thing', 'Balloon'], ['Thing', 'Candle'], ['Thing', 'Sunglasses'],
  ['Thing', 'Rocket'], ['Thing', 'Bicycle'], ['Thing', 'Train'], ['Thing', 'Boat'], ['Thing', 'Diary'], ['Thing', 'Telephone'],
  ['Nature', 'Rainbow'], ['Nature', 'Moon'], ['Nature', 'Sunrise'], ['Nature', 'Flower'], ['Nature', 'Snowman'], ['Nature', 'Volcano'],
  ['Animal', 'Elephant'], ['Animal', 'Butterfly'], ['Animal', 'Penguin'], ['Animal', 'Giraffe'], ['Animal', 'Owl'], ['Animal', 'Dinosaur'],
  ['Love', 'Heart'], ['Love', 'Kiss'], ['Love', 'Wedding'], ['Love', 'Selfie'], ['Love', 'Love letter'], ['Love', 'Bouquet'],
  ['Fun', 'Fireworks'], ['Fun', 'Cricket'], ['Fun', 'Dance'], ['Fun', 'Roller coaster'], ['Fun', 'Camping'], ['Fun', 'Birthday'],
])

export const EMOJI_PHRASES: SecretWord[] = words('emoji', [
  ['Date', 'Coffee date'], ['Date', 'Candlelight dinner'], ['Date', 'Movie night'], ['Date', 'Sunset walk'], ['Date', 'First kiss'], ['Date', 'Surprise party'],
  ['Travel', 'Road trip'], ['Travel', 'Beach vacation'], ['Travel', 'Airport'], ['Travel', 'Honeymoon'], ['Travel', 'Snow day'], ['Travel', 'Camping trip'],
  ['Food', 'Pizza night'], ['Food', 'Hot chai'], ['Food', 'Late night snacks'], ['Food', 'Street food'], ['Food', 'Birthday cake'], ['Food', 'Ice cream'],
  ['Life', 'Good morning'], ['Life', 'Long distance'], ['Life', 'Rainy day'], ['Life', 'Shopping spree'], ['Life', 'Karaoke night'], ['Life', 'Gym time'],
  ['Fun', 'Cricket match'], ['Fun', 'Bollywood dance'], ['Fun', 'Diwali'], ['Fun', 'Holi'], ['Fun', 'Roller coaster'], ['Fun', 'Space trip'],
  ['Film', 'Titanic'], ['Film', 'Lion King'], ['Film', 'Harry Potter'], ['Film', 'Frozen'], ['Film', 'Spider-Man'], ['Film', 'Finding Nemo'],
])
