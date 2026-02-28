import { describe, expect, test } from "bun:test";
import {
  AUTH_TAG_BITS,
  COMP_ALGOS,
  FIXED_HEADER,
  FLAG_HAS_TS,
  SALT_LEN,
  TS_LEN,
  decodeText,
  encodeText,
  packByte,
  unpackByte,
} from "../modules/constants.js";

describe("encodeText / decodeText", () => {
  test("roundtrips ASCII strings", () => {
    const str = "Hello, world!";
    expect(decodeText(encodeText(str))).toBe(str);
  });

  test("roundtrips Unicode strings", () => {
    const str = "こんにちは 🌍";
    expect(decodeText(encodeText(str))).toBe(str);
  });

  test("handles empty string", () => {
    expect(decodeText(encodeText(""))).toBe("");
  });
});

describe("packByte / unpackByte", () => {
  test("roundtrips each compression algorithm", () => {
    for (const algo of COMP_ALGOS) {
      const packed = packByte(algo, 0);
      const { compAlgo, flags } = unpackByte(packed);
      expect(compAlgo).toBe(algo);
      expect(flags).toBe(0);
    }
  });

  test("preserves flags", () => {
    const packed = packByte("brotli", FLAG_HAS_TS);
    const { compAlgo, flags } = unpackByte(packed);
    expect(compAlgo).toBe("brotli");
    expect(flags & FLAG_HAS_TS).toBeTruthy();
  });

  test("preserves multiple flag bits", () => {
    const flagValue = 0b10101;
    const packed = packByte("gzip", flagValue);
    const { compAlgo, flags } = unpackByte(packed);
    expect(compAlgo).toBe("gzip");
    expect(flags).toBe(flagValue);
  });

  test("throws on unsupported algorithm", () => {
    expect(() => packByte("lz4", 0)).toThrow();
  });

  test("throws on out-of-range comp index", () => {
    const invalidByte = 0xff;
    expect(() => unpackByte(invalidByte)).toThrow();
  });
});

describe("constants", () => {
  test("SALT_LEN is 8 bytes", () => {
    expect(SALT_LEN).toBe(8);
  });

  test("TS_LEN is 3 bytes", () => {
    expect(TS_LEN).toBe(3);
  });

  test("FIXED_HEADER equals 1 + SALT_LEN", () => {
    expect(FIXED_HEADER).toBe(1 + SALT_LEN);
  });

  test("AUTH_TAG_BITS is 96", () => {
    expect(AUTH_TAG_BITS).toBe(96);
  });
});
