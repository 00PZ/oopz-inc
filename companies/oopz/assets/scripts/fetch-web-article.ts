#!/usr/bin/env bun
/**
 * fetch-web-article.ts -- Oopz Knowledge Base Script
 *
 * Fetches web articles and blog posts via RSS/scrape and ingests them
 * into the project's knowledge base DB.
 *
 * Usage:
 *   bun run fetch-web-article.ts --project-slug shoshin --niche-slug world-mobile
 *
 * Required env vars:
 *   DATABASE_URL  -- Project KB DB (e.g. shoshin-kb), write role for active niche
 *
 * This script is a STUB. Implement the body before running.
 * See skills/web-article-adapter/SKILL.md for the full contract.
 * Respects robots.txt. Rate-limit: <= 1 req/s per domain.
 */

import { z } from "zod";
import { KnowledgeItemFrontmatter } from "../../skills/knowledge-base/schema.ts";

// ─── Arg Validation ───────────────────────────────────────────────────────────

const ArgsSchema = z.object({
  "project-slug": z.string().min(1).describe("Project slug (e.g. shoshin)"),
  "niche-slug": z.string().min(1).describe("Niche slug (e.g. world-mobile)"),
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

async function fetchWebArticle(projectSlug: string, nicheSlug: string): Promise<void> {
  throw new Error("fetch-web-article: not implemented yet. See skills/web-article-adapter/SKILL.md and README.md");
}

async function main(): Promise<void> {
  const args = parseArgs();
  const env = validateEnv();
  await fetchWebArticle(args["project-slug"], args["niche-slug"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(3);
});
