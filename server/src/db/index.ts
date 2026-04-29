import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.ConnectionStrings__Sandbox || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hvezdy";

const pool = new pg.Pool({ connectionString });

export const db = drizzle(pool, { schema });
export { pool };
