#!/usr/bin/env bun
/**
 * fetch-x-posts.ts -- Oopz Knowledge Base Script
 *
 * Fetches curated X/Twitter posts from tweet-curator-pg and ingests them
 * into the project's knowledge base DB (shoshin-kb or other project KB).
 *
 * Usage:
 *   bun run fetch-x-posts.ts --project-slug shoshin --niche-slug world-mobile
 *
 * Required env vars:
 *   DATABASE_URL          -- Project KB DB (e.g. shoshin-kb), write role for active niche
 *   CURATOR_DATABASE_URL  -- tweet-curator-pg, READ-ONLY
 *
 * This script is a STUB. Implement the body before running.
 * See skills/x-posts-adapter/SKILL.md for the full contract.
 */

import { z } from "zod";
import type { KnowledgeItemFrontmatterType } from "../../skills/knowledge-base/schema.ts";
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
  CURATOR_DATABASE_URL: z.string().min(1).describe("tweet-curator-pg READ-ONLY connection string"),
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

async function fetchXPosts(projectSlug: string, nicheSlug: string): Promise<void> {
  throw new Error("fetch-x-posts: not implemented yet. See skills/x-posts-adapter/SKILL.md and README.md");
}

async function main(): Promise<void> {
  const args = parseArgs();
  const env = validateEnv();
  await fetchXPosts(args["project-slug"], args["niche-slug"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(3);
});
