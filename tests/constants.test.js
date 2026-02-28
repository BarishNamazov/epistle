import { describe, expect, test } from "bun:test";
import {
  AUTH_TAG_BITS,
  FIXED_HEADER,
  SALT_LEN,
  TS_LEN,
} from "../modules/constants.js";

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
