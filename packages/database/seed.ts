import { db } from "./index";
import {
  usersTable,
  formsTable,
  formFieldsTable,
  responsesTable,
  responseAnswersTable,
} from "./schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Starting seeding process...");

  // 1. Create default creator user
  const adminEmail = "admin@finalforms.com";
  let admin = await db.query.usersTable.findFirst({
    where: (users, { eq }) => eq(users.email, adminEmail),
  });

  if (!admin) {
    console.log("👤 Creating default admin user...");
    const [newAdmin] = await db
      .insert(usersTable)
      .values({
        fullName: "Final Admin",
        email: adminEmail,
        passwordHash: hashPassword("password123"),
        emailVerified: true,
      })
      .returning();
    admin = newAdmin;
  } else {
    console.log("👤 Default admin user already exists.");
  }

  const userId = admin!.id;

  // Clear existing forms and responses for this user to avoid duplicate seeds
  const existingForms = await db.query.formsTable.findMany({
    where: (forms, { eq }) => eq(forms.creatorId, userId),
  });
  if (existingForms.length > 0) {
    console.log("🧹 Clearing old seed data...");
    await db.delete(formsTable).where(eq(formsTable.creatorId, userId));
  }

  // 2. Insert Hogwarts Sorting Hat Form (Public)
  console.log("🏰 Seeding 'Hogwarts Sorting Hat' Form...");
  const [hogwartsForm] = (await db
    .insert(formsTable)
    .values({
      creatorId: userId,
      title: "Hogwarts House Sorting Ceremony",
      description:
        "Step up, don the Sorting Hat, and discover your true magical house. Hogwarts awaits your loyalty, courage, wisdom, or ambition.",
      status: "published",
      visibility: "public",
      theme: "hogwarts",
      customSlug: "sorting-hat",
    })
    .returning()) as [typeof formsTable.$inferSelect];

  const hwFieldsData = [
    {
      formId: hogwartsForm.id,
      type: "select",
      label: "Which core quality do you value most in yourself?",
      placeholder: "Select your primary virtue",
      required: true,
      orderIndex: 0,
      options: [
        { label: "Courage & Daring", value: "courage" },
        { label: "Loyalty & Hard Work", value: "loyalty" },
        { label: "Wit & Intelligence", value: "wit" },
        { label: "Cunning & Ambition", value: "cunning" },
      ],
    },
    {
      formId: hogwartsForm.id,
      type: "select",
      label: "If you could bring one companion to Hogwarts, who would it be?",
      placeholder: "Choose a magical pet",
      required: true,
      orderIndex: 1,
      options: [
        { label: "Barn Owl", value: "owl" },
        { label: "Common Toad", value: "toad" },
        { label: "Black Cat", value: "cat" },
        { label: "Ghostly Ferret", value: "ferret" },
      ],
    },
    {
      formId: hogwartsForm.id,
      type: "short_text",
      label: "What would you see if you stood before the Mirror of Erised?",
      placeholder: "Your deepest, most desperate desire...",
      required: true,
      orderIndex: 2,
    },
    {
      formId: hogwartsForm.id,
      type: "rating",
      label: "How excited are you to start Potions class with Professor Snape?",
      placeholder: "Rate from 1 to 5 stars",
      required: false,
      orderIndex: 3,
      validationRules: { min: 1, max: 5 },
    },
  ];

  const hwFields = await db.insert(formFieldsTable).values(hwFieldsData).returning();

  // 3. Insert Cyberpunk Bug Report Form (Public)
  console.log("🏙️ Seeding 'Cyberpunk 2077 Bug Report' Form...");
  const [cyberpunkForm] = (await db
    .insert(formsTable)
    .values({
      creatorId: userId,
      title: "Night City Anomaly Registry (Glitch Report)",
      description:
        "Choombas, got a cyberware malfunction or rendering glitch in Watson? Report it here so the Netwatch agents can clean the subnet.",
      status: "published",
      visibility: "public",
      theme: "cyberpunk",
      customSlug: "cyber-glitch",
    })
    .returning()) as [typeof formsTable.$inferSelect];

  const cpFieldsData = [
    {
      formId: cyberpunkForm.id,
      type: "short_text",
      label: "What is your Street Handle / Nickname?",
      placeholder: "e.g., V, Jackie, Judy",
      required: true,
      orderIndex: 0,
    },
    {
      formId: cyberpunkForm.id,
      type: "select",
      label: "Where did the cyberware anomaly occur?",
      placeholder: "Select district",
      required: true,
      orderIndex: 1,
      options: [
        { label: "Watson (Kabuki / Little China)", value: "watson" },
        { label: "Westbrook (Japantown)", value: "westbrook" },
        { label: "Pacifica (Coastview)", value: "pacifica" },
        { label: "Heywood (Glen)", value: "heywood" },
        { label: "Badlands", value: "badlands" },
      ],
    },
    {
      formId: cyberpunkForm.id,
      type: "checkbox",
      label: "Which implants are displaying error codes? (Select all that apply)",
      required: false,
      orderIndex: 2,
      options: [
        { label: "Kiroshi Optics MK.3", value: "kiroshi" },
        { label: "Mantis Blades / Gorilla Arms", value: "blades" },
        { label: "Sandevistan Neural Processor", value: "sandy" },
        { label: "Militech Cyberdeck", value: "cyberdeck" },
      ],
    },
    {
      formId: cyberpunkForm.id,
      type: "long_text",
      label: "Describe the glitch in detail (or leave a message for Johnny Silverhand):",
      placeholder:
        "e.g., textures didn't load, fell through the elevator, Johnny called me a sellout...",
      required: true,
      orderIndex: 3,
    },
  ];

  const cpFields = await db.insert(formFieldsTable).values(cpFieldsData).returning();

  // 4. Insert YC Application Form (Unlisted)
  console.log("🚀 Seeding 'YC Application' Form...");
  const [ycForm] = (await db
    .insert(formsTable)
    .values({
      creatorId: userId,
      title: "Y-Combinator Summer 2026 Pitch",
      description:
        "Pitch your startup. We fund creators building type-safe form builders and scalable SaaS platforms. Tell us about your metrics.",
      status: "published",
      visibility: "unlisted",
      theme: "startup",
    })
    .returning()) as [typeof formsTable.$inferSelect];

  const ycFieldsData = [
    {
      formId: ycForm.id,
      type: "short_text",
      label: "What is your startup's name?",
      placeholder: "e.g., FinalForms, Stripe, Airbnb",
      required: true,
      orderIndex: 0,
    },
    {
      formId: ycForm.id,
      type: "email",
      label: "Founder contact email address:",
      placeholder: "founders@startup.com",
      required: true,
      orderIndex: 1,
    },
    {
      formId: ycForm.id,
      type: "number",
      label: "What is your current Monthly Recurring Revenue (MRR) in USD?",
      placeholder: "e.g., 0, 1200, 5000",
      required: true,
      orderIndex: 2,
    },
    {
      formId: ycForm.id,
      type: "long_text",
      label: "What are you building that is novel, and why will it succeed?",
      placeholder: "Explain your secret weapon...",
      required: true,
      orderIndex: 3,
    },
  ];

  const ycFields = await db.insert(formFieldsTable).values(ycFieldsData).returning();

  // 5. Seed 50+ Mock Responses to make analytics look rich!
  console.log("📊 Seeding 60+ mock responses (Completed & Drop-offs)...");

  // Hogwarts Form Responses (30 total: 22 completed, 8 drop-offs)
  const hwDesires = [
    "World peace and eternal glory",
    "To see my parents standing right beside me",
    "Holding the Quidditch Cup",
    "Endless library full of magical secrets",
    "Running a potion shop in Diagon Alley",
    "My brother returning home safely",
    "Beating Gryffindor in the house cup",
  ];

  for (let i = 0; i < 30; i++) {
    const isCompleted = i < 22;
    const lastAnsweredIdx = isCompleted ? 3 : Math.floor(Math.random() * 3); // 0, 1, 2

    const [res] = (await db
      .insert(responsesTable)
      .values({
        formId: hogwartsForm.id,
        completed: isCompleted,
        respondentEmail: isCompleted ? `wizard-${i}@hogwarts.edu` : null,
        lastAnsweredFieldId: hwFields[lastAnsweredIdx]!.id,
        submittedAt: new Date(Date.now() - i * 6 * 3600 * 1000), // Spaced over several days
      })
      .returning()) as [typeof responsesTable.$inferSelect];

    // Insert answers up to the last answered field index
    for (let j = 0; j <= lastAnsweredIdx; j++) {
      const field = hwFields[j]!;
      let answerVal: any = "";

      if (field.type === "select") {
        const opts = field.options as Array<any>;
        answerVal = opts[Math.floor(Math.random() * opts.length)].value;
      } else if (field.type === "short_text") {
        answerVal = hwDesires[Math.floor(Math.random() * hwDesires.length)];
      } else if (field.type === "rating") {
        answerVal = Math.floor(Math.random() * 5) + 1;
      }

      await db.insert(responseAnswersTable).values({
        responseId: res.id,
        fieldId: field.id,
        answer: answerVal,
      });
    }
  }

  // Cyberpunk Form Responses (20 total: 14 completed, 6 drop-offs)
  const cpGlitches = [
    "Mantis Blades stuck in defensive block mode. Cannot holster.",
    "Kiroshi Optics showing neon advertisements even while sleeping.",
    "Sandevistan caused me to move faster than time itself, now I'm stuck in yesterday.",
    "Glitch in Watson, cars falling from the sky. Very dangerous.",
    "Johnny Silverhand singing folk songs in my head at 3 AM.",
  ];

  for (let i = 0; i < 20; i++) {
    const isCompleted = i < 14;
    const lastAnsweredIdx = isCompleted ? 3 : Math.floor(Math.random() * 3);

    const [res] = (await db
      .insert(responsesTable)
      .values({
        formId: cyberpunkForm.id,
        completed: isCompleted,
        respondentEmail: null, // Cyberpunk reports are anonymous street kids
        lastAnsweredFieldId: cpFields[lastAnsweredIdx]!.id,
        submittedAt: new Date(Date.now() - i * 8 * 3600 * 1000),
      })
      .returning()) as [typeof responsesTable.$inferSelect];

    for (let j = 0; j <= lastAnsweredIdx; j++) {
      const field = cpFields[j]!;
      let answerVal: any = "";

      if (field.type === "short_text") {
        answerVal = `Choom_${i}`;
      } else if (field.type === "select") {
        const opts = field.options as Array<any>;
        answerVal = opts[Math.floor(Math.random() * opts.length)].value;
      } else if (field.type === "checkbox") {
        // Randomly select multiple options
        const opts = field.options as Array<any>;
        answerVal = opts.filter(() => Math.random() > 0.5).map((o) => o.value);
        if (answerVal.length === 0) answerVal = [opts[0].value];
      } else if (field.type === "long_text") {
        answerVal = cpGlitches[Math.floor(Math.random() * cpGlitches.length)];
      }

      await db.insert(responseAnswersTable).values({
        responseId: res.id,
        fieldId: field.id,
        answer: answerVal,
      });
    }
  }

  // YC Pitch Form Responses (15 total: 12 completed, 3 drop-offs)
  const ycIdeas = [
    "A form builder built using Drizzle, Zod and tRPC, styled beautifully for hackers.",
    "We are building Stripe for cybernetics in Night City.",
    "An AI model that automatically completes Hogwarts potions homework.",
    "Decentralized coffee delivery via drones for early-stage startup founders.",
  ];

  for (let i = 0; i < 15; i++) {
    const isCompleted = i < 12;
    const lastAnsweredIdx = isCompleted ? 3 : Math.floor(Math.random() * 3);

    const [res] = (await db
      .insert(responsesTable)
      .values({
        formId: ycForm.id,
        completed: isCompleted,
        respondentEmail: isCompleted ? `founder-${i}@startup.io` : null,
        lastAnsweredFieldId: ycFields[lastAnsweredIdx]!.id,
        submittedAt: new Date(Date.now() - i * 12 * 3600 * 1000),
      })
      .returning()) as [typeof responsesTable.$inferSelect];

    for (let j = 0; j <= lastAnsweredIdx; j++) {
      const field = ycFields[j]!;
      let answerVal: any = "";

      if (field.type === "short_text") {
        answerVal = `Startup_${i}`;
      } else if (field.type === "email") {
        answerVal = `founder-${i}@startup.io`;
      } else if (field.type === "number") {
        answerVal = Math.floor(Math.random() * 15000);
      } else if (field.type === "long_text") {
        answerVal = ycIdeas[Math.floor(Math.random() * ycIdeas.length)];
      }

      await db.insert(responseAnswersTable).values({
        responseId: res.id,
        fieldId: field.id,
        answer: answerVal,
      });
    }
  }

  console.log("🎉 Seeding completed successfully! ✅");
}

main().catch((err) => {
  console.error("❌ Seeding failed with error:", err);
  process.exit(1);
});
