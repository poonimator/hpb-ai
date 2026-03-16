/**
 * Migrate all data from local SQLite to production PostgreSQL
 * Usage: npx tsx scripts/migrate-data-to-pg.ts
 */

import Database from "better-sqlite3";
import pg from "pg";
import path from "path";

const SQLITE_PATH = path.join(process.cwd(), "data", "app.db");
const PG_URL = process.env.DATABASE_URL_PG;

if (!PG_URL) {
  console.error("Set DATABASE_URL_PG to your PostgreSQL connection string");
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pool = new pg.Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } });

// Tables in dependency order (parents before children)
const TABLES_IN_ORDER = [
  "User",
  "Project",
  "SubProject",
  "KbDocument",
  "KbChunk",
  "ProjectKbDocument",
  "ProjectKbChunk",
  "Persona",
  "GuideVersion",
  "GuideSet",
  "Question",
  "ArchetypeSession",
  "Archetype",
  "MappingSession",
  "MappingTranscript",
  "MappingCluster",
  "Simulation",
  "SimulationArchetype",
  "SimulationMessage",
  "SimulationQuestionCoverage",
  "CoachReview",
  "CoachConversation",
  "CoachConversationMessage",
  "AuditLog",
];

async function getColumns(tableName: string): Promise<string[]> {
  const info = sqlite.pragma(`table_info("${tableName}")`);
  return (info as { name: string }[]).map((col) => col.name);
}

async function migrateTable(tableName: string) {
  const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all() as Record<string, unknown>[];
  if (rows.length === 0) {
    console.log(`  ${tableName}: 0 rows (skipped)`);
    return;
  }

  const columns = await getColumns(tableName);
  const client = await pool.connect();

  try {
    // Build parameterized INSERT
    const colList = columns.map((c) => `"${c}"`).join(", ");
    const paramList = columns.map((_, i) => `$${i + 1}`).join(", ");
    const insertSQL = `INSERT INTO "${tableName}" (${colList}) VALUES (${paramList}) ON CONFLICT DO NOTHING`;

    let inserted = 0;
    for (const row of rows) {
      const values = columns.map((col) => {
        const val = row[col];
        // SQLite stores booleans as 0/1, PostgreSQL needs true/false
        if (val === 0 || val === 1) {
          // Check if this is actually a boolean column by checking the value type in context
          // We'll let PostgreSQL handle the casting
        }
        if (val === null || val === undefined) return null;
        return val;
      });

      try {
        await client.query(insertSQL, values);
        inserted++;
      } catch (err: unknown) {
        const pgErr = err as { code?: string; detail?: string };
        // Skip duplicate key errors
        if (pgErr.code === "23505") continue;
        console.error(`  Error inserting into ${tableName}:`, pgErr.detail || err);
      }
    }

    console.log(`  ${tableName}: ${inserted}/${rows.length} rows migrated`);
  } finally {
    client.release();
  }
}

async function main() {
  console.log("Starting data migration: SQLite → PostgreSQL\n");
  console.log(`SQLite: ${SQLITE_PATH}`);
  console.log(`PostgreSQL: ${PG_URL?.replace(/:[^@]+@/, ':***@')}\n`);

  for (const table of TABLES_IN_ORDER) {
    try {
      await migrateTable(table);
    } catch (err) {
      console.error(`  FAILED: ${table}`, err);
    }
  }

  console.log("\nMigration complete!");

  // Verify counts
  console.log("\n--- Verification ---");
  const client = await pool.connect();
  try {
    for (const table of ["Project", "SubProject", "KbDocument", "ProjectKbDocument", "GuideVersion", "Simulation", "MappingSession", "ArchetypeSession", "Archetype"]) {
      const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${res.rows[0].count} rows`);
    }
  } finally {
    client.release();
  }

  await pool.end();
  sqlite.close();
}

main().catch(console.error);
