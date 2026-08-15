import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@puglianfc.it";
const DEMO_PASSWORD = "provalo123";

const SAMPLE_FEEDBACK: { comment: string; contactName: string | null; contactInfo: string | null }[] = [
  {
    comment: "Cibo buono ma abbiamo aspettato più di 40 minuti per i primi.",
    contactName: "Marco",
    contactInfo: null,
  },
  {
    comment: "Tavolo vicino alla cucina, molto rumore. Il personale però è stato gentile.",
    contactName: "Elena",
    contactInfo: null,
  },
  {
    comment: "Porzioni piccole per il prezzo. Il dolce era ottimo però.",
    contactName: null,
    contactInfo: null,
  },
  {
    comment: "Prenotazione persa all'arrivo, ci hanno fatto aspettare senza spiegazioni.",
    contactName: "Davide",
    contactInfo: "347 1234567",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Giuseppe (demo)",
      passwordHash,
    },
  });

  const business = await prisma.business.upsert({
    where: { slug: "vulpes-pop-bistrot" },
    update: {},
    create: {
      slug: "vulpes-pop-bistrot",
      name: "Vulpes Pop Bistrot",
      ownerId: user.id,
      googleReviewUrl:
        "https://www.google.com/maps/search/?api=1&query=Vulpes+Pop+Bistrot+Piazza+Aldo+Moro+46+Cassano+delle+Murge",
      instagramUrl: "https://www.instagram.com/vulpespopbistrot/",
      phone: "+390802055139",
      ratingThreshold: 4,
      primaryColor: "#C1602E",
      accentColor: "#E8A94A",
    },
  });

  const existingEvents = await prisma.reviewEvent.count({ where: { businessId: business.id } });

  if (existingEvents === 0) {
    const channels = ["nfc", "qr", "direct"] as const;
    // Skewed positive, like a real venue: mostly 4-5, a handful lower.
    const ratings = [5, 5, 4, 5, 4, 4, 5, 3, 5, 4, 2, 5, 4, 4, 5, 1, 5, 3, 4, 5];

    for (let i = 0; i < ratings.length; i++) {
      const rating = ratings[i];
      const daysAgo = ratings.length - i;
      const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.round(Math.random() * 43200000));
      const redirected = rating >= business.ratingThreshold;

      const event = await prisma.reviewEvent.create({
        data: {
          businessId: business.id,
          rating,
          channel: channels[i % channels.length],
          redirected,
          createdAt,
        },
      });

      if (!redirected) {
        const sample = SAMPLE_FEEDBACK[i % SAMPLE_FEEDBACK.length];
        await prisma.feedback.create({
          data: {
            businessId: business.id,
            reviewEventId: event.id,
            rating,
            comment: sample.comment,
            contactName: sample.contactName,
            contactInfo: sample.contactInfo,
            status: i % 3 === 0 ? "new" : i % 3 === 1 ? "read" : "resolved",
            createdAt,
          },
        });
      }
    }
  }

  console.log("Seed completato:");
  console.log(`  Login demo:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Attività:    ${business.name}  (/r/${business.slug})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
