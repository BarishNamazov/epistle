import { describe, expect, test } from "bun:test";
import {
  COMPRESSION_FORMAT,
  compressText,
  decompressToText,
} from "../modules/compress.js";

describe("compress / decompress", () => {
  test("COMPRESSION_FORMAT is brotli", () => {
    expect(COMPRESSION_FORMAT).toBe("brotli");
  });

  test("roundtrips plaintext through brotli", async () => {
    const input = "The quick brown fox jumps over the lazy dog.";
    const compressed = await compressText(input);
    expect(compressed).toBeInstanceOf(Uint8Array);
    expect(compressed.length).toBeGreaterThan(0);
    const decompressed = await decompressToText(compressed, "brotli");
    expect(decompressed).toBe(input);
  });

  test("roundtrips empty string", async () => {
    const compressed = await compressText("");
    const decompressed = await decompressToText(compressed, "brotli");
    expect(decompressed).toBe("");
  });

  test("roundtrips unicode content", async () => {
    const input = "こんにちは世界 🌍✨";
    const compressed = await compressText(input);
    const decompressed = await decompressToText(compressed, "brotli");
    expect(decompressed).toBe(input);
  });

  test("decompresses with 'br' alias", async () => {
    const input = "Test content";
    const compressed = await compressText(input);
    const decompressed = await decompressToText(compressed, "br");
    expect(decompressed).toBe(input);
  });

  test("throws for unsupported compression algorithm", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    await expect(decompressToText(bytes, "unknown-algo")).rejects.toThrow(
      "UNSUPPORTED_COMPRESSION",
    );
  });
});
