import { test, expect, describe, mock, beforeAll, afterAll } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  mkdtemp,
  mkdir as fsMkdir,
  writeFile as fsWriteFile,
  rm,
} from "fs/promises";
import { tmpdir } from "os";
import {
  extractNiches,
  extractContext,
  parseArgs,
  syncCollections,
} from "../sync-qmd-collections.ts";

const FIXTURES_DIR = join(import.meta.dir, "../__fixtures__/qmd");

function loadFixture(path: string): string {
  return readFileSync(join(FIXTURES_DIR, path), "utf-8");
}

describe("extractNiches", () => {
  test("parses niches from PROJECT.md", () => {
    const content = loadFixture("PROJECT.md");
    const niches = extractNiches(content);
    expect(niches).toEqual(["test-niche"]);
  });

  test("returns empty array for missing niches", () => {
    const content = "---\nname: no niches\n---\n\nBody.";
    expect(extractNiches(content)).toEqual([]);
  });
});

describe("extractContext", () => {
  test("extracts Purpose paragraph from niche-profile SKILL.md", () => {
    const content = loadFixture("test-niche-niche-profile/SKILL.md");
    const context = extractContext(content);
    expect(context).toBe("Test niche purpose paragraph for unit testing.");
  });

  test("falls back to description when no Purpose heading", () => {
    const content =
      "---\ndescription: Fallback description text.\n---\n\n## Other\n\nContent.";
    expect(extractContext(content)).toBe("Fallback description text.");
  });

  test("returns default when no Purpose or description", () => {
    const content = "---\nname: bare\n---\n\n## Other\n\nContent.";
    expect(extractContext(content)).toBe(
      "Niche collection. See niche profile for details.",
    );
  });
});

describe("parseArgs", () => {
  test("parses --project-slug", () => {
    const args = parseArgs(["--project-slug", "shoshin"]);
    expect(args.projectSlug).toBe("shoshin");
    expect(args.dryRun).toBe(false);
    expect(args.skipEmbed).toBe(false);
  });

  test("sets dryRun true when --dry-run passed", () => {
    const args = parseArgs(["--project-slug", "shoshin", "--dry-run"]);
    expect(args.dryRun).toBe(true);
  });

  test("sets skipEmbed true when --skip-embed passed", () => {
    const args = parseArgs(["--project-slug", "shoshin", "--skip-embed"]);
    expect(args.skipEmbed).toBe(true);
  });
});

describe("syncCollections", () => {
  let tempRoot: string;

  beforeAll(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "qmd-sync-test-"));

    await fsMkdir(join(tempRoot, "projects", "test-project"), {
      recursive: true,
    });
    await fsMkdir(join(tempRoot, "skills", "test-niche-niche-profile"), {
      recursive: true,
    });
    await fsMkdir(join(tempRoot, ".qmd"), { recursive: true });

    const projectContent = loadFixture("PROJECT.md");
    const skillContent = loadFixture("test-niche-niche-profile/SKILL.md");

    await fsWriteFile(
      join(tempRoot, "projects", "test-project", "PROJECT.md"),
      projectContent,
    );
    await fsWriteFile(
      join(tempRoot, "skills", "test-niche-niche-profile", "SKILL.md"),
      skillContent,
    );
  });

  afterAll(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  test("with dryRun true, no qmd commands invoked", async () => {
    const mockRunner = mock(
      async (
        _cmd: string,
        _args: string[],
        _dryRun: boolean,
      ): Promise<string> => "",
    );

    const result = await syncCollections({
      projectSlug: "test-project",
      dryRun: true,
      skipEmbed: true,
      runner: mockRunner,
      companyRoot: tempRoot,
    });

    expect(mockRunner).not.toHaveBeenCalled();
    expect(result.nichesFound).toEqual(["test-niche"]);
    expect(result.collectionsAdded).toContain("test-niche");
  });

  test("with dryRun false, qmd commands invoked for missing collection", async () => {
    const mockRunner = mock(
      async (
        _cmd: string,
        args: string[],
        _dryRun: boolean,
      ): Promise<string> => {
        if (args.includes("list") && args.includes("--json")) return "[]";
        return "";
      },
    );

    const result = await syncCollections({
      projectSlug: "test-project",
      dryRun: false,
      skipEmbed: true,
      runner: mockRunner,
      companyRoot: tempRoot,
    });

    expect(mockRunner).toHaveBeenCalled();
    expect(result.collectionsAdded).toContain("test-niche");
    expect(result.contextSet).toContain("test-niche");
    expect(result.collectionsUpdated).toContain("test-niche");

    const calls = mockRunner.mock.calls;
    expect(calls.some((c) => c[1].includes("list"))).toBe(true);
    expect(
      calls.some(
        (c) => c[1].includes("--name") && c[1].includes("test-niche"),
      ),
    ).toBe(true);
    expect(calls.some((c) => c[1][0] === "context")).toBe(true);
    expect(calls.some((c) => c[1].includes("update"))).toBe(true);
  });
});
