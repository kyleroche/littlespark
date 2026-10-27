import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL)
  throw Error("Set DATABASE_URL before running migrations.");
const sql = neon(process.env.DATABASE_URL);
for (const statement of readFileSync(
  new URL("../server/schema.sql", import.meta.url),
  "utf8",
)
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean))
  await sql.query(statement);
console.log("Little Spark account tables are ready.");
