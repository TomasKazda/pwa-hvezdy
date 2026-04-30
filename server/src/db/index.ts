import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const rawConn =
  process.env.ConnectionStrings__Sandbox ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/hvezdy";

function buildPoolConfig(conn: string): pg.PoolConfig {
  // URL-style (postgres:// nebo postgresql://) — pg si poradí samo
  if (/^postgres(ql)?:\/\//i.test(conn.trim())) {
    return { connectionString: conn };
  }

  // ADO.NET / Aspire-style: Host=...;Port=...;Username=...;Password=...;Database=...
  const map = new Map<string, string>();
  for (const part of conn.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed.slice(eq + 1).trim();
    map.set(key, value);
  }

  const host = map.get("host") || map.get("server") || "localhost";
  const port = parseInt(map.get("port") || "5432", 10);
  const user = map.get("username") || map.get("user id") || map.get("user") || "postgres";
  const password = map.get("password") || "";
  const database = map.get("database") || map.get("db") || "postgres";
  const sslMode = (map.get("sslmode") || map.get("ssl mode") || "").toLowerCase();
  const ssl =
    sslMode && sslMode !== "disable" && sslMode !== "false"
      ? { rejectUnauthorized: false }
      : undefined;

  return { host, port, user, password, database, ssl };
}

const pool = new pg.Pool(buildPoolConfig(rawConn));

export const db = drizzle(pool, { schema });
export { pool };
