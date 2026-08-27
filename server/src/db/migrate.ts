import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
let migrationsStarted = false;

export async function runMigrations() {
  if (migrationsStarted) {
    return;
  }

  migrationsStarted = true;
  console.log("Running database migrations...");

  try {
    await migrate(db, { migrationsFolder: join(__dirname, "migrations") });
    console.log("Migrations complete.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/duplicate key value violates unique constraint "pg_namespace_nspname_index"|already.*migrat/i.test(message)) {
      console.log("Migrations already applied; skipping.");
      return;
    }
    throw error;
  }
}
