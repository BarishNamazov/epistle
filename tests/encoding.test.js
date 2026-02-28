import { describe, expect, test } from "bun:test";
import { FLAG_HAS_TS } from "../modules/constants.js";
import {
  COMP_ALGOS,
  decodePayload,
  decodeText,
  encodePayload,
  encodeText,
  packByte,
  unpackByte,
} from "../modules/encoding.js";

describe("Base85 encoding", () => {
  test("roundtrips empty bytes", async () => {
    const input = new Uint8Array(0);
    const encoded = await encodePayload(input, false);
    const decoded = await decodePayload(encoded);
    expect(decoded).toEqual(input);
  });

  test("roundtrips small byte arrays", async () => {
    const input = new Uint8Array([1, 2, 3, 4]);
    const encoded = await encodePayload(input, false);
    expect(typeof encoded).toBe("string");
    const decoded = await decodePayload(encoded);
    expect(decoded).toEqual(input);
  });

  test("roundtrips non-aligned byte arrays", async () => {
    for (const len of [1, 2, 3, 5, 7, 13]) {
      const input = new Uint8Array(len);
      for (let i = 0; i < len; i++) input[i] = (i * 37 + 7) & 0xff;
      const encoded = await encodePayload(input, false);
      const decoded = await decodePayload(encoded);
      expect(decoded).toEqual(input);
    }
  });

  test("roundtrips larger payloads", async () => {
    const input = new Uint8Array(256);
    for (let i = 0; i < 256; i++) input[i] = i;
    const encoded = await encodePayload(input, false);
    const decoded = await decodePayload(encoded);
    expect(decoded).toEqual(input);
  });

  test("produces only ASCII output", async () => {
    const input = new Uint8Array([0xff, 0x00, 0xab, 0xcd]);
    const encoded = await encodePayload(input, false);
    for (let i = 0; i < encoded.length; i++) {
      expect(encoded.charCodeAt(i)).toBeLessThanOrEqual(127);
    }
  });
});

describe("Base2048 encoding", () => {
  test("roundtrips small byte arrays", async () => {
    const input = new Uint8Array([10, 20, 30, 40, 50]);
    const encoded = await encodePayload(input, true);
    expect(typeof encoded).toBe("string");
    const decoded = await decodePayload(encoded);
    expect(decoded).toEqual(input);
  });

  test("produces non-ASCII output", async () => {
    const input = new Uint8Array([1, 2, 3, 4]);
    const encoded = await encodePayload(input, true);
    const hasNonAscii = [...encoded].some((ch) => ch.charCodeAt(0) > 127);
    expect(hasNonAscii).toBe(true);
  });

  test("auto-detected during decode", async () => {
    const input = new Uint8Array([99, 100, 101, 102]);
    const encoded = await encodePayload(input, true);
    const decoded = await decodePayload(encoded);
    expect(decoded).toEqual(input);
  });
});

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
