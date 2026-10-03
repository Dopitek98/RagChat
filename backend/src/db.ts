import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://admin:admin@localhost:5432/embedding",
});

export async function connectDB() {
  await pool.query("SELECT 1");
  console.log("PostgreSQL connected");
}

export async function closeDB() {
  await pool.end();
}
