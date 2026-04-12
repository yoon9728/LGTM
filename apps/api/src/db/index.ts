import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema.js";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getPgDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(dbUrl);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
