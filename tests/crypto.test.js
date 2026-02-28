import { describe, expect, test } from "bun:test";
import { decrypt, encrypt, formatSealedOn } from "../modules/crypto.js";

describe("encrypt / decrypt roundtrip", () => {
  test("roundtrips with Base85 encoding", async () => {
    const plaintext = "Hello, friend!";
    const passphrase = "secret123";
    const encoded = await encrypt(plaintext, passphrase, {
      useBase2048: false,
    });
    const { text } = await decrypt(encoded, passphrase);
    expect(text).toBe(plaintext);
  });

  test("roundtrips with Base2048 encoding", async () => {
    const plaintext =
      "Dear friend, this is a longer letter with special chars: àéîõü 🎉";
    const passphrase = "my-passphrase";
    const encoded = await encrypt(plaintext, passphrase, {
      useBase2048: true,
    });
    const { text } = await decrypt(encoded, passphrase);
    expect(text).toBe(plaintext);
  });

  test("includes timestamp by default", async () => {
    const encoded = await encrypt("test", "pass");
    const { ts } = await decrypt(encoded, "pass");
    expect(ts).toBeGreaterThan(0);
    const date = new Date(ts);
    const now = new Date();
    expect(date.getFullYear()).toBe(now.getFullYear());
  });

  test("omits timestamp when disabled", async () => {
    const encoded = await encrypt("test", "pass", {
      includeTimestamp: false,
    });
    const { ts } = await decrypt(encoded, "pass");
    expect(ts).toBeNull();
  });

  test("fails with wrong passphrase", async () => {
    const encoded = await encrypt("secret message", "correct-pass");
    await expect(decrypt(encoded, "wrong-pass")).rejects.toThrow();
  });

  test("handles empty plaintext", async () => {
    const encoded = await encrypt("", "pass");
    const { text } = await decrypt(encoded, "pass");
    expect(text).toBe("");
  });

  test("handles unicode-heavy content", async () => {
    const plaintext = "日本語テスト 🇯🇵\nLine 2\nLine 3";
    const encoded = await encrypt(plaintext, "パスワード");
    const { text } = await decrypt(encoded, "パスワード");
    expect(text).toBe(plaintext);
  });
});

describe("formatSealedOn", () => {
  test("returns empty string for null", () => {
    expect(formatSealedOn(null)).toBe("");
  });

  test("returns empty string for 0", () => {
    expect(formatSealedOn(0)).toBe("");
  });

  test("formats a valid timestamp", () => {
    const ts = new Date("2024-06-15").getTime();
    const result = formatSealedOn(ts);
    expect(result).toContain("Sealed on");
    expect(result).toContain("2024");
    expect(result).toContain("June");
  });
});
