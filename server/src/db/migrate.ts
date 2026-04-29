import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: join(__dirname, "migrations") });
  console.log("Migrations complete.");
}
