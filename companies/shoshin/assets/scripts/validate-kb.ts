#!/usr/bin/env bun
/**
 * validate-kb.ts -- Oopz Knowledge Base Script
 *
 * Validates all markdown files in .evidence/knowledge/<niche-slug>/ against
 * the KnowledgeItemFrontmatter Zod schema. No DB access required.
 *
 * Usage:
 *   bun run validate-kb.ts --niche-slug world-mobile
 *
 * Exit codes:
 *   0 -- all files valid
 *   1 -- one or more files invalid (details printed to stdout)
 *
 * This script is a STUB. Implement the body before running.
 * See skills/knowledge-base/SKILL.md for the frontmatter contract.
 */

import { z } from "zod";
import { KnowledgeItemFrontmatter } from "../../skills/knowledge-base/schema.ts";

// ─── Arg Validation ───────────────────────────────────────────────────────────

const ArgsSchema = z.object({
  "niche-slug": z.string().min(1).describe("Niche slug to validate (e.g. world-mobile)"),
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function validateKb(nicheSlug: string): Promise<void> {
  throw new Error("validate-kb: not implemented yet. See skills/knowledge-base/SKILL.md and README.md");
}

async function main(): Promise<void> {
  const args = parseArgs();
  await validateKb(args["niche-slug"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
