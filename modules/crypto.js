import {
  COMPRESSION_FORMAT,
  compressText,
  decompressToText,
} from "./compress.js";
import {
  AUTH_TAG_BITS,
  FIXED_HEADER,
  FLAG_HAS_TS,
  PBKDF2_ITERATIONS,
  SALT_LEN,
  TS_LEN,
} from "./constants.js";
import {
  decodePayload,
  encodePayload,
  encodeText,
  packByte,
  unpackByte,
} from "./encoding.js";

/**
 * Derive an AES-256 key and 96-bit GCM IV from a passphrase and salt via PBKDF2.
 * @param {string} passphrase
 * @param {Uint8Array} saltBytes
 * @returns {Promise<{ key: CryptoKey, iv: Uint8Array }>}
 */
async function deriveKeyAndIV(passphrase, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encodeText(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    352,
  );
  const derived = new Uint8Array(bits);
  const key = await crypto.subtle.importKey(
    "raw",
    derived.slice(0, 32),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  const iv = derived.slice(32, 44);
  return { key, iv };
}

/**
 * Encrypt plaintext into an encoded payload string.
 *
 * Packed binary format:
 * ```
 * [0]       packed byte [CCCFFFFF] (compression algo + flags)
 * [1..8]    salt (8 random bytes)
 * [opt 3B]  timestamp (uint24 days since epoch) when FLAG_HAS_TS is set
 * [...]     ciphertext (AES-GCM with 96-bit auth tag)
 * ```
 *
 * @param {string} plaintext - The letter content to encrypt.
 * @param {string} passphrase - Shared secret for key derivation.
 * @param {object} [options]
 * @param {boolean} [options.includeTimestamp=true] - Embed a sealed-on date.
 * @param {boolean} [options.useBase2048=false] - Use Base2048 for a shorter (Unicode) link.
 * @returns {Promise<string>} Encoded payload suitable for a URL hash.
 */
export async function encrypt(
  plaintext,
  passphrase,
  { includeTimestamp = true, useBase2048 = false } = {},
) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const { key, iv } = await deriveKeyAndIV(passphrase, salt);

  let flags = 0;
  let tsBytes = null;

  if (includeTimestamp) {
    flags |= FLAG_HAS_TS;
    const days = Math.floor(Date.now() / 86400000);
    tsBytes = new Uint8Array(3);
    tsBytes[0] = (days >>> 16) & 0xff;
    tsBytes[1] = (days >>> 8) & 0xff;
    tsBytes[2] = days & 0xff;
  }

  const compressed = await compressText(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: AUTH_TAG_BITS },
    key,
    compressed,
  );
  const cipherBytes = new Uint8Array(encrypted);

  const headerLen = FIXED_HEADER + (tsBytes ? TS_LEN : 0);
  const packed = new Uint8Array(headerLen + cipherBytes.length);

  let o = 0;
  packed[o++] = packByte(COMPRESSION_FORMAT, flags);
  packed.set(salt, o);
  o += SALT_LEN;
  if (tsBytes) {
    packed.set(tsBytes, o);
    o += TS_LEN;
  }
  packed.set(cipherBytes, o);

  return encodePayload(packed, useBase2048);
}

/**
 * Decrypt an encoded payload string back to plaintext.
 * @param {string} packed - Encoded payload (from a URL hash).
 * @param {string} passphrase - Shared secret used during encryption.
 * @returns {Promise<{ text: string, ts: number | null }>} Decrypted text and optional timestamp.
 */
export async function decrypt(packed, passphrase) {
  const data = await decodePayload(packed);

  let o = 0;
  const { compAlgo, flags } = unpackByte(data[o++]);

  const salt = data.subarray(o, o + SALT_LEN);
  o += SALT_LEN;

  let ts = null;
  if (flags & FLAG_HAS_TS) {
    const b0 = data[o++];
    const b1 = data[o++];
    const b2 = data[o++];
    const days = (b0 << 16) + (b1 << 8) + b2;
    ts = days * 86400000;
  }

  const ciphertext = data.subarray(o);

  const { key, iv } = await deriveKeyAndIV(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: AUTH_TAG_BITS },
    key,
    ciphertext,
  );
  const text = await decompressToText(new Uint8Array(decrypted), compAlgo);

  return { text, ts };
}
