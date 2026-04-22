import { test, expect, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  parseFrontmatter,
  contentHash,
  buildRow,
  toISODatetime,
  parseArgs,
} from "../fetch-clippings.ts";
import { KnowledgeItemFrontmatter } from "../../../skills/knowledge-base/schema.ts";

const FIXTURES_DIR = join(import.meta.dir, "../__fixtures__/clippings");

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf-8");
}

describe("parseFrontmatter", () => {
  test("extracts url and niche from valid-clip.md", () => {
    const raw = loadFixture("valid-clip.md");
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.url).toBe("https://example.com/article");
    expect(frontmatter.niche).toBe("world-mobile");
    expect(body.length).toBeGreaterThan(0);
  });

  test("parses tags as array from valid-clip.md", () => {
    const raw = loadFixture("valid-clip.md");
    const { frontmatter } = parseFrontmatter(raw);
    expect(Array.isArray(frontmatter.tags)).toBe(true);
    expect(frontmatter.tags).toContain("wmtx");
    expect(frontmatter.tags).toContain("depin");
  });

  test("missing-niche-clip.md has no niche field", () => {
    const raw = loadFixture("missing-niche-clip.md");
    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter.url).toBe("https://example.com/no-niche");
    expect(frontmatter.niche).toBeUndefined();
  });

  test("minimal-clip.md has only url and niche", () => {
    const raw = loadFixture("minimal-clip.md");
    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter.url).toBe("https://example.com/minimal");
    expect(frontmatter.niche).toBe("world-mobile");
    expect(frontmatter.tags).toBeUndefined();
    expect(frontmatter.created_at).toBeUndefined();
  });
});

describe("contentHash", () => {
  test("produces deterministic SHA-256 hex", () => {
    const body = "same content";
    const h1 = contentHash(body);
    const h2 = contentHash(body);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  test("different content produces different hashes", () => {
    expect(contentHash("aaa")).not.toBe(contentHash("bbb"));
  });
});

describe("toISODatetime", () => {
  test("returns undefined for undefined input", () => {
    expect(toISODatetime(undefined)).toBeUndefined();
  });

  test("passes through full ISO datetime", () => {
    const iso = "2026-04-15T00:00:00.000Z";
    expect(toISODatetime(iso)).toBe(iso);
  });

  test("appends time to date-only string", () => {
    expect(toISODatetime("2026-04-15")).toBe("2026-04-15T00:00:00.000Z");
  });
});

describe("buildRow", () => {
  test("valid-clip.md produces correct row shape", () => {
    const raw = loadFixture("valid-clip.md");
    const { frontmatter, body } = parseFrontmatter(raw);
    const row = buildRow("world-mobile", frontmatter, body);

    expect(row.schema_version).toBe(1);
    expect(row.niche_slug).toBe("world-mobile");
    expect(row.source_type).toBe("clippings");
    expect(row.source_url).toBe("https://example.com/article");
    expect(row.source_identifier).toHaveLength(16);
    expect(row.engagement_signals).toEqual({});
    expect(row.extracted_hooks).toEqual([]);
    expect(row.extracted_quotes).toEqual([]);
    expect(row.provenance.adapter).toBe("clippings");
    expect(row.provenance.adapter_version).toBe("0.1.0");
    expect(row.content_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("strips niche slug from tags", () => {
    const fm = {
      url: "https://example.com/test",
      niche: "world-mobile",
      tags: ["world-mobile", "wmtx", "depin"],
      created_at: "2026-04-15T00:00:00.000Z",
    };
    const row = buildRow("world-mobile", fm, "body");
    expect(row.tags).toEqual(["wmtx", "depin"]);
    expect(row.tags).not.toContain("world-mobile");
  });

  test("minimal frontmatter produces valid row with empty tags", () => {
    const raw = loadFixture("minimal-clip.md");
    const { frontmatter, body } = parseFrontmatter(raw);
    const row = buildRow("world-mobile", frontmatter, body);
    expect(row.tags).toEqual([]);
    expect(row.published_at).toBeUndefined();
  });

  test("row passes Zod validation", () => {
    const raw = loadFixture("valid-clip.md");
    const { frontmatter, body } = parseFrontmatter(raw);
    const row = buildRow("world-mobile", frontmatter, body);
    const result = KnowledgeItemFrontmatter.safeParse(row);
    expect(result.success).toBe(true);
  });

  test("minimal-clip row passes Zod validation", () => {
    const raw = loadFixture("minimal-clip.md");
    const { frontmatter, body } = parseFrontmatter(raw);
    const row = buildRow("world-mobile", frontmatter, body);
    const result = KnowledgeItemFrontmatter.safeParse(row);
    expect(result.success).toBe(true);
  });
});

describe("parseArgs", () => {
  test("defaults project-slug to shoshin", () => {
    const args = parseArgs(["--niche-slug", "world-mobile"]);
    expect(args.projectSlug).toBe("shoshin");
    expect(args.nicheSlug).toBe("world-mobile");
    expect(args.dryRun).toBe(false);
  });

  test("recognizes --dry-run flag", () => {
    const args = parseArgs(["--niche-slug", "world-mobile", "--dry-run"]);
    expect(args.dryRun).toBe(true);
    expect(args.nicheSlug).toBe("world-mobile");
  });
});
