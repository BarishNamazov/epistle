const B85_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~!$&'()*+,;=:@/?^|{}";
const B85_DECODE = new Uint8Array(128);
for (let i = 0; i < 85; i++) B85_DECODE[B85_ALPHABET.charCodeAt(i)] = i;

/**
 * Encode bytes to a URL-fragment-safe Base85 string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase85(bytes) {
  let result = "";
  const len = bytes.length;
  const fullGroups = Math.floor(len / 4);

  for (let g = 0; g < fullGroups; g++) {
    const i = g * 4;
    let acc =
      ((bytes[i] << 24) |
        (bytes[i + 1] << 16) |
        (bytes[i + 2] << 8) |
        bytes[i + 3]) >>>
      0;
    const c = new Array(5);
    for (let j = 4; j >= 0; j--) {
      c[j] = B85_ALPHABET[acc % 85];
      acc = Math.floor(acc / 85);
    }
    result += c[0] + c[1] + c[2] + c[3] + c[4];
  }

  const rem = len % 4;
  if (rem > 0) {
    let acc = 0;
    const offset = fullGroups * 4;
    for (let i = 0; i < rem; i++) acc = (acc << 8) | bytes[offset + i];
    acc <<= (4 - rem) * 8;
    acc >>>= 0;
    const chars = rem + 1;
    const c = new Array(5);
    for (let j = 4; j >= 0; j--) {
      c[j] = B85_ALPHABET[acc % 85];
      acc = Math.floor(acc / 85);
    }
    result += c.slice(0, chars).join("");
  }

  return result;
}

/**
 * Decode a Base85 string back to bytes.
 * @param {string} str
 * @returns {Uint8Array}
 */
function base85ToBytes(str) {
  const sLen = str.length;
  const fullGroups = Math.floor(sLen / 5);
  const remChars = sLen % 5;
  const remBytes = remChars > 0 ? remChars - 1 : 0;
  const out = new Uint8Array(fullGroups * 4 + remBytes);

  let o = 0;
  for (let g = 0; g < fullGroups; g++) {
    const si = g * 5;
    let acc = 0;
    for (let j = 0; j < 5; j++)
      acc = acc * 85 + B85_DECODE[str.charCodeAt(si + j)];
    out[o++] = (acc >>> 24) & 0xff;
    out[o++] = (acc >>> 16) & 0xff;
    out[o++] = (acc >>> 8) & 0xff;
    out[o++] = acc & 0xff;
  }

  if (remChars > 0) {
    const si = fullGroups * 5;
    let acc = 0;
    for (let j = 0; j < remChars; j++)
      acc = acc * 85 + B85_DECODE[str.charCodeAt(si + j)];
    for (let j = remChars; j < 5; j++) acc = acc * 85 + 84;
    acc >>>= 0;
    for (let j = 0; j < remBytes; j++) {
      out[o++] = (acc >>> (24 - j * 8)) & 0xff;
    }
  }

  return out;
}

let _base2048 = null;

/** @returns {Promise<typeof import("base2048")>} Lazily loaded base2048 module. */
async function getBase2048() {
  if (!_base2048) {
    _base2048 = await import("base2048");
  }
  return _base2048;
}

/**
 * Detect whether a string is Base2048-encoded (contains non-ASCII characters).
 * @param {string} str
 * @returns {boolean}
 */
function isBase2048(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) return true;
  }
  return false;
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
 * Encode bytes to a string using Base85 or Base2048.
 * @param {Uint8Array} bytes
 * @param {boolean} useBase2048 - When true, use the shorter (Unicode) encoding.
 * @returns {Promise<string>}
 */
export async function encodePayload(bytes, useBase2048) {
  if (useBase2048) {
    const b2048 = await getBase2048();
    return b2048.encode(bytes);
  }
  return bytesToBase85(bytes);
}

/**
 * Decode an encoded string back to bytes, auto-detecting the encoding.
 * @param {string} str
 * @returns {Promise<Uint8Array>}
 */
export async function decodePayload(str) {
  if (isBase2048(str)) {
    const b2048 = await getBase2048();
    return b2048.decode(str);
  }
  return base85ToBytes(str);
}
