/**
 * Oopz Knowledge Base -- Canonical Frontmatter Schema
 *
 * This is the single source of truth for knowledge item frontmatter.
 * All adapter scripts import and use this schema for validation.
 *
 * Usage:
 *   import { KnowledgeItemFrontmatter } from "../../skills/knowledge-base/schema.ts";
 *   const item = KnowledgeItemFrontmatter.parse(frontmatter);
 */

import { z } from "zod";

export const SourceTypeEnum = z.enum([
  "x-posts",
  "web-article",
  "youtube-transcripts",
  "manual-notes",
  "rss",
  "reddit",
]);
export type SourceType = z.infer<typeof SourceTypeEnum>;

export const ExtractedHookSchema = z.object({
  pattern: z
    .string()
    .describe(
      "Hook pattern category (e.g. 'contrarian', 'curiosity-gap', 'numeric')",
    ),
  text: z
    .string()
    .describe("The actual hook text extracted from the content"),
  confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
});
export type ExtractedHook = z.infer<typeof ExtractedHookSchema>;

export const ProvenanceSchema = z.object({
  adapter: z
    .string()
    .describe("Adapter slug (e.g. 'x-posts', 'web-article')"),
  adapter_version: z.string().describe("Adapter version (semver)"),
  fetch_job_id: z
    .string()
    .uuid()
    .optional()
    .describe("UUID of the fetch job that produced this item"),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const KnowledgeItemFrontmatter = z.object({
  schema_version: z
    .literal(1)
    .describe("Schema version, always 1 for this version"),
  niche_slug: z
    .string()
    .min(1)
    .describe("Niche identifier (e.g. 'world-mobile')"),
  source_type: SourceTypeEnum,
  source_url: z.string().url().optional().describe("URL to original source"),
  source_identifier: z
    .string()
    .min(1)
    .describe("Unique ID within source (tweet_id, canonical URL)"),
  captured_at: z
    .string()
    .datetime()
    .describe("ISO-8601 timestamp when this item was fetched"),
  published_at: z
    .string()
    .datetime()
    .optional()
    .describe(
      "ISO-8601 timestamp when original content was published",
    ),
  engagement_signals: z
    .record(z.string(), z.number())
    .describe("Platform-specific engagement metrics"),
  extracted_hooks: z
    .array(ExtractedHookSchema)
    .describe("Hook patterns extracted by intelligence-seed"),
  extracted_quotes: z
    .array(z.string())
    .describe("Notable quotes from content"),
  tags: z.array(z.string()).describe("Hashtags, keywords, topics"),
  provenance: ProvenanceSchema,
  content_hash: z
    .string()
    .optional()
    .describe("SHA-256 of body content for deduplication"),
});

export type KnowledgeItemFrontmatterType = z.infer<
  typeof KnowledgeItemFrontmatter
>;

/**
 * Validates a knowledge item frontmatter object.
 * Throws ZodError if invalid.
 */
export function validateKnowledgeItem(
  data: unknown,
): KnowledgeItemFrontmatterType {
  return KnowledgeItemFrontmatter.parse(data);
}

/**
 * Safe validation, returns { success, data, error } instead of throwing.
 */
export function safeValidateKnowledgeItem(data: unknown) {
  return KnowledgeItemFrontmatter.safeParse(data);
}
