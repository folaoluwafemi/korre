import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import process from "node:process";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { Pool } from "pg";

const defaultMigrationDirectory = new URL(
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

const digest = (sql) => createHash("sha256").update(sql, "utf8").digest("hex");

// Exported for isolated child-process acceptance tests; importing does not run SQL.
export async function migrate({
  migrationDirectory = defaultMigrationDirectory,
} = {}) {
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
    await client.query("SET lock_timeout = '5s'");
    await client.query("SET statement_timeout = '30s'");
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
      const rawSql = await readFile(new URL(name, migrationDirectory), "utf8");
      const sql = rawSql.replaceAll("\r\n", "\n");
      const checksum = digest(sql);
      // Accept legacy byte checksums only for this exact content's LF/CRLF forms.
      // Preserve the stored history instead of rewriting an applied migration.
      const matchingChecksums = new Set([
        checksum,
        digest(sql.replaceAll("\n", "\r\n")),
      ]);
      await client.query("BEGIN");
      try {
        const existing = await client.query(
          "SELECT checksum FROM schema_migrations WHERE migration_name = $1",
          [name],
        );
        const applied = existing.rows[0]?.checksum;
        if (typeof applied === "string") {
          if (!matchingChecksums.has(applied.trim()))
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

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await migrate().catch(() => {
    process.stderr.write(
      "Migration startup configuration is invalid or the migration runner could not start.\n",
    );
    process.exitCode = 1;
  });
}
