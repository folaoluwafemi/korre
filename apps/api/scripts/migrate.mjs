import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";
import { Pool } from "pg";

const migrationDirectory = new URL(
  "../../../infrastructure/database/migrations/",
  import.meta.url,
);
const lockId = "1129270856";

function getDatabaseUrl(environment) {
  const value = environment["DATABASE_URL"]?.trim();
  if (!value) throw new Error("DATABASE_URL is required.");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname ||
    url.pathname === "/"
  )
    throw new Error("DATABASE_URL must name a PostgreSQL database.");
  return value;
}

async function migrate() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(process.env),
    connectionTimeoutMillis: 5_000,
    application_name: "korre-db-migrate",
  });
  let client;
  let currentMigration = "database setup";
  let locked = false;
  try {
    client = await pool.connect();
    await client.query("SELECT pg_advisory_lock($1::bigint)", [lockId]);
    locked = true;
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (migration_name text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );

    const files = (await readdir(migrationDirectory))
      .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
      .sort();
    for (const name of files) {
      currentMigration = name;
      const sql = await readFile(new URL(name, migrationDirectory), "utf8");
      const checksum = createHash("sha256").update(sql, "utf8").digest("hex");
      await client.query("BEGIN");
      try {
        const existing = await client.query(
          "SELECT checksum FROM schema_migrations WHERE migration_name = $1",
          [name],
        );
        const applied = existing.rows[0]?.checksum;
        if (typeof applied === "string") {
          if (applied.trim() !== checksum)
            throw new Error("An applied migration checksum has changed.");
        } else {
          await client.query(sql);
          await client.query(
            "INSERT INTO schema_migrations (migration_name, checksum) VALUES ($1, $2)",
            [name, checksum],
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    process.stdout.write(
      `Verified ${files.length} forward-only migration(s).\n`,
    );
  } catch {
    process.stderr.write(
      `Migration failed at ${currentMigration}; no success is claimed. Check the database and migration history.\n`,
    );
    process.exitCode = 1;
  } finally {
    if (client !== undefined) {
      if (locked) {
        try {
          await client.query("SELECT pg_advisory_unlock($1::bigint)", [lockId]);
        } catch {
          process.exitCode = 1;
        }
      }
      client.release();
    }
    await pool.end();
  }
}

await migrate().catch(() => {
  process.stderr.write(
    "Migration startup configuration is invalid or the migration runner could not start.\n",
  );
  process.exitCode = 1;
});
