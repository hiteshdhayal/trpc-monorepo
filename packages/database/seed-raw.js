const { Client } = require("pg");
const crypto = require("crypto");
const path = require("path");

// Load .env
require("dotenv").config({ path: path.join(__dirname, ".env") });

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/finalforms";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Starting raw SQL seeding process...");
  console.log(`Connecting to database at ${databaseUrl.split("@")[1] || databaseUrl}`);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // 1. Create or get admin user
    const adminEmail = "admin@finalforms.com";
    const userCheck = await client.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
    let creatorId;

    if (userCheck.rows.length > 0) {
      creatorId = userCheck.rows[0].id;
      console.log("👤 Admin user already exists. ID:", creatorId);
    } else {
      const passwordHash = hashPassword("password123");
      const userId = crypto.randomUUID();
      const insertUser = await client.query(
        `INSERT INTO users (id, full_name, email, password_hash, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [userId, "Final Admin", adminEmail, passwordHash, true]
      );
      creatorId = insertUser.rows[0].id;
      console.log("👤 Created Admin user. ID:", creatorId);
    }

    // Ensure admin flag is set (idempotent)
    await client.query("UPDATE users SET is_admin = true WHERE email = $1", [adminEmail]);
    console.log("🔐 Admin flag set for:", adminEmail);

    // 2. Clear old forms (cascades to fields, responses, answers)
    console.log("🧹 Clearing old seed forms...");
    await client.query("DELETE FROM forms WHERE creator_id = $1", [creatorId]);

    // 3. Hogwarts House Sorting Hat Form
    console.log("🏰 Seeding 'Hogwarts Sorting Hat' Form...");
    const hogwartsFormId = crypto.randomUUID();
    await client.query(
      `INSERT INTO forms (id, creator_id, title, description, status, visibility, theme, custom_slug, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        hogwartsFormId,
        creatorId,
        "Hogwarts House Sorting Ceremony",
        "Step up, don the Sorting Hat, and discover your true magical house. Hogwarts awaits your loyalty, courage, wisdom, or ambition.",
        "published",
        "public",
        "hogwarts",
        "sorting-hat",
      ]
    );

    const hwFields = [
      {
        id: crypto.randomUUID(),
        type: "select",
        label: "Which core quality do you value most in yourself?",
        placeholder: "Select your primary virtue",
        required: true,
        order_index: 0,
        options: JSON.stringify([
          { label: "Courage & Daring", value: "courage" },
          { label: "Loyalty & Hard Work", value: "loyalty" },
          { label: "Wit & Intelligence", value: "wit" },
          { label: "Cunning & Ambition", value: "cunning" },
        ]),
      },
      {
        id: crypto.randomUUID(),
        type: "select",
        label: "If you could bring one companion to Hogwarts, who would it be?",
        placeholder: "Choose a magical pet",
        required: true,
        order_index: 1,
        options: JSON.stringify([
          { label: "Barn Owl", value: "owl" },
          { label: "Common Toad", value: "toad" },
          { label: "Black Cat", value: "cat" },
          { label: "Ghostly Ferret", value: "ferret" },
        ]),
      },
      {
        id: crypto.randomUUID(),
        type: "short_text",
        label: "What would you see if you stood before the Mirror of Erised?",
        placeholder: "Your deepest, most desperate desire...",
        required: true,
        order_index: 2,
        options: null,
      },
      {
        id: crypto.randomUUID(),
        type: "rating",
        label: "How excited are you to start Potions class with Professor Snape?",
        placeholder: "Rate from 1 to 5 stars",
        required: false,
        order_index: 3,
        options: null,
      },
    ];

    for (const f of hwFields) {
      await client.query(
        `INSERT INTO form_fields (id, form_id, type, label, placeholder, required, order_index, options, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [f.id, hogwartsFormId, f.type, f.label, f.placeholder, f.required, f.order_index, f.options]
      );
    }

    // 4. Cyberpunk 2077 Bug Report Form
    console.log("🏙️ Seeding 'Cyberpunk 2077 Bug Report' Form...");
    const cyberpunkFormId = crypto.randomUUID();
    await client.query(
      `INSERT INTO forms (id, creator_id, title, description, status, visibility, theme, custom_slug, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        cyberpunkFormId,
        creatorId,
        "Night City Anomaly Registry (Glitch Report)",
        "Choombas, got a cyberware malfunction or rendering glitch in Watson? Report it here so the Netwatch agents can clean the subnet.",
        "published",
        "public",
        "cyberpunk",
        "cyber-glitch",
      ]
    );

    const cpFields = [
      {
        id: crypto.randomUUID(),
        type: "short_text",
        label: "What is your Street Handle / Nickname?",
        placeholder: "e.g., V, Jackie, Judy",
        required: true,
        order_index: 0,
        options: null,
      },
      {
        id: crypto.randomUUID(),
        type: "select",
        label: "Where did the cyberware anomaly occur?",
        placeholder: "Select district",
        required: true,
        order_index: 1,
        options: JSON.stringify([
          { label: "Watson (Kabuki / Little China)", value: "watson" },
          { label: "Westbrook (Japantown)", value: "westbrook" },
          { label: "Pacifica (Coastview)", value: "pacifica" },
          { label: "Heywood (Glen)", value: "heywood" },
          { label: "Badlands", value: "badlands" },
        ]),
      },
      {
        id: crypto.randomUUID(),
        type: "checkbox",
        label: "Which implants are displaying error codes? (Select all that apply)",
        placeholder: null,
        required: false,
        order_index: 2,
        options: JSON.stringify([
          { label: "Kiroshi Optics MK.3", value: "kiroshi" },
          { label: "Mantis Blades / Gorilla Arms", value: "blades" },
          { label: "Sandevistan Neural Processor", value: "sandy" },
          { label: "Militech Cyberdeck", value: "cyberdeck" },
        ]),
      },
      {
        id: crypto.randomUUID(),
        type: "long_text",
        label: "Describe the glitch in detail (or leave a message for Johnny Silverhand):",
        placeholder: "e.g., textures didn't load, fell through the elevator, Johnny called me a sellout...",
        required: true,
        order_index: 3,
        options: null,
      },
    ];

    for (const f of cpFields) {
      await client.query(
        `INSERT INTO form_fields (id, form_id, type, label, placeholder, required, order_index, options, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [f.id, cyberpunkFormId, f.type, f.label, f.placeholder, f.required, f.order_index, f.options]
      );
    }

    // 5. Y-Combinator Application Form (Unlisted)
    console.log("🚀 Seeding 'YC Application' Form...");
    const ycFormId = crypto.randomUUID();
    await client.query(
      `INSERT INTO forms (id, creator_id, title, description, status, visibility, theme, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        ycFormId,
        creatorId,
        "Y-Combinator Summer 2026 Pitch",
        "Pitch your startup. We fund creators building type-safe form builders and scalable SaaS platforms. Tell us about your metrics.",
        "published",
        "unlisted",
        "startup",
      ]
    );

    const ycFields = [
      {
        id: crypto.randomUUID(),
        type: "short_text",
        label: "What is your startup's name?",
        placeholder: "e.g., FinalForms, Stripe, Airbnb",
        required: true,
        order_index: 0,
        options: null,
      },
      {
        id: crypto.randomUUID(),
        type: "email",
        label: "Founder contact email address:",
        placeholder: "founders@startup.com",
        required: true,
        order_index: 1,
        options: null,
      },
      {
        id: crypto.randomUUID(),
        type: "number",
        label: "What is your current Monthly Recurring Revenue (MRR) in USD?",
        placeholder: "e.g., 0, 1200, 5000",
        required: true,
        order_index: 2,
        options: null,
      },
      {
        id: crypto.randomUUID(),
        type: "long_text",
        label: "What are you building that is novel, and why will it succeed?",
        placeholder: "Explain your secret weapon...",
        required: true,
        order_index: 3,
        options: null,
      },
    ];

    for (const f of ycFields) {
      await client.query(
        `INSERT INTO form_fields (id, form_id, type, label, placeholder, required, order_index, options, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [f.id, ycFormId, f.type, f.label, f.placeholder, f.required, f.order_index, f.options]
      );
    }

    // 6. Generate Responses & Answers
    console.log("📊 Seeding 65+ mock responses...");

    // Hogwarts Responses (30 total: 22 completed, 8 partials)
    const hwVirtues = ["courage", "loyalty", "wit", "cunning"];
    const hwPets = ["owl", "toad", "cat", "ferret"];
    const hwDesires = [
      "World peace and eternal glory",
      "To see my parents standing right beside me",
      "Holding the Quidditch Cup",
      "Endless library full of magical secrets",
      "Running a potion shop in Diagon Alley",
      "My brother returning home safely",
    ];

    for (let i = 0; i < 30; i++) {
      const isCompleted = i < 22;
      const lastIdx = isCompleted ? 3 : Math.floor(Math.random() * 3);
      const responseId = crypto.randomUUID();
      const submittedAt = new Date(Date.now() - i * 6 * 3600 * 1000);

      await client.query(
        `INSERT INTO responses (id, form_id, completed, respondent_email, last_answered_field_id, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          responseId,
          hogwartsFormId,
          isCompleted,
          isCompleted ? `wizard-${i}@hogwarts.edu` : null,
          hwFields[lastIdx].id,
          submittedAt,
        ]
      );

      for (let j = 0; j <= lastIdx; j++) {
        const field = hwFields[j];
        let ans;
        if (j === 0) ans = hwVirtues[Math.floor(Math.random() * hwVirtues.length)];
        else if (j === 1) ans = hwPets[Math.floor(Math.random() * hwPets.length)];
        else if (j === 2) ans = hwDesires[Math.floor(Math.random() * hwDesires.length)];
        else if (j === 3) ans = Math.floor(Math.random() * 5) + 1;

        await client.query(
          `INSERT INTO response_answers (id, response_id, field_id, answer)
           VALUES ($1, $2, $3, $4)`,
          [crypto.randomUUID(), responseId, field.id, JSON.stringify(ans)]
        );
      }
    }

    // Cyberpunk Responses (20 total: 14 completed, 6 partials)
    const cpDistricts = ["watson", "westbrook", "pacifica", "heywood", "badlands"];
    const cpImplants = ["kiroshi", "blades", "sandy", "cyberdeck"];
    const cpGlitches = [
      "Mantis Blades stuck in defensive block mode. Cannot holster.",
      "Kiroshi Optics showing neon advertisements even while sleeping.",
      "Sandevistan caused me to move faster than time itself, now I'm stuck in yesterday.",
      "Glitch in Watson, cars falling from the sky. Very dangerous.",
      "Johnny Silverhand singing folk songs in my head at 3 AM.",
    ];

    for (let i = 0; i < 20; i++) {
      const isCompleted = i < 14;
      const lastIdx = isCompleted ? 3 : Math.floor(Math.random() * 3);
      const responseId = crypto.randomUUID();
      const submittedAt = new Date(Date.now() - i * 8 * 3600 * 1000);

      await client.query(
        `INSERT INTO responses (id, form_id, completed, respondent_email, last_answered_field_id, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [responseId, cyberpunkFormId, isCompleted, null, cpFields[lastIdx].id, submittedAt]
      );

      for (let j = 0; j <= lastIdx; j++) {
        const field = cpFields[j];
        let ans;
        if (j === 0) ans = `Choom_${i}`;
        else if (j === 1) ans = cpDistricts[Math.floor(Math.random() * cpDistricts.length)];
        else if (j === 2) {
          ans = cpImplants.filter(() => Math.random() > 0.5);
          if (ans.length === 0) ans = [cpImplants[0]];
        } else if (j === 3) ans = cpGlitches[Math.floor(Math.random() * cpGlitches.length)];

        await client.query(
          `INSERT INTO response_answers (id, response_id, field_id, answer)
           VALUES ($1, $2, $3, $4)`,
          [crypto.randomUUID(), responseId, field.id, JSON.stringify(ans)]
        );
      }
    }

    // YC Responses (15 total: 12 completed, 3 partials)
    const ycIdeas = [
      "A form builder built using Drizzle, Zod and tRPC, styled beautifully for hackers.",
      "We are building Stripe for cybernetics in Night City.",
      "An AI model that automatically completes Hogwarts potions homework.",
      "Decentralized coffee delivery via drones for early-stage startup founders.",
    ];

    for (let i = 0; i < 15; i++) {
      const isCompleted = i < 12;
      const lastIdx = isCompleted ? 3 : Math.floor(Math.random() * 3);
      const responseId = crypto.randomUUID();
      const submittedAt = new Date(Date.now() - i * 12 * 3600 * 1000);

      await client.query(
        `INSERT INTO responses (id, form_id, completed, respondent_email, last_answered_field_id, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          responseId,
          ycFormId,
          isCompleted,
          isCompleted ? `founder-${i}@startup.io` : null,
          ycFields[lastIdx].id,
          submittedAt,
        ]
      );

      for (let j = 0; j <= lastIdx; j++) {
        const field = ycFields[j];
        let ans;
        if (j === 0) ans = `Startup_${i}`;
        else if (j === 1) ans = `founder-${i}@startup.io`;
        else if (j === 2) ans = Math.floor(Math.random() * 15000);
        else if (j === 3) ans = ycIdeas[Math.floor(Math.random() * ycIdeas.length)];

        await client.query(
          `INSERT INTO response_answers (id, response_id, field_id, answer)
           VALUES ($1, $2, $3, $4)`,
          [crypto.randomUUID(), responseId, field.id, JSON.stringify(ans)]
        );
      }
    }

    console.log("🎉 Seeding completed successfully! ✅");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
