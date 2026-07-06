import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    await client.execute(`PRAGMA foreign_keys = OFF`);

    await client.execute(`
      INSERT OR IGNORE INTO User (id, email, name, role)
      VALUES ('system', 'system@hgm.app', 'System', 'SUPER_ADMIN')
    `);

    await client.execute(`
      INSERT OR IGNORE INTO AppConfiguration (id, logoUrl, landingHeroTitle, landingHeroSub, updatedByUserId)
      VALUES (
        'global_config',
        '/assets/logo-default.svg',
        'Hidup Ginjal Muda: Jalani Terapi dengan Jiwa Muda',
        'Platform premium pendamping Hemodialisis & CAPD',
        'system'
      )
    `);

    await client.execute(`PRAGMA foreign_keys = ON`);

    console.log("Seed data inserted successfully!");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    client.close();
  }
}

main();
