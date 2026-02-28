import { decodeText, encodeText } from "./encoding.js";

let _brotli = null;

/** @returns {Promise<typeof import("brotli-wasm")>} Lazily loaded brotli-wasm instance. */
async function getBrotli() {
  if (!_brotli) {
    const mod = await import("brotli-wasm");
    _brotli = await mod.default;
  }
  return _brotli;
}

/** Compression algorithm used when sealing letters (must be in COMP_ALGOS). */
export const COMPRESSION_FORMAT = "brotli";

/**
 * Compress a plaintext string using Brotli (quality 11).
 * @param {string} plaintext
 * @returns {Promise<Uint8Array>}
 */
export async function compressText(plaintext) {
  const brotli = await getBrotli();
  return brotli.compress(encodeText(plaintext), { quality: 11 });
}

/**
 * Decompress bytes back to a string using the specified algorithm.
 * Falls back to the native DecompressionStream API for non-Brotli formats.
 * @param {Uint8Array} compBytes - Compressed bytes.
 * @param {string} algo - Compression algorithm name.
 * @returns {Promise<string>}
 * @throws {Error} `UNSUPPORTED_COMPRESSION` when the browser lacks support for the algorithm.
 */
export async function decompressToText(compBytes, algo) {
  if (algo === "brotli" || algo === "br") {
    const brotli = await getBrotli();
    return decodeText(brotli.decompress(compBytes));
  }
  try {
    new DecompressionStream(algo);
  } catch (e) {
    throw new Error("UNSUPPORTED_COMPRESSION");
  }
  const stream = new Blob([compBytes])
    .stream()
    .pipeThrough(new DecompressionStream(algo));
  const rawBytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return decodeText(rawBytes);
}
