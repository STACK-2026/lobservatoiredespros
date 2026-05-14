import { signToken, verifyToken, hashToken } from "../functions/_lib/token.ts";

const secret = "test-secret-do-not-use-in-prod-AAAAAAAA";

const payload = {
  avis_id: "00000000-0000-0000-0000-000000000001",
  pro_id: "00000000-0000-0000-0000-000000000002",
  exp: Math.floor(Date.now() / 1000) + 60,
  type: "reponse",
  nonce: crypto.randomUUID(),
};

const token = await signToken(payload, secret);
console.log("Token:", token);

const verified = await verifyToken(token, secret);
console.log("Verified:", verified);

const tampered = token.slice(0, -3) + "abc";
const tamperedVerify = await verifyToken(tampered, secret);
console.log("Tampered (should be null):", tamperedVerify);

const expired = await signToken({ ...payload, exp: 1000 }, secret);
const expiredVerify = await verifyToken(expired, secret);
console.log("Expired (should be null):", expiredVerify);

const hash = await hashToken(token);
console.log("Hash:", hash);
