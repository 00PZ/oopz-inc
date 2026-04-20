#!/usr/bin/env bun
/**
 * fetch-clippings.ts -- Oopz Knowledge Base Script
 *
 * Parses Obsidian Web Clipper markdown files from raw/clippings/,
 * validates frontmatter, and ingests them into the project KB DB.
 *
 * Usage:
 *   bun run fetch-clippings.ts --niche-slug world-mobile
 *   bun run fetch-clippings.ts --niche-slug world-mobile --dry-run
 *   bun run fetch-clippings.ts --project-slug shoshin --niche-slug world-mobile
 *
 * Required env vars:
 *   DATABASE_URL  -- Project KB DB (e.g. shoshin-kb), write role for active niche
 *                    (not required in --dry-run mode)
 *
 * See skills/clippings-adapter/SKILL.md for the full contract.
 */

import { z } from "zod";
import postgres from "postgres";
import { createHash } from "crypto";
import { resolve, join } from "path";
import { readdir, readFile, mkdir, rename } from "fs/promises";
import {
  KnowledgeItemFrontmatter,
  type KnowledgeItemFrontmatterType,
} from "../../skills/knowledge-base/schema.ts";

type Sql = ReturnType<typeof postgres>;

// ---- Arg Parsing ----

const ArgsSchema = z.object({
  "project-slug": z.string().min(1),
  "niche-slug": z.string().min(1),
});

export interface ParsedArgs {
  projectSlug: string;
  nicheSlug: string;
  dryRun: boolean;
}

export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const raw: Record<string, string> = {};
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    const key = arg?.replace(/^--/, "");
    const val = argv[++i];
    if (key && val) raw[key] = val;
  }
  if (!raw["project-slug"]) raw["project-slug"] = "shoshin";

  const result = ArgsSchema.safeParse(raw);
  if (!result.success) {
    console.error("Invalid args:", result.error.format());
    console.error(
      "Usage: bun run fetch-clippings.ts --niche-slug <slug> [--project-slug <slug>] [--dry-run]",
    );
    process.exit(1);
  }
  return {
    projectSlug: result.data["project-slug"],
    nicheSlug: result.data["niche-slug"],
    dryRun,
  };
}

// ---- Frontmatter Parser ----

export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  const lines = match[1].split("\n");
  const fm: Record<string, unknown> = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (!key) continue;
    fm[key] = val.startsWith("[")
      ? val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : val;
  }
  return { frontmatter: fm, body: match[2] };
}

// ---- Content Hash ----

export function contentHash(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

// ---- Date Helpers ----

export function toISODatetime(
  val: string | undefined,
): string | undefined {
  if (!val) return undefined;
  if (val.includes("T")) return val;
  return `${val}T00:00:00.000Z`;
}

// ---- Row Builder ----

export function buildRow(
  nicheSlug: string,
  frontmatter: Record<string, unknown>,
  body: string,
): KnowledgeItemFrontmatterType {
  const hash = contentHash(body);
  const tags = Array.isArray(frontmatter.tags)
    ? (frontmatter.tags as string[]).filter((t) => t !== nicheSlug)
    : [];
  const publishedAt = toISODatetime(frontmatter.created_at as string | undefined);

  return {
    schema_version: 1,
    niche_slug: nicheSlug,
    source_type: "clippings",
    source_url: frontmatter.url as string,
    source_identifier: hash.slice(0, 16),
    captured_at: new Date().toISOString(),
    published_at: publishedAt,
    engagement_signals: {},
    extracted_hooks: [],
    extracted_quotes: [],
    tags,
    provenance: {
      adapter: "clippings",
      adapter_version: "0.1.0",
    },
    content_hash: hash,
  };
}

// ---- Paths ----

const SCRIPT_DIR = import.meta.dir;
const COMPANY_ROOT = resolve(SCRIPT_DIR, "../..");
const CLIPPINGS_DIR = join(COMPANY_ROOT, "raw", "clippings");
const PROCESSED_DIR = join(CLIPPINGS_DIR, "processed");

// ---- DB Insert ----

async function insertRow(
  sql: Sql,
  nicheSchema: string,
  row: KnowledgeItemFrontmatterType,
  bodyText: string,
): Promise<void> {
  await sql.unsafe(
    `INSERT INTO ${nicheSchema}.knowledge_items (
      schema_version, niche_slug, source_type, source_url, source_identifier,
      captured_at, published_at, engagement_signals, extracted_hooks,
      extracted_quotes, tags, provenance, content_hash, body_text
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      row.schema_version,
      row.niche_slug,
      row.source_type,
      row.source_url,
      row.source_identifier,
      row.captured_at,
      row.published_at ?? null,
      JSON.stringify(row.engagement_signals),
      JSON.stringify(row.extracted_hooks),
      JSON.stringify(row.extracted_quotes),
      JSON.stringify(row.tags),
      JSON.stringify(row.provenance),
      row.content_hash,
      bodyText,
    ],
  );
}

// ---- Main ----

async function main(): Promise<void> {
  const { projectSlug, nicheSlug, dryRun } = parseArgs();
  const nicheSchema = nicheSlug.replace(/-/g, "_");

  if (dryRun) {
    console.log("[dry-run] No DB writes or file moves will occur.");
  }

  let sql: Sql | null = null;
  const databaseUrl = process.env.DATABASE_URL;

  if (!dryRun && !databaseUrl) {
    console.error(
      "DATABASE_URL is required (use --dry-run to skip DB operations)",
    );
    process.exit(2);
  }

  if (databaseUrl && !dryRun) {
    sql = postgres(databaseUrl);
  }

  let files: string[];
  try {
    const entries = await readdir(CLIPPINGS_DIR);
    files = entries.filter((f) => f.endsWith(".md")).sort();
  } catch {
    console.log(
      `No clippings directory at ${CLIPPINGS_DIR}, nothing to process.`,
    );
    return;
  }

  if (files.length === 0) {
    console.log("No .md files in clippings directory.");
    return;
  }

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of files) {
    const filePath = join(CLIPPINGS_DIR, filename);
    try {
      const rawContent = await readFile(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(rawContent);

      if (!frontmatter.url) {
        console.warn(`[skip] ${filename}: missing 'url' in frontmatter`);
        skipped++;
        continue;
      }

      if (!frontmatter.niche) {
        console.warn(`[skip] ${filename}: missing 'niche' in frontmatter`);
        skipped++;
        continue;
      }
      if (frontmatter.niche !== nicheSlug) {
        console.warn(
          `[skip] ${filename}: niche '${frontmatter.niche}' does not match '${nicheSlug}'`,
        );
        skipped++;
        continue;
      }

      const row = buildRow(nicheSlug, frontmatter, body);

      const validated = KnowledgeItemFrontmatter.safeParse(row);
      if (!validated.success) {
        console.error(
          `[fail] ${filename}: schema validation failed`,
          validated.error.format(),
        );
        failed++;
        continue;
      }

      if (dryRun) {
        console.log(
          `[dry-run] Would insert: ${filename} (id=${row.source_identifier}, url=${row.source_url})`,
        );
        succeeded++;
        continue;
      }

      const bodyText = `> Source: ${row.source_url}\n\n${body}`;

      if (sql) {
        await insertRow(sql, nicheSchema, row, bodyText);
      }

      await mkdir(PROCESSED_DIR, { recursive: true });
      const datePfx = new Date().toISOString().slice(0, 10);
      const destPath = join(PROCESSED_DIR, `${datePfx}-${filename}`);
      await rename(filePath, destPath);

      console.log(`[ok] ${filename} -> processed/${datePfx}-${filename}`);
      succeeded++;
    } catch (err) {
      console.error(`[fail] ${filename}:`, err);
      failed++;
    }
  }

  console.log(
    `\nSummary: ${succeeded} succeeded, ${skipped} skipped, ${failed} failed`,
  );

  if (sql) await sql.end();
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(3);
  });
}
