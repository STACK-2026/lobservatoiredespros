/**
 * HMAC-SHA256 tokens stateless pour magic link artisan.
 * Format token : base64url(payload).base64url(signature)
 *   payload = {avis_id, pro_id, exp, type, nonce}
 *   signature = HMAC-SHA256(payload_b64url, env.AVIS_TOKEN_SECRET)
 *
 * Verification stateless mais cross-check avec pro_response_tokens
 * pour audit (qui a clique quand, depuis quelle IP).
 */

export interface TokenPayload {
  avis_id: string;
  pro_id: string;
  exp: number;
  type: "preavis" | "reponse";
  nonce: string;
}

function b64urlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - str.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

export async function signToken(payload: TokenPayload, secret: string): Promise<string> {
  const json = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(new TextEncoder().encode(json));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = await hmac(secret, payloadB64);
  const expectedSigB64 = b64urlEncode(expectedSig);
  if (expectedSigB64 !== sigB64) return null;

  try {
    const json = new TextDecoder().decode(b64urlDecode(payloadB64));
    const payload = JSON.parse(json) as TokenPayload;

    // Validate all required fields (defense-in-depth)
    if (
      !payload.avis_id ||
      !payload.pro_id ||
      !payload.type ||
      !payload.nonce ||
      !["preavis", "reponse"].includes(payload.type)
    ) {
      return null;
    }

    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
