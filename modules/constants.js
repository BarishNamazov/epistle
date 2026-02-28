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

