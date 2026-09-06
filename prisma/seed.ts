import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const questions = [
  // ROMANTIC
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
    text: 'What is my love language?',
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

  // SPICY_FUN
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

  // FUTURE
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

  // WOULD_YOU_RATHER
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
]

async function main() {
  console.log('Start seeding multi-game questions...')
  await prisma.answer.deleteMany({})
  await prisma.action.deleteMany({})
  await prisma.question.deleteMany({})

  for (const q of questions) {
    await prisma.question.create({ data: q })
  }
  console.log(`Successfully seeded ${questions.length} questions across 4 game categories!`)
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
