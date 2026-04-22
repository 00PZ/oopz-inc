#!/usr/bin/env bun
/**
 * sync-qmd-collections.ts
 *
 * Reads niches from COMPANY.md, ensures a qmd collection
 * exists per niche, sets context, and triggers index updates.
 *
 * Usage:
 *   bun run sync-qmd-collections.ts --company-slug shoshin
 *   bun run sync-qmd-collections.ts --company-slug shoshin --dry-run
 *   bun run sync-qmd-collections.ts --company-slug shoshin --skip-embed
 */

import { z } from "zod";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

// ---- Constants ----

const SCRIPT_DIR = import.meta.dir;
const COMPANY_ROOT = resolve(SCRIPT_DIR, "../..");

// ---- Types ----

export type CommandRunner = (
  cmd: string,
  args: string[],
  dryRun: boolean,
) => Promise<string>;

export interface ParsedArgs {
  companySlug: string;
  dryRun: boolean;
  skipEmbed: boolean;
}

export interface SyncResult {
  nichesFound: string[];
  collectionsAdded: string[];
  collectionsUpdated: string[];
  contextSet: string[];
  errors: string[];
}

// ---- Arg Parsing ----

const ArgsSchema = z.object({
  "company-slug": z.string().min(1),
});

export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const raw: Record<string, string> = {};
  let dryRun = false;
  let skipEmbed = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--skip-embed") {
      skipEmbed = true;
      continue;
    }
    const key = arg?.replace(/^--/, "");
    const val = argv[++i];
    if (key && val) raw[key] = val;
  }

  const result = ArgsSchema.safeParse(raw);
  if (!result.success) {
    console.error("Invalid args:", result.error.format());
    console.error(
      "Usage: bun run sync-qmd-collections.ts --company-slug <slug> [--dry-run] [--skip-embed]",
    );
    process.exit(1);
  }

  return {
    companySlug: result.data["company-slug"],
    dryRun,
    skipEmbed,
  };
}

// ---- Frontmatter Parser ----

function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const lines = match[1].split("\n");
  const fm: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let listItems: string[] = [];

  for (const line of lines) {
    // YAML block list item (indented "- value")
    const listMatch = line.match(/^\s+-\s+(.+)/);
    if (listMatch && currentKey) {
      listItems.push(listMatch[1].trim());
      continue;
    }

    // Flush accumulated list to previous key
    if (currentKey && listItems.length > 0) {
      fm[currentKey] = listItems;
      listItems = [];
      currentKey = null;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    if (val.startsWith("[")) {
      fm[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (val === "" || val === "|") {
      currentKey = key;
      listItems = [];
    } else {
      fm[key] = val;
    }
  }

  if (currentKey && listItems.length > 0) {
    fm[currentKey] = listItems;
  }

  return { frontmatter: fm, body: match[2] };
}

// ---- Niche Extraction ----

const ProjectFrontmatter = z.object({
  niches: z.array(z.string()),
});

export function extractNiches(projectMdContent: string): string[] {
  const { frontmatter } = parseFrontmatter(projectMdContent);
  const parsed = ProjectFrontmatter.safeParse(frontmatter);
  if (!parsed.success) return [];
  return parsed.data.niches;
}

// ---- Context Extraction ----

export function extractContext(skillMdContent: string): string {
  const { frontmatter, body } = parseFrontmatter(skillMdContent);

  // Primary: first paragraph after ## Purpose heading
  const purposeMatch = body.match(/## Purpose\s*\n+([^\n#]+)/);
  if (purposeMatch) {
    return purposeMatch[1].trim().slice(0, 200);
  }

  // Fallback: description frontmatter field
  if (typeof frontmatter.description === "string" && frontmatter.description) {
    return frontmatter.description.slice(0, 200);
  }

  return "Niche collection. See niche profile for details.";
}

// ---- Command Runner ----

export async function runCommand(
  cmd: string,
  args: string[],
  _dryRun: boolean,
): Promise<string> {
  const proc = spawnSync(cmd, args, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} exited with ${proc.status ?? "unknown"}: ${proc.stderr}`,
    );
  }
  return proc.stdout;
}

// ---- qmd.yml Regeneration ----

async function regenerateQmdYml(
  companyRoot: string,
  niches: Array<{ slug: string; context: string }>,
  dryRun: boolean,
): Promise<void> {
  const qmdPath = join(companyRoot, ".qmd", "qmd.yml");

  const collectionsBlock = niches
    .map(({ slug, context }) => {
      const wikiPath = `companies/shoshin/.evidence/wiki/${slug}`;
      const escaped = context.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return [
        `  ${slug}:`,
        `    path: ${wikiPath}`,
        `    pattern: "**/*.md"`,
        `    ignore:`,
        `      - "_lint/**"`,
        `    context: "${escaped}"`,
      ].join("\n");
    })
    .join("\n");

  const content = [
    "# Shoshin qmd collections",
    "# One collection per niche. Collection name MUST match niche slug.",
    "# Paths are relative to the repo root (companies/shoshin/).",
    "# DO NOT edit this file directly; use assets/scripts/sync-qmd-collections.ts",
    "# which reads COMPANY.md:niches and keeps this in sync.",
    "",
    "collections:",
    collectionsBlock,
    "",
    "# editor_uri preference for click-through from search results",
    'editor_uri: "vscode://file/{path}:{line}:{col}"',
    "",
  ].join("\n");

  if (dryRun) {
    console.log(`[dry-run] Would write ${qmdPath}`);
    return;
  }

  await mkdir(join(companyRoot, ".qmd"), { recursive: true });
  await writeFile(qmdPath, content, "utf-8");
}

// ---- Collection Sync ----

export async function syncCollections(opts: {
  companySlug: string;
  dryRun: boolean;
  skipEmbed: boolean;
  runner?: CommandRunner;
  companyRoot?: string;
}): Promise<SyncResult> {
  const run = opts.runner ?? runCommand;
  const root = opts.companyRoot ?? COMPANY_ROOT;
  const { dryRun, skipEmbed } = opts;

  const result: SyncResult = {
    nichesFound: [],
    collectionsAdded: [],
    collectionsUpdated: [],
    contextSet: [],
    errors: [],
  };

  const companyPath = join(root, "COMPANY.md");
  const companyContent = await readFile(companyPath, "utf-8");
  const niches = extractNiches(companyContent);
  result.nichesFound = niches;

  if (niches.length === 0) {
    console.log("No niches found in COMPANY.md");
    return result;
  }

  // Get existing collections (skip in dry-run, no runner calls)
  let existingCollections: string[] = [];
  if (!dryRun) {
    try {
      const listOutput = await run("qmd", ["collection", "list", "--json"], false);
      if (listOutput) {
        const parsed = JSON.parse(listOutput);
        existingCollections = Array.isArray(parsed)
          ? parsed
              .map((c: Record<string, unknown>) => c.name)
              .filter((n): n is string => typeof n === "string")
          : [];
      }
    } catch {
      // qmd unavailable or empty; treat as no existing collections
    }
  }

  const nicheContexts: Array<{ slug: string; context: string }> = [];

  for (const niche of niches) {
    try {
      const skillPath = join(root, "skills", `${niche}-niche-profile`, "SKILL.md");
      let context: string;
      try {
        const skillContent = await readFile(skillPath, "utf-8");
        context = extractContext(skillContent);
      } catch {
        context = `${niche} niche collection. See niche profile for details.`;
      }

      nicheContexts.push({ slug: niche, context });

      if (dryRun) {
        console.log(`[dry-run] Would sync collection: ${niche}`);
        console.log(`[dry-run]   context: ${context}`);
        console.log(
          `[dry-run]   commands: collection add, context add, update${skipEmbed ? "" : ", embed"}`,
        );
        result.collectionsAdded.push(niche);
        result.contextSet.push(niche);
        result.collectionsUpdated.push(niche);
        continue;
      }

      const collectionPath = join(root, ".evidence", "wiki", niche);
      if (!existingCollections.includes(niche)) {
        await run(
          "qmd",
          ["collection", "add", collectionPath, "--name", niche, "--mask", "**/*.md"],
          false,
        );
        result.collectionsAdded.push(niche);
      }

      await run("qmd", ["context", "add", `qmd://${niche}`, context], false);
      result.contextSet.push(niche);

      await run("qmd", ["update", "-c", niche], false);
      result.collectionsUpdated.push(niche);

      if (!skipEmbed) {
        await run("qmd", ["embed", "-c", niche], false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${niche}: ${msg}`);
    }
  }

  await regenerateQmdYml(root, nicheContexts, dryRun);

  return result;
}

// ---- Main ----

async function main(): Promise<void> {
  const { companySlug, dryRun, skipEmbed } = parseArgs();

  if (dryRun) {
    console.log("[dry-run] No qmd commands or file writes will occur.");
  }

  const result = await syncCollections({ companySlug, dryRun, skipEmbed });

  console.log("\n--- Sync Summary ---");
  console.log(`Niches found: ${result.nichesFound.join(", ") || "none"}`);
  console.log(`Collections added: ${result.collectionsAdded.join(", ") || "none"}`);
  console.log(`Collections updated: ${result.collectionsUpdated.join(", ") || "none"}`);
  console.log(`Context set: ${result.contextSet.join(", ") || "none"}`);
  if (result.errors.length > 0) {
    console.error(`Errors: ${result.errors.join("; ")}`);
    process.exit(2);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(3);
  });
}
