import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

const databaseUrl = process.env["IDENTITY_TEST_DATABASE_URL"];
const enabled =
  databaseUrl !== undefined &&
  process.env["IDENTITY_TEST_DATABASE_ALLOW"] === "1";
if (process.env["CI"] && !enabled) {
  throw new Error(
    "CI migration acceptance requires the opted-in test database.",
  );
}
if (enabled) {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("The migration test database URL is invalid.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/[A-Za-z0-9_]+_test$/.test(url.pathname) ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error("Use an opted-in loopback _test database without options.");
  }
}
const runnerUrl = new URL("../scripts/migrate.mjs", import.meta.url);
const migrationUrl = new URL(
  "../../../infrastructure/database/migrations/001_identity.sql",
  import.meta.url,
);
const lockId = "1129270856";
let admin: Pool | undefined;
let pool: Pool | undefined;
let schemaName = "";
let temporaryDirectory: string | undefined;

type RunResult = { code: number; stdout: string; stderr: string };

function runMigration(directory?: URL): Promise<RunResult> {
  if (
    databaseUrl === undefined ||
    !/^cb_migrate_test_[a-f0-9]{32}$/.test(schemaName)
  ) {
    throw new Error("An isolated test database is required.");
  }
  const args =
    directory === undefined
      ? [fileURLToPath(runnerUrl)]
      : [
          "--input-type=module",
          "-e",
          "const { migrate } = await import(process.argv[1]); await migrate({ migrationDirectory: new URL(process.argv[2]) }).catch(() => { process.exitCode = 1; });",
          runnerUrl.href,
          directory.href,
        ];
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, args, {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PGOPTIONS: `-c search_path=${schemaName}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const deadline = setTimeout(() => {
      child.kill();
    }, 12_000);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > 1_048_576) child.kill();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 1_048_576) child.kill();
    });
    child.once("error", () => {
      clearTimeout(deadline);
      reject(new Error("Migration test child could not start."));
    });
    child.once("close", (code) => {
      clearTimeout(deadline);
      resolveResult({ code: code ?? -1, stdout, stderr });
    });
  });
}

async function fixtureDirectory(sql: string): Promise<URL> {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "korre-migrate-test-"));
  await writeFile(join(temporaryDirectory, "001_identity.sql"), sql, "utf8");
  return pathToFileURL(`${temporaryDirectory}${sep}`);
}

function testPool(): Pool {
  if (pool === undefined) throw new Error("Test database was not initialized.");
  return pool;
}

describe.skipIf(!enabled)("migration runner with REAL PostgreSQL", () => {
  beforeAll(() => {
    admin = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 2_000,
    });
  });

  beforeEach(async () => {
    schemaName = `cb_migrate_test_${randomUUID().replaceAll("-", "")}`;
    if (admin === undefined) {
      throw new Error("Test database was not initialized.");
    }
    await admin.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({
      connectionString: databaseUrl,
      options: `-c search_path=${schemaName}`,
      connectionTimeoutMillis: 2_000,
    });
  });

  afterEach(async () => {
    try {
      await pool?.end();
    } finally {
      pool = undefined;
      try {
        if (
          admin !== undefined &&
          /^cb_migrate_test_[a-f0-9]{32}$/.test(schemaName)
        ) {
          await admin.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
        }
      } finally {
        if (temporaryDirectory !== undefined) {
          const target = resolve(temporaryDirectory);
          if (
            dirname(target) !== resolve(tmpdir()) ||
            !target.startsWith(join(resolve(tmpdir()), "korre-migrate-test-"))
          ) {
            throw new Error("Unsafe migration fixture cleanup.");
          }
          await rm(target, { recursive: true, force: true });
          temporaryDirectory = undefined;
        }
      }
    }
  });

  afterAll(async () => {
    await admin?.end();
  });

  it("applies the actual migration twice with one unchanged history entry", async () => {
    const first = await runMigration();
    expect(first.code).toBe(0);
    const history = await testPool().query<{ checksum: string }>(
      "SELECT checksum FROM schema_migrations WHERE migration_name = $1",
      ["001_identity.sql"],
    );
    const sql = (await readFile(migrationUrl, "utf8")).replaceAll("\r\n", "\n");
    expect(history.rows[0]?.checksum).toBe(
      createHash("sha256").update(sql).digest("hex"),
    );
    const second = await runMigration();
    expect(second.code).toBe(0);
    const reapplied = await testPool().query<{ checksum: string }>(
      "SELECT checksum FROM schema_migrations",
    );
    expect(reapplied.rows).toEqual(history.rows);
    const tables = await testPool().query<{ present: boolean }>(
      "SELECT to_regclass('players') IS NOT NULL AND to_regclass('sessions') IS NOT NULL AND to_regclass('recovery_codes') IS NOT NULL AND to_regclass('identity_rate_limits') IS NOT NULL AS present",
    );
    expect(tables.rows[0]?.present).toBe(true);
  });

  it("accepts equivalent legacy CRLF history but rejects actual SQL changes", async () => {
    expect((await runMigration()).code).toBe(0);
    const lf = (await readFile(migrationUrl, "utf8")).replaceAll("\r\n", "\n");
    const crlf = lf.replaceAll("\n", "\r\n");
    const legacy = createHash("sha256").update(crlf).digest("hex");
    await testPool().query("UPDATE schema_migrations SET checksum = $1", [
      legacy,
    ]);
    const directory = await fixtureDirectory(crlf);
    expect((await runMigration(directory)).code).toBe(0);
    const history = await testPool().query<{ checksum: string }>(
      "SELECT checksum FROM schema_migrations",
    );
    expect(history.rows[0]?.checksum).toBe(legacy);
    await writeFile(
      join(temporaryDirectory!, "001_identity.sql"),
      `${lf}\n-- actual content change\n`,
      "utf8",
    );
    expect((await runMigration(directory)).code).toBe(1);
    const unchanged = await testPool().query<{ checksum: string }>(
      "SELECT checksum FROM schema_migrations",
    );
    expect(unchanged.rows).toEqual(history.rows);
  });

  it("fails a corrupted stored checksum without applying or deleting history", async () => {
    expect((await runMigration()).code).toBe(0);
    await testPool().query("UPDATE schema_migrations SET checksum = $1", [
      "f".repeat(64),
    ]);
    const failed = await runMigration();
    expect(failed.code).toBe(1);
    expect(failed.stdout.includes("Verified")).toBe(false);
    const history = await testPool().query<{ checksum: string }>(
      "SELECT checksum FROM schema_migrations",
    );
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]?.checksum).toBe("f".repeat(64));
  });

  it("rolls back invalid migration SQL and its history entry", async () => {
    const directory = await fixtureDirectory(
      "CREATE TABLE rollback_probe (id integer); SELECT * FROM missing_probe_table;",
    );
    expect((await runMigration(directory)).code).toBe(1);
    const history = await testPool().query<{ count: number }>(
      "SELECT count(*)::int AS count FROM schema_migrations",
    );
    expect(history.rows[0]?.count).toBe(0);
    const rolledBack = await testPool().query<{ present: boolean }>(
      "SELECT to_regclass('rollback_probe') IS NOT NULL AS present",
    );
    expect(rolledBack.rows[0]?.present).toBe(false);
  });

  it("fails within a bounded deadline when another session holds the migration lock", async () => {
    const holder = await testPool().connect();
    let locked = false;
    try {
      await holder.query("SELECT pg_advisory_lock($1::bigint)", [lockId]);
      locked = true;
      const started = Date.now();
      const result = await runMigration();
      expect(result.code).toBe(1);
      expect(Date.now() - started).toBeLessThan(10_000);
      expect(result.stdout.includes("Verified")).toBe(false);
      expect(result.stderr.includes("no success is claimed")).toBe(true);
    } finally {
      try {
        if (locked) {
          await holder.query("SELECT pg_advisory_unlock($1::bigint)", [lockId]);
        }
      } finally {
        holder.release();
      }
    }
    expect((await runMigration()).code).toBe(0);
  }, 20_000);
});
