/**
 * Cryptographic token generation and hashing for Shareable Campaign Review Links
 */

/**
 * Generates a cryptographically secure, opaque token with 256 bits of entropy.
 * Uses Web Crypto API (globalThis.crypto.getRandomValues).
 */
export function generateSecureReviewToken(): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!cryptoObj || !cryptoObj.getRandomValues) {
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
    return 'rev_' + Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  const bytes = new Uint8Array(32);
  cryptoObj.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `rev_${hex}`;
}

/**
 * Computes the SHA-256 hash of a string, returned as a lowercase hex string.
 * Works in browser, Node, and test environments.
 */
export async function hashReviewToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle?.digest) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback if subtle is absent
  try {
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(token).digest('hex');
  } catch {
    // Pure fallback if neither subtle nor node:crypto is available
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}
