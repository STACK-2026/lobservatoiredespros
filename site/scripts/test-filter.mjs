import { runFilter, similarity } from "../functions/_lib/filter.ts";

const baseInput = {
  pseudo: "TestUser",
  email: "test@example.com",
  texte: "x".repeat(150),
  verdict: "oui",
  honeypot: "",
  mots_flags_csv: "",
};

console.log("Pass:", runFilter(baseInput).action === "pass" ? "OK" : "FAIL");
console.log("Honeypot:", runFilter({ ...baseInput, honeypot: "spam" }).action === "silent_accept" ? "OK" : "FAIL");
console.log("Too short:", runFilter({ ...baseInput, texte: "court" }).action === "reject" ? "OK" : "FAIL");
console.log("URL:", runFilter({ ...baseInput, texte: "x".repeat(150) + " http://evil.com" }).moderation_reason === "url_detected" ? "OK" : "FAIL");
console.log("Mot flag:", runFilter({ ...baseInput, texte: "x".repeat(150) + " escroc" }).moderation_reason === "mots_flags" ? "OK" : "FAIL");
console.log("Preavis (verdict=non + long):", runFilter({ ...baseInput, verdict: "non", texte: "x".repeat(600) }).action === "flag_preavis" ? "OK" : "FAIL");

console.log("Similarity self:", similarity("abc", "abc") === 1 ? "OK" : "FAIL");
console.log("Similarity diff:", similarity("abc", "xyz") < 0.5 ? "OK" : "FAIL");
console.log("Similarity 80%:", similarity("abcdefghij", "abcdefghxy") > 0.7 ? "OK" : "FAIL");
