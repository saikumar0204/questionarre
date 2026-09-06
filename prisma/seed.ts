import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const quizQuestions = [
  // ROMANTIC (10 questions)
  {
    category: 'ROMANTIC',
    text: 'What is our ideal weekend date?',
    options: JSON.stringify([
      'Cozy movie night & ordering takeout 🍕🍿',
      'Spontaneous road trip & adventure 🚗🌄',
      'Fancy dinner & dressing up 🍷✨',
      'Exploring a local market & coffee shop ☕🌿'
    ]),
    order: 1,
  },
  {
    category: 'ROMANTIC',
    text: 'What is my primary love language?',
    options: JSON.stringify([
      'Words of Affirmation 💌',
      'Quality Time ⏳❤️',
      'Physical Touch 🤗',
      'Receiving Gifts 🎁',
      'Acts of Service 🛠️'
    ]),
    order: 2,
  },
  {
    category: 'ROMANTIC',
    text: 'What makes you feel most loved by me?',
    options: JSON.stringify([
      'Unexpected hugs and sweet kisses 😘',
      'Deep conversations late at night 🌙',
      'When I bring your favorite snack or drink 🧁',
      'When I help you out when you are stressed 💆‍♂️'
    ]),
    order: 3,
  },
  {
    category: 'ROMANTIC',
    text: 'What was your very first impression of me?',
    options: JSON.stringify([
      'Extremely cute & attractive 😍',
      'Funny, confident, & easy to talk to 😊',
      'A bit mysterious & intriguing 👀',
      'Warm, kind-hearted & sweet 💖'
    ]),
    order: 4,
  },
  {
    category: 'ROMANTIC',
    text: 'What is our ultimate superpower as a couple?',
    options: JSON.stringify([
      'Telepathic communication (finishing sentences) 🧠⚡',
      'Best travel & road trip partners 🗺️',
      'Unstoppable team at problem solving 🧩',
      'Creating fun out of any mundane situation 🎉'
    ]),
    order: 5,
  },
  {
    category: 'ROMANTIC',
    text: 'What is the sweetest gesture I ever did for you?',
    options: JSON.stringify([
      'Planning a surprise date night 🌃✨',
      'Comforting me when I was having a bad day 🫂',
      'Remembering a tiny detail I mentioned weeks ago 💡',
      'Writing a handwritten note or message 📝❤️'
    ]),
    order: 6,
  },
  {
    category: 'ROMANTIC',
    text: 'Where do you feel most peaceful with me?',
    options: JSON.stringify([
      'Cuddling in bed on a rainy morning 🌧️🛏️',
      'Sitting together in silence with coffee ☕',
      'Walking hand-in-hand in a quiet park 🌳',
      'Stargazing late at night 🌌'
    ]),
    order: 7,
  },
  {
    category: 'ROMANTIC',
    text: 'Which song lyric describes our bond best?',
    options: JSON.stringify([
      '"Can\'t Help Falling in Love" 🎶💓',
      '"Count on Me" 🤝❤️',
      '"Shut Up and Dance With Me" 💃🕺',
      '"A Sky Full of Stars" ✨🌌'
    ]),
    order: 8,
  },
  {
    category: 'ROMANTIC',
    text: 'What season feels most romantic for us?',
    options: JSON.stringify([
      'Autumn: Flannels, crisp air & warm drinks 🍂☕',
      'Winter: Cozy blankets, snow & fireplaces ❄️🔥',
      'Spring: Blooming flowers & sunny picnics 🌸🧺',
      'Summer: Beach days & late sunset drives 🌅🏖️'
    ]),
    order: 9,
  },
  {
    category: 'ROMANTIC',
    text: 'What nickname fits our couple energy?',
    options: JSON.stringify([
      'The Power Couple 👑',
      'The Cozy Lovebirds 🐣💕',
      'The Chaos Duo 🌪️😜',
      'The Soulmate Besties 👯‍♂️❤️'
    ]),
    order: 10,
  },

  // SPICY_FUN (10 questions)
  {
    category: 'SPICY_FUN',
    text: 'Who is the bigger drama queen when sick?',
    options: JSON.stringify([
      'Definitely ME 🤒🙋‍♂️',
      'Definitely YOU 🙋‍♀️',
      'Equally dramatic, full hospital mode 🏥',
      'Neither, we super-soldier through it 💪'
    ]),
    order: 1,
  },
  {
    category: 'SPICY_FUN',
    text: 'What do I do that makes you laugh the most?',
    options: JSON.stringify([
      'Silly dance moves 🕺✨',
      'Bad jokes & terrible puns 😂',
      'Funny faces & goofy impressions 🤪',
      'Unintentional clumsy moments 🙈'
    ]),
    order: 2,
  },
  {
    category: 'SPICY_FUN',
    text: 'Who takes longer to get ready before going out?',
    options: JSON.stringify([
      'Me (I need my mirror time) 🪞',
      'You (always 15 mins late) ⏰',
      'Both of us take forever 🐢',
      'We are both fast ⚡'
    ]),
    order: 3,
  },
  {
    category: 'SPICY_FUN',
    text: 'If we were in a horror movie, who survives first?',
    options: JSON.stringify([
      'Me (I will sprint away instantly) 🏃‍♂️💨',
      'You (you have smart survival skills) 🧠',
      'We both survive together as a badass duo 💥',
      'We both get eaten in the first 5 minutes 🧟'
    ]),
    order: 4,
  },
  {
    category: 'SPICY_FUN',
    text: 'Who controls the TV remote or Spotify queue most?',
    options: JSON.stringify([
      'Me (DJ Boss) 🎧',
      'You (Remote Master) 📺',
      'We fight for it playfully every time 🥊',
      '50/50 smooth compromise 🤝'
    ]),
    order: 5,
  },
  {
    category: 'SPICY_FUN',
    text: 'Who is more likely to buy something unnecessary online at 2 AM?',
    options: JSON.stringify([
      '100% ME (Shopping therapy) 🛒📱',
      '100% YOU (Midnight impulse buyer) 📦',
      'Both of us (delivery packages daily) 📬',
      'Neither, we strictly budget 💰'
    ]),
    order: 6,
  },
  {
    category: 'SPICY_FUN',
    text: 'Who apologized first after our last silly disagreement?',
    options: JSON.stringify([
      'Me (I hate staying mad) 🕊️',
      'You (you came with a sweet hug) 🫂',
      'We both laughed halfway through 🤣',
      'We agreed to disagree peacefully 🤝'
    ]),
    order: 7,
  },
  {
    category: 'SPICY_FUN',
    text: 'Who is the snuggler / bed hog at night?',
    options: JSON.stringify([
      'Me (I steal all the blankets) 🛌',
      'You (you take up 90% of the bed) 😴',
      'Equally hogging the space 🐙',
      'Perfectly balanced on our sides ⚖️'
    ]),
    order: 8,
  },
  {
    category: 'SPICY_FUN',
    text: 'Who would win in a spicy food challenge?',
    options: JSON.stringify([
      'Me (Iron stomach) 🌶️🔥',
      'You (Spice champion) 🌋',
      'Both of us crying after 1 bite 😭🌶️',
      'We both love extra spicy food 😋'
    ]),
    order: 9,
  },
  {
    category: 'SPICY_FUN',
    text: 'What is my guiltiest pleasure habit?',
    options: JSON.stringify([
      'Binge-watching trashy reality TV 📺',
      'Eating snacks late in bed 🍫🍪',
      'Scrolling TikTok/Reels for 3 hours 📱',
      'Singing loudly off-key in the shower 🎤🚿'
    ]),
    order: 10,
  },

  // FUTURE (10 questions)
  {
    category: 'FUTURE',
    text: 'Where should our next dream vacation be?',
    options: JSON.stringify([
      'Tropical beach resort 🏝️🌊',
      'Cozy mountain cabin 🏔️❄️',
      'Historic European city 🏰🥐',
      'Exciting theme park & safari adventure 🎢🦁'
    ]),
    order: 1,
  },
  {
    category: 'FUTURE',
    text: 'What is our ultimate dream home vibe?',
    options: JSON.stringify([
      'Modern penthouse with city skyline views 🏙️✨',
      'Cozy countryside cottage with a big garden 🏡🌻',
      'Beachfront house with ocean sounds 🌅🐚',
      'Minimalist smart house in a peaceful suburb 🤖🌿'
    ]),
    order: 2,
  },
  {
    category: 'FUTURE',
    text: 'What pet should we get in our dream future?',
    options: JSON.stringify([
      'Golden Retriever / Cute Dog 🐶',
      'Fluffy cuddly Cat 🐱',
      'Both a dog and a cat 🐾',
      'No pets, just us traveling the world ✈️'
    ]),
    order: 3,
  },
  {
    category: 'FUTURE',
    text: 'What milestone are you most excited to celebrate together next?',
    options: JSON.stringify([
      'Our next major anniversary trip 🎉',
      'Moving into a new space together 🔑',
      'Adopting a pet or trying a big new hobby 🐶🎨',
      'Achieving our personal career & life goals 🚀'
    ]),
    order: 4,
  },
  {
    category: 'FUTURE',
    text: 'In 10 years, how will people describe us?',
    options: JSON.stringify([
      'The couple that never stopped dating and flirting 🔥',
      'The power couple conquering goals 💼💪',
      'The chill, happy, hospitable hosts 🏡🍷',
      'The adventurous world travelers 🌍🎒'
    ]),
    order: 5,
  },
  {
    category: 'FUTURE',
    text: 'If we could start a business together, what would it be?',
    options: JSON.stringify([
      'A cozy cafe & bakery ☕🥐',
      'A boutique travel agency ✈️🌴',
      'A creative design/tech studio 🎨💻',
      'A cute bed & breakfast inn 🏡✨'
    ]),
    order: 6,
  },
  {
    category: 'FUTURE',
    text: 'What new hobby should we try together next year?',
    options: JSON.stringify([
      'Salsa / Ballroom Dancing 💃🕺',
      'Pottery & Cooking Masterclass 🏺🍳',
      'Scuba Diving / Surfing 🏄‍♂️🤿',
      'Camping & Rock Climbing 🧗‍♂️⛺'
    ]),
    order: 7,
  },
  {
    category: 'FUTURE',
    text: 'What kind of car would be our ultimate road trip vehicle?',
    options: JSON.stringify([
      'Convertible sports car with top down 🏎️💨',
      'Rugged 4x4 Jeep/SUV for off-roading 🚙🌄',
      'Custom luxury Camper Van 🚐✨',
      'Sleek Electric SUV ⚡🔋'
    ]),
    order: 8,
  },
  {
    category: 'FUTURE',
    text: 'What tradition do you want us to start every holiday season?',
    options: JSON.stringify([
      'Matching cozy pajamas & hot chocolate ☕❄️',
      'Baking holiday treats for friends 🍪🎁',
      'A yearly getaway trip just for us ✈️💖',
      'Writing an annual love letter memory book 📖✍️'
    ]),
    order: 9,
  },
  {
    category: 'FUTURE',
    text: 'What is the biggest promise we make for our future?',
    options: JSON.stringify([
      'Always support each other\'s dreams no matter what 🌟',
      'Never stop laughing and flirting 😂💖',
      'Keep traveling and discovering new places together 🌍',
      'Always communicate openly with love & trust 🤝❤️'
    ]),
    order: 10,
  },

  // WOULD_YOU_RATHER (10 questions)
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather always have to cook together or always do dishes together?',
    options: JSON.stringify([
      'Always cook delicious meals together 👩‍🍳👨‍🍳',
      'Always do the dishes together while listening to music 🧼🎶'
    ]),
    order: 1,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather receive 100 sweet surprise texts or 1 big surprise date night?',
    options: JSON.stringify([
      '100 sweet daily surprise texts 📱❤️',
      '1 epic grand surprise date night 🌃🥂'
    ]),
    order: 2,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather be locked in a cozy cabin during a blizzard or a luxury beach hut during rain?',
    options: JSON.stringify([
      'Snowy cozy cabin with fireplace 🏔️🔥',
      'Rainy tropical beach hut 🌴🌧️'
    ]),
    order: 3,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather share one brain for a day or swap bodies for a day?',
    options: JSON.stringify([
      'Share one brain (read each other minds) 🧠✨',
      'Swap bodies for 24 hours 🔄🏻🏽'
    ]),
    order: 4,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather win a free trip anywhere right now or get 1 free wish granted together?',
    options: JSON.stringify([
      'Free trip anywhere in the world right now ✈️🌍',
      '1 magical wish granted for our future ✨🔮'
    ]),
    order: 5,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather always hold hands while walking or always cuddle while watching movies?',
    options: JSON.stringify([
      'Always hold hands walking 🤝🚶‍♂️',
      'Always cuddle watching movies 🍿🛋️'
    ]),
    order: 6,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather relive our very first date or skip forward to our next big vacation?',
    options: JSON.stringify([
      'Relive our romantic first date 💖✨',
      'Skip forward to our next dream trip ✈️🌅'
    ]),
    order: 7,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather have unlimited free coffee/tea for life or unlimited free dessert for life?',
    options: JSON.stringify([
      'Unlimited free coffee/tea forever ☕✨',
      'Unlimited free ice cream & dessert forever 🍨🍫'
    ]),
    order: 8,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather have a private chef for 1 year or a personal masseuse for 1 year?',
    options: JSON.stringify([
      'Private chef cooking gourmet meals daily 👩‍🍳🍷',
      'Personal masseuse for daily back rubs 💆‍♂️✨'
    ]),
    order: 9,
  },
  {
    category: 'WOULD_YOU_RATHER',
    text: 'Would you rather dance together in the rain or stargaze on a warm summer night?',
    options: JSON.stringify([
      'Dance together in warm rain 🌧️💃🕺',
      'Stargaze under a clear night sky 🌌⭐'
    ]),
    order: 10,
  },
]

const truthOrDareCards = [
  // TRUTHS
  { type: 'TRUTH', category: 'ROMANTIC', text: 'What was the exact moment you realized you were falling in love with me?' },
  { type: 'TRUTH', category: 'ROMANTIC', text: 'What is one secret compliment about me you never said out loud?' },
  { type: 'TRUTH', category: 'ROMANTIC', text: 'What feature of mine makes your heart melt the most?' },
  { type: 'TRUTH', category: 'SPICY', text: 'What is your favorite romantic fantasy involving the two of us?' },
  { type: 'TRUTH', category: 'SPICY', text: 'Where on your body are you most sensitive to soft kisses?' },
  { type: 'TRUTH', category: 'FUN', text: 'What is the funniest or most embarrassing thing you secretly worried about on our first date?' },
  { type: 'TRUTH', category: 'FUN', text: 'If you could change one funny habit of mine, what would it be?' },
  { type: 'TRUTH', category: 'ROMANTIC', text: 'What is a small detail from our early dating days that you still remember vividly?' },

  // DARES
  { type: 'DARE', category: 'ROMANTIC', text: 'Give your partner a 30-second neck massage or head rub right now!' },
  { type: 'DARE', category: 'ROMANTIC', text: 'Look deeply into your partner\'s eyes for 20 seconds without laughing or blinking!' },
  { type: 'DARE', category: 'ROMANTIC', text: 'Whisper 3 genuinely sweet compliments into your partner\'s ear.' },
  { type: 'DARE', category: 'SPICY', text: 'Give your partner a passionate 10-second kiss!' },
  { type: 'DARE', category: 'SPICY', text: 'Gently bite your partner\'s lip or trace their shoulder with your fingers.' },
  { type: 'DARE', category: 'FUN', text: 'Do a dramatic 15-second silly dance performance for your partner!' },
  { type: 'DARE', category: 'FUN', text: 'Send your partner a hilarious voice note or goofy selfie right now.' },
  { type: 'DARE', category: 'ROMANTIC', text: 'Hold your partner\'s hands and tell them your favorite memory together.' },
]

async function main() {
  console.log('Start seeding large question & truth/dare pool...')
  await prisma.answer.deleteMany({})
  await prisma.action.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.truthOrDareCard.deleteMany({})

  for (const q of quizQuestions) {
    await prisma.question.create({ data: q })
  }
  for (const td of truthOrDareCards) {
    await prisma.truthOrDareCard.create({ data: td })
  }

  console.log(`Successfully seeded ${quizQuestions.length} questions and ${truthOrDareCards.length} Truth/Dare cards!`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
