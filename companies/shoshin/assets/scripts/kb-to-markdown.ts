#!/usr/bin/env bun
/**
 * kb-to-markdown.ts -- Oopz Knowledge Base Script
 *
 * Projects knowledge_items rows from the project KB DB into markdown files
 * under .evidence/knowledge/<niche-slug>/<source-type>/.
 *
 * Usage:
 *   bun run kb-to-markdown.ts --project-slug shoshin --niche-slug world-mobile --source-type x-posts
 *
 * Required env vars:
 *   DATABASE_URL  -- Project KB DB (read access sufficient)
 *
 * This script is a STUB. Implement the body before running.
 * See skills/knowledge-base/SKILL.md for the frontmatter contract.
 */

import { z } from "zod";
import { KnowledgeItemFrontmatter } from "../../skills/knowledge-base/schema.ts";

// ─── Arg Validation ───────────────────────────────────────────────────────────

const SourceTypeEnum = z.enum(["x-posts", "web-article", "youtube-transcripts", "manual-notes", "rss", "reddit"]);

const ArgsSchema = z.object({
  "project-slug": z.string().min(1).describe("Project slug (e.g. shoshin)"),
  "niche-slug": z.string().min(1).describe("Niche slug (e.g. world-mobile)"),
  "source-type": SourceTypeEnum.describe("Source type to project"),
});

function parseArgs(): z.infer<typeof ArgsSchema> {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace(/^--/, "");
    const val = process.argv[i + 1];
    if (key && val) args[key] = val;
  }
  const result = ArgsSchema.safeParse(args);
  if (!result.success) {
    console.error("Invalid args:", result.error.format());
    process.exit(1);
  }
  return result.data;
}

// ─── Env Validation ───────────────────────────────────────────────────────────

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1).describe("Project KB DB connection string"),
});

function validateEnv(): z.infer<typeof EnvSchema> {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Missing env vars:", result.error.format());
    process.exit(2);
  }
  return result.data;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function kbToMarkdown(projectSlug: string, nicheSlug: string, sourceType: string): Promise<void> {
  throw new Error("kb-to-markdown: not implemented yet. See skills/knowledge-base/SKILL.md and README.md");
}

async function main(): Promise<void> {
  const args = parseArgs();
  const env = validateEnv();
  await kbToMarkdown(args["project-slug"], args["niche-slug"], args["source-type"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(3);
});
