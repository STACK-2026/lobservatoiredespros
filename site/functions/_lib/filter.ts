/**
 * Filtre auto pour les avis. Retourne :
 *   { action: 'reject', reason }    -> HTTP 4xx renvoyé au client
 *   { action: 'silent_accept' }     -> 303 redirect /merci, pas d'INSERT
 *   { action: 'flag_moderation', moderation_reason } -> INSERT avec status='en_attente_moderation' (après vérif email)
 *   { action: 'flag_preavis' }      -> INSERT avec status='en_attente_preavis_artisan' (si artisan email connu, sinon publie direct)
 *   { action: 'pass' }              -> INSERT avec status='en_attente_verif_email' puis publie après verif
 */

const MOTS_FLAGS_DEFAULT = "escroc,voleur,criminel,arnaqueur,fraudeur,escroquerie,arnaque";

export interface FilterResult {
  action: "reject" | "silent_accept" | "flag_moderation" | "flag_preavis" | "pass";
  reason?: string;
  moderation_reason?: string;
}

export interface FilterInput {
  pseudo: string;
  email: string;
  texte: string;
  verdict: "oui" | "non" | "mitige";
  honeypot: string;
  mots_flags_csv: string;
}

export function runFilter(input: FilterInput): FilterResult {
  if (input.honeypot && input.honeypot.length > 0) {
    return { action: "silent_accept" };
  }

  const len = input.texte.length;
  if (len < 100) return { action: "reject", reason: "texte_too_short" };
  if (len > 5000) return { action: "reject", reason: "texte_too_long" };

  const motsFlags = (input.mots_flags_csv || MOTS_FLAGS_DEFAULT).split(",").map((m) => m.trim().toLowerCase());
  const texteLower = input.texte.toLowerCase();
  for (const mot of motsFlags) {
    if (mot && texteLower.includes(mot)) {
      return { action: "flag_moderation", moderation_reason: "mots_flags" };
    }
  }

  if (/(https?:\/\/|www\.)/i.test(input.texte)) {
    return { action: "flag_moderation", moderation_reason: "url_detected" };
  }

  if (input.verdict === "non" && len > 500) {
    return { action: "flag_preavis" };
  }

  return { action: "pass" };
}

/**
 * Levenshtein-based similarity check (approximation, NOT pour cas extremes).
 * Retourne similarite [0,1]. 1 = identique.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const len = Math.max(a.length, b.length);

  const dp: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }

  return 1 - dp[a.length][b.length] / len;
}
