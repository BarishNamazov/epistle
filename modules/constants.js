/** Number of PBKDF2 iterations for key derivation. */
export const PBKDF2_ITERATIONS = 310000;

/** localStorage key for persisting the letter draft. */
export const LETTER_DRAFT_STORAGE_KEY = "sealed_letter_draft";

/** localStorage key for the fullscreen textarea height. */
export const FULLSCREEN_TEXTAREA_HEIGHT_KEY = "sealed_letter_fullscreen_height";

/** localStorage key for the fullscreen textarea width. */
export const FULLSCREEN_TEXTAREA_WIDTH_KEY = "sealed_letter_fullscreen_width";

/** Minimum height (px) before persisting fullscreen textarea size. */
export const MIN_SAVED_FULLSCREEN_HEIGHT_PX = 180;

/** Minimum width (px) before persisting fullscreen textarea size. */
export const MIN_SAVED_FULLSCREEN_WIDTH_PX = 280;

/** Random salt length in bytes. */
export const SALT_LEN = 8;

/** Timestamp length — uint24 days since epoch (~123 years). */
export const TS_LEN = 3;

/** Fixed header size: 1 packed byte + salt. */
export const FIXED_HEADER = 1 + SALT_LEN;

/** AES-GCM authentication tag length in bits (NIST-recommended minimum). */
export const AUTH_TAG_BITS = 96;

/**
 * Flag indicating the payload contains a timestamp.
 * Packed byte layout: `[CCCFFFFF]` — high 3 bits = compression algo, low 5 bits = flags.
 */
export const FLAG_HAS_TS = 1 << 0;

/** Supported compression algorithms (3 bits → max 8). */
export const COMP_ALGOS = ["deflate-raw", "brotli", "br", "gzip", "deflate"];

/**
 * Encode compression algorithm and flags into a single byte.
 * @param {string} compAlgo - Compression algorithm name (must be in {@link COMP_ALGOS}).
 * @param {number} flags - Bit flags (lower 5 bits).
 * @returns {number} Packed byte.
 */
export function packByte(compAlgo, flags) {
  const idx = COMP_ALGOS.indexOf(compAlgo);
  if (idx === -1)
    throw new Error("Unsupported compression algorithm for packing.");
  return ((idx & 0x7) << 5) | (flags & 0x1f);
}

/**
 * Decode a packed byte into compression algorithm and flags.
 * @param {number} b - The packed byte.
 * @returns {{ compAlgo: string, flags: number }}
 */
export function unpackByte(b) {
  const compIdx = (b >> 5) & 0x7;
  const flags = b & 0x1f;
  if (compIdx >= COMP_ALGOS.length)
    throw new Error("Unknown compression byte in payload.");
  return { compAlgo: COMP_ALGOS[compIdx], flags };
}

/**
 * Encode a string to UTF-8 bytes.
 * @param {string} str
 * @returns {Uint8Array}
 */
export function encodeText(str) {
  return new TextEncoder().encode(str);
}

/**
 * Decode UTF-8 bytes to a string.
 * @param {BufferSource} buf
 * @returns {string}
 */
export function decodeText(buf) {
  return new TextDecoder().decode(buf);
}
