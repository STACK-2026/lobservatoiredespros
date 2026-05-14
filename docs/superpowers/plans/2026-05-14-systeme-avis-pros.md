# Système d'avis pros + droit de réponse , Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un système d'avis vérifiés avec droit de réponse artisan sur `lobservatoiredespros.com`, prêt pour intégrer le témoignage Teyssard sur Caro Renov dès le pilote.

**Architecture:** Astro 6 + Cloudflare Pages Functions + Supabase PostgreSQL + Resend (transactional email) + Cloudflare Turnstile (anti-bot). Stateless HMAC token signing pour magic links artisan, RLS Supabase pour secure inserts anonymes, triggers PL/pgSQL pour mise à jour agrégats.

**Tech Stack:** TypeScript, Astro SSR + SSG, Supabase Management API (PAT-authenticated SQL), Resend HTML emails, GitHub Actions cron.

**Spec:** `docs/superpowers/specs/2026-05-13-systeme-avis-pros-design.md` (commit `e3d8831`).

**Effort estimé:** 23h ≈ 3 jours. 17 tâches en 6 phases. Commits fréquents (1 par tâche ou paire).

---

## Pré-requis (à vérifier AVANT de commencer)

- [ ] `SUPABASE_PAT` est dans `~/stack-2026/.env.master` (verifié 13/05)
- [ ] `RESEND_API_KEY` est dans `~/stack-2026/.env.master` (verifié 13/05)
- [ ] Domaine Resend `send.lobservatoiredespros.com` verified (verifié 13/05)
- [ ] Cloudflare Turnstile : créer un site key côté CF dashboard → noter `TURNSTILE_SITE_KEY` (public) et `TURNSTILE_SECRET_KEY` (secret). Ajouter en CF Pages env vars sur le projet `lobservatoiredespros`. Si action user requise, le mentionner dans le commit suivant.
- [ ] Générer un nouveau secret HMAC pour les tokens magic link : `openssl rand -base64 48`. Ajouter en CF Pages env secret comme `AVIS_TOKEN_SECRET`. À garder hors git.
- [ ] Générer un secret admin pour les boutons modération dans emails : `openssl rand -base64 32`. Ajouter en CF Pages env secret comme `ADMIN_MODERATION_TOKEN`.

---

## Phase 1 , Foundation (DB + utils)

### Task 1: Migration SQL `20260514_013_pro_avis_system.sql`

**Files:**
- Create: `supabase/migrations/20260514_013_pro_avis_system.sql`

- [ ] **Step 1.1: Créer le fichier migration**

Contenu complet (idempotent, transactionnel, RLS inclus) :

```sql
-- ============================================================================
-- Migration 013 (2026-05-14) : Système d'avis pros + droit de réponse
-- ============================================================================
-- Spec : docs/superpowers/specs/2026-05-13-systeme-avis-pros-design.md
-- 4 tables nouvelles + 1 trigger update_pro_avis_aggregate + 3 policies RLS.
-- Tout dans une transaction BEGIN/COMMIT pour rollback total si erreur.

BEGIN;

-- 1. Avis principal
CREATE TABLE IF NOT EXISTS public.pro_avis (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  pro_id uuid NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'avis' CHECK (type IN ('avis','litige')),

  pseudo text NOT NULL CHECK (length(pseudo) BETWEEN 2 AND 30),
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text UNIQUE,
  email_verification_expires_at timestamptz,

  verdict text NOT NULL CHECK (verdict IN ('oui','non','mitige')),
  texte text NOT NULL CHECK (length(texte) BETWEEN 100 AND 5000),

  status text NOT NULL DEFAULT 'en_attente_verif_email'
    CHECK (status IN (
      'en_attente_verif_email',
      'en_attente_preavis_artisan',
      'en_attente_moderation',
      'publie',
      'rejete',
      'supprime'
    )),
  moderation_reason text,
  moderated_at timestamptz,
  moderated_by text,
  preavis_envoye_at timestamptz,
  published_at timestamptz,

  ip_hash text,
  user_agent text,
  rgpd_consent boolean NOT NULL DEFAULT false,
  anonymized_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_avis_pro_status_idx
  ON public.pro_avis(pro_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS pro_avis_token_idx
  ON public.pro_avis(email_verification_token);
CREATE INDEX IF NOT EXISTS pro_avis_pending_idx
  ON public.pro_avis(status)
  WHERE status IN ('en_attente_preavis_artisan','en_attente_moderation');
CREATE INDEX IF NOT EXISTS pro_avis_anonymize_idx
  ON public.pro_avis(published_at)
  WHERE anonymized_at IS NULL AND status = 'publie';

-- 2. Réponses de l'artisan
CREATE TABLE IF NOT EXISTS public.pro_avis_responses (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  avis_id uuid NOT NULL UNIQUE REFERENCES public.pro_avis(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES public.pros(id),
  texte text NOT NULL CHECK (length(texte) BETWEEN 50 AND 2000),
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'publie' CHECK (status IN ('publie','supprime')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_avis_responses_pro_idx
  ON public.pro_avis_responses(pro_id);

-- 3. Audit trail des éditions de réponses
CREATE TABLE IF NOT EXISTS public.pro_avis_response_history (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.pro_avis_responses(id) ON DELETE CASCADE,
  texte_old text,
  texte_new text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by_ip_hash text
);

CREATE INDEX IF NOT EXISTS pro_avis_response_history_response_idx
  ON public.pro_avis_response_history(response_id, changed_at DESC);

-- 4. Magic link tokens (audit + revocation)
CREATE TABLE IF NOT EXISTS public.pro_response_tokens (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  avis_id uuid NOT NULL REFERENCES public.pro_avis(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES public.pros(id),
  token_hash text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('preavis','reponse')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_from_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_response_tokens_hash_idx
  ON public.pro_response_tokens(token_hash);
CREATE INDEX IF NOT EXISTS pro_response_tokens_avis_idx
  ON public.pro_response_tokens(avis_id);

-- 5. Trigger update pros.avis_moyen + avis_nombre
CREATE OR REPLACE FUNCTION update_pro_avis_aggregate()
RETURNS trigger AS $$
DECLARE
  v_pro_id uuid;
  v_count integer;
  v_score decimal;
BEGIN
  v_pro_id := COALESCE(NEW.pro_id, OLD.pro_id);

  SELECT
    COUNT(*),
    AVG(CASE verdict WHEN 'oui' THEN 5 WHEN 'mitige' THEN 3 WHEN 'non' THEN 1 END)
  INTO v_count, v_score
  FROM public.pro_avis
  WHERE pro_id = v_pro_id AND status = 'publie';

  UPDATE public.pros
  SET avis_nombre = v_count,
      avis_moyen = v_score,
      updated_at = now()
  WHERE id = v_pro_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pro_avis_aggregate_trigger ON public.pro_avis;
CREATE TRIGGER pro_avis_aggregate_trigger
AFTER INSERT OR UPDATE OF status OR DELETE ON public.pro_avis
FOR EACH ROW EXECUTE FUNCTION update_pro_avis_aggregate();

-- 6. RLS Policies
ALTER TABLE public.pro_avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_avis_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous insert avis with consent" ON public.pro_avis;
CREATE POLICY "Anonymous insert avis with consent"
ON public.pro_avis FOR INSERT TO anon
WITH CHECK (rgpd_consent = true AND status = 'en_attente_verif_email');

DROP POLICY IF EXISTS "Public read published avis" ON public.pro_avis;
CREATE POLICY "Public read published avis"
ON public.pro_avis FOR SELECT TO anon
USING (status = 'publie');

DROP POLICY IF EXISTS "Public read responses of published avis" ON public.pro_avis_responses;
CREATE POLICY "Public read responses of published avis"
ON public.pro_avis_responses FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.pro_avis WHERE id = avis_id AND status = 'publie'
  )
  AND status = 'publie'
);

COMMIT;
```

- [ ] **Step 1.2: Appliquer la migration en prod**

Run:
```bash
cd ~/stack-2026/lobservatoiredespros
source ~/stack-2026/.env.master
MIG="supabase/migrations/20260514_013_pro_avis_system.sql"
QUERY_JSON=$(python3 -c "
import json
with open('$MIG') as f: sql = f.read()
print(json.dumps({'query': sql}))
")
curl -s -X POST \
  -H \"Authorization: Bearer \$SUPABASE_PAT\" \
  -H \"Content-Type: application/json\" \
  \"https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query\" \
  -d \"\$QUERY_JSON\" | python3 -m json.tool
```

Expected output: `[]` (empty success).

- [ ] **Step 1.3: Verify les 4 tables existent**

Run:
```bash
curl -s -X POST \
  -H \"Authorization: Bearer \$SUPABASE_PAT\" \
  -H \"Content-Type: application/json\" \
  \"https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query\" \
  -d '{\"query\": \"SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name LIKE '\''pro_avis%'\'' OR table_name = '\''pro_response_tokens'\'' ORDER BY table_name;\"}' | python3 -m json.tool
```

Expected: 4 rows (`pro_avis`, `pro_avis_response_history`, `pro_avis_responses`, `pro_response_tokens`).

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/20260514_013_pro_avis_system.sql
git commit -m "feat(avis): migration SQL système avis + 4 tables + trigger + RLS

Migration 013 idempotente, transactionnelle, appliquée en prod via
Supabase Mgmt API avant ce commit (DB et migration sync).

4 nouvelles tables : pro_avis, pro_avis_responses,
pro_avis_response_history, pro_response_tokens.
1 trigger update_pro_avis_aggregate qui maintient pros.avis_nombre
et pros.avis_moyen à chaque INSERT/UPDATE/DELETE publié.
3 policies RLS : INSERT anon avec consent, SELECT publie public,
SELECT responses sur avis publié.

Spec : docs/superpowers/specs/2026-05-13-systeme-avis-pros-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: HMAC Token Helper

**Files:**
- Create: `site/functions/_lib/token.ts`
- Test: `site/scripts/test-token.mjs` (smoke test à exécuter via node)

- [ ] **Step 2.1: Implémenter le helper**

Contenu `site/functions/_lib/token.ts` :

```typescript
/**
 * HMAC-SHA256 tokens stateless pour magic link artisan.
 * Format token : base64url(payload).base64url(signature)
 *   payload = {avis_id, pro_id, exp, type, nonce}
 *   signature = HMAC-SHA256(payload_b64url, env.AVIS_TOKEN_SECRET)
 *
 * Vérification stateless mais cross-check avec pro_response_tokens
 * pour audit (qui a cliqué quand, depuis quelle IP).
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
  if (expectedSigB64 !== sigB64) return null; // mauvaise signature

  try {
    const json = new TextDecoder().decode(b64urlDecode(payloadB64));
    const payload = JSON.parse(json) as TokenPayload;
    if (payload.exp && payload.exp < Date.now() / 1000) return null; // expiré
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
```

- [ ] **Step 2.2: Smoke test local**

Create `site/scripts/test-token.mjs` :

```javascript
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
```

Run:
```bash
cd site && node --experimental-strip-types scripts/test-token.mjs
```

Expected output: token printed, verified non-null, tampered=null, expired=null, hash=64hex.

- [ ] **Step 2.3: Commit**

```bash
git add site/functions/_lib/token.ts site/scripts/test-token.mjs
git commit -m "feat(avis): HMAC-SHA256 token helper stateless pour magic links

base64url(payload).base64url(signature) format. Verify stateless
sans hit DB. Cross-check avec pro_response_tokens en consommation
pour audit IP. Smoke test pass : sign, verify, tamper-detect,
expire-detect, hash."
```

---

### Task 3: Filtre auto + Turnstile verify

**Files:**
- Create: `site/functions/_lib/filter.ts`
- Create: `site/functions/_lib/turnstile.ts`
- Test: `site/scripts/test-filter.mjs`

- [ ] **Step 3.1: Implémenter le filtre**

Contenu `site/functions/_lib/filter.ts` :

```typescript
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
  mots_flags_csv: string; // env.AVIS_MOTS_FLAGS_CSV ou defaut
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
 * Retourne similarité [0,1]. 1 = identique.
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
```

- [ ] **Step 3.2: Implémenter Turnstile verify**

Contenu `site/functions/_lib/turnstile.ts` :

```typescript
/**
 * Cloudflare Turnstile server-side verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export interface TurnstileVerifyResult {
  success: boolean;
  errors?: string[];
}

export async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<TurnstileVerifyResult> {
  if (!token) return { success: false, errors: ["missing_token"] };

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const data = await res.json() as { success: boolean; "error-codes"?: string[] };
    return { success: data.success === true, errors: data["error-codes"] };
  } catch (e) {
    return { success: false, errors: ["fetch_failed"] };
  }
}
```

- [ ] **Step 3.3: Smoke test filter**

Create `site/scripts/test-filter.mjs` :

```javascript
import { runFilter, similarity } from "../functions/_lib/filter.ts";

const baseInput = {
  pseudo: "TestUser",
  email: "test@example.com",
  texte: "x".repeat(150),
  verdict: "oui",
  honeypot: "",
  mots_flags_csv: "",
};

// Pass
console.log("Pass:", runFilter(baseInput).action === "pass" ? "OK" : "FAIL");

// Honeypot silent_accept
console.log("Honeypot:", runFilter({ ...baseInput, honeypot: "spam" }).action === "silent_accept" ? "OK" : "FAIL");

// Too short
console.log("Too short:", runFilter({ ...baseInput, texte: "court" }).action === "reject" ? "OK" : "FAIL");

// URL
console.log("URL:", runFilter({ ...baseInput, texte: "x".repeat(150) + " http://evil.com" }).moderation_reason === "url_detected" ? "OK" : "FAIL");

// Mot flag
console.log("Mot flag:", runFilter({ ...baseInput, texte: "x".repeat(150) + " escroc" }).moderation_reason === "mots_flags" ? "OK" : "FAIL");

// Preavis
console.log("Preavis (verdict=non + long):", runFilter({ ...baseInput, verdict: "non", texte: "x".repeat(600) }).action === "flag_preavis" ? "OK" : "FAIL");

// Similarity
console.log("Similarity self:", similarity("abc", "abc") === 1 ? "OK" : "FAIL");
console.log("Similarity diff:", similarity("abc", "xyz") < 0.5 ? "OK" : "FAIL");
console.log("Similarity 80%:", similarity("abcdefghij", "abcdefghxy") > 0.7 ? "OK" : "FAIL");
```

Run:
```bash
cd site && node --experimental-strip-types scripts/test-filter.mjs
```

Expected output: all "OK".

- [ ] **Step 3.4: Commit**

```bash
git add site/functions/_lib/filter.ts site/functions/_lib/turnstile.ts site/scripts/test-filter.mjs
git commit -m "feat(avis): filtre auto (mots-flags, URLs, longueur, doublon) + Turnstile verify

Filtre auto retourne 5 actions distinctes : reject (HTTP 4xx),
silent_accept (honeypot, 303 sans INSERT), flag_moderation (admin review),
flag_preavis (artisan préavis 48h), pass (publie après vérif email).
Levenshtein similarité pour anti-doublon. Turnstile verify côté server."
```

---

## Phase 2 , API endpoints

### Task 4: `/api/avis/submit`

**Files:**
- Create: `site/functions/api/avis/submit.ts`

- [ ] **Step 4.1: Implémenter le handler**

Contenu (résumé clé, structurer comme `site/functions/api/contact.ts:1-190` qui sert de référence) :

```typescript
import { runFilter, similarity } from "../../_lib/filter";
import { verifyTurnstile } from "../../_lib/turnstile";

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  AVIS_MOTS_FLAGS_CSV?: string;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const formData = await context.request.formData();
  const get = (k: string) => (formData.get(k) || "").toString().trim();

  const fields = {
    pro_slug: get("pro_slug"),
    pseudo: get("pseudo").slice(0, 30),
    email: get("email").toLowerCase().slice(0, 254),
    verdict: get("verdict") as "oui" | "non" | "mitige",
    texte: get("texte").slice(0, 5500),
    honeypot: get("company"),
    turnstile: get("cf-turnstile-response"),
    rgpd: get("rgpd"),
  };

  // 1. Validation basique
  if (!["oui", "non", "mitige"].includes(fields.verdict)) {
    return new Response(JSON.stringify({ ok: false, error: "verdict_invalide" }), { status: 400 });
  }
  if (fields.rgpd !== "on") {
    return new Response(JSON.stringify({ ok: false, error: "rgpd_requis" }), { status: 400 });
  }
  if (fields.pseudo.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) {
    return new Response(JSON.stringify({ ok: false, error: "champs_invalides" }), { status: 400 });
  }

  // 2. Turnstile (sauf cas honeypot rempli, le filtre s'en charge)
  if (!fields.honeypot) {
    const ts = await verifyTurnstile(fields.turnstile, context.env.TURNSTILE_SECRET_KEY, context.request.headers.get("cf-connecting-ip") || "");
    if (!ts.success) {
      return new Response(JSON.stringify({ ok: false, error: "turnstile_failed" }), { status: 403 });
    }
  }

  // 3. Filtre auto
  const filterResult = runFilter({
    pseudo: fields.pseudo,
    email: fields.email,
    texte: fields.texte,
    verdict: fields.verdict,
    honeypot: fields.honeypot,
    mots_flags_csv: context.env.AVIS_MOTS_FLAGS_CSV || "",
  });

  if (filterResult.action === "reject") {
    return new Response(JSON.stringify({ ok: false, error: filterResult.reason }), { status: 400 });
  }
  if (filterResult.action === "silent_accept") {
    return new Response(null, { status: 303, headers: { Location: "/contact/merci/" } });
  }

  // 4. Récupérer pro_id depuis slug + check cooldown 30j même email
  const proRes = await fetch(`${context.env.SUPABASE_URL}/rest/v1/pros?slug=eq.${encodeURIComponent(fields.pro_slug)}&select=id,email&active=eq.true`, {
    headers: { apikey: context.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}` },
  });
  const pros = await proRes.json() as Array<{ id: string; email: string | null }>;
  if (pros.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "pro_not_found" }), { status: 404 });
  }
  const pro = pros[0];

  // Check cooldown 30j (même pro, même email)
  const cooldownRes = await fetch(
    `${context.env.SUPABASE_URL}/rest/v1/pro_avis?pro_id=eq.${pro.id}&email=eq.${encodeURIComponent(fields.email)}&created_at=gte.${new Date(Date.now() - 30 * 86400 * 1000).toISOString()}&select=id`,
    { headers: { apikey: context.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}` } }
  );
  const cooldown = await cooldownRes.json() as Array<{ id: string }>;
  if (cooldown.length > 0) {
    return new Response(JSON.stringify({ ok: false, error: "cooldown_30j" }), { status: 429 });
  }

  // 5. Genérer email_verification_token
  const verificationToken = crypto.randomUUID();
  const verificationExpiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  // 6. Stocker moderation_reason selon filterResult
  let moderation_reason: string | null = null;
  if (filterResult.action === "flag_moderation") moderation_reason = filterResult.moderation_reason || null;
  if (filterResult.action === "flag_preavis") moderation_reason = "verdict_non_long";

  // 7. INSERT pro_avis
  const ip = context.request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ipHash = await sha256Hex(`${ip}|lobservatoire-avis`);

  const insertBody = {
    pro_id: pro.id,
    pseudo: fields.pseudo,
    email: fields.email,
    email_verification_token: verificationToken,
    email_verification_expires_at: verificationExpiresAt,
    verdict: fields.verdict,
    texte: fields.texte,
    status: "en_attente_verif_email",
    moderation_reason,
    ip_hash: ipHash,
    user_agent: context.request.headers.get("user-agent")?.slice(0, 300) || "",
    rgpd_consent: true,
  };
  const insertRes = await fetch(`${context.env.SUPABASE_URL}/rest/v1/pro_avis`, {
    method: "POST",
    headers: {
      apikey: context.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(insertBody),
  });
  if (!insertRes.ok) {
    console.error("avis insert failed:", insertRes.status);
    return new Response(JSON.stringify({ ok: false, error: "db_insert_failed" }), { status: 502 });
  }

  // 8. Resend email confirmation visiteur (template avis_visitor_confirm)
  const verifyUrl = `https://lobservatoiredespros.com/api/avis/verifier/${verificationToken}`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${context.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "L'Observatoire des Pros <noreply@send.lobservatoiredespros.com>",
        to: fields.email,
        reply_to: "contact@lobservatoiredespros.com",
        subject: "Confirmez votre avis sur L'Observatoire des Pros",
        html: `<p>Bonjour ${fields.pseudo},</p><p>Merci pour votre avis. Pour le publier, confirmez votre adresse email en cliquant sur le lien ci-dessous (valable 48h) :</p><p><a href="${verifyUrl}">Confirmer mon avis</a></p><p>Si vous n'avez pas soumis cet avis, ignorez ce message.</p><p>La rédaction de L'Observatoire des Pros</p>`,
      }),
    });
  } catch (e) {
    console.error("Resend confirm email failed:", e);
    // Le INSERT est déjà fait, on continue. L'avis restera en pending_verif_email.
  }

  return new Response(null, { status: 303, headers: { Location: `/pro/${fields.pro_slug}/avis-soumis/` } });
};
```

- [ ] **Step 4.2: Commit**

```bash
git add site/functions/api/avis/submit.ts
git commit -m "feat(avis): endpoint /api/avis/submit avec Turnstile + filtre + cooldown 30j"
```

---

### Task 5: `/api/avis/verifier/:token`

**Files:**
- Create: `site/functions/api/avis/verifier/[token].ts`

- [ ] **Step 5.1: Implémenter (transitions de status)**

Contenu :

```typescript
import { signToken, hashToken } from "../../../_lib/token";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  RESEND_API_KEY: string;
  AVIS_TOKEN_SECRET: string;
}

export const onRequestGet: PagesFunction<Env, "token"> = async (context) => {
  const { token } = context.params;
  if (!token) return Response.redirect("/avis/verifier/invalide", 302);

  // 1. Récupérer l'avis par email_verification_token
  const avisRes = await fetch(
    `${context.env.SUPABASE_URL}/rest/v1/pro_avis?email_verification_token=eq.${token}&select=id,pro_id,pseudo,email,verdict,texte,status,moderation_reason,email_verification_expires_at,pros(slug,nom_entreprise,email)`,
    { headers: { apikey: context.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}` } }
  );
  const avisRows = await avisRes.json() as Array<{
    id: string; pro_id: string; pseudo: string; email: string; verdict: string;
    texte: string; status: string; moderation_reason: string | null;
    email_verification_expires_at: string;
    pros: { slug: string; nom_entreprise: string; email: string | null };
  }>;
  if (avisRows.length === 0) return Response.redirect("/avis/verifier/invalide", 302);
  const avis = avisRows[0];

  // Token expiré ?
  if (new Date(avis.email_verification_expires_at) < new Date()) {
    return Response.redirect("/avis/verifier/expire", 302);
  }
  // Déjà vérifié ?
  if (avis.status !== "en_attente_verif_email") {
    return Response.redirect(`/avis/verifier/${token}/result`, 302);
  }

  // 2. Décider du prochain status
  let nextStatus: string;
  let preavisToken: string | undefined;
  if (avis.moderation_reason && avis.moderation_reason !== "verdict_non_long") {
    // Flag-modération : passer en file admin
    nextStatus = "en_attente_moderation";
  } else if (avis.moderation_reason === "verdict_non_long" && avis.pros.email) {
    // Flag-préavis : artisan email connu -> préavis 48h
    nextStatus = "en_attente_preavis_artisan";
    // Générer magic link préavis
    preavisToken = await signToken(
      { avis_id: avis.id, pro_id: avis.pro_id, exp: Math.floor(Date.now() / 1000) + 90 * 86400, type: "preavis", nonce: crypto.randomUUID() },
      context.env.AVIS_TOKEN_SECRET
    );
    // Audit DB
    await fetch(`${context.env.SUPABASE_URL}/rest/v1/pro_response_tokens`, {
      method: "POST",
      headers: { apikey: context.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        avis_id: avis.id, pro_id: avis.pro_id,
        token_hash: await hashToken(preavisToken), type: "preavis",
        expires_at: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
      }),
    });
  } else {
    // Bénin OU verdict_non_long sans email artisan : publication immédiate
    nextStatus = "publie";
  }

  // 3. UPDATE pro_avis
  const updateBody: Record<string, string> = {
    email_verified: "true",
    status: nextStatus,
  };
  if (nextStatus === "publie") updateBody.published_at = new Date().toISOString();
  if (nextStatus === "en_attente_preavis_artisan") updateBody.preavis_envoye_at = new Date().toISOString();

  await fetch(`${context.env.SUPABASE_URL}/rest/v1/pro_avis?id=eq.${avis.id}`, {
    method: "PATCH",
    headers: { apikey: context.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(updateBody),
  });

  // 4. Envoyer les emails correspondants via Resend selon outcome :
  //    - status='publie' -> visiteur "votre avis est en ligne" + artisan si email connu "nouvel avis sur votre fiche"
  //    - status='en_attente_preavis_artisan' -> artisan "préavis 48h, voici le lien magique /r/<preavisToken>/"
  //    - status='en_attente_moderation' -> admin "avis à modérer, lien /api/admin/avis/moderer?id=<id>&admin_token=<env>"
  // Pattern : fetch POST https://api.resend.com/emails avec from "noreply@send.lobservatoiredespros.com",
  // reply_to "contact@lobservatoiredespros.com", subject + html (sans em-dash).
  // Inline les 3 templates dans cette fonction (cohérent avec submit.ts qui inline son template confirm).

  return Response.redirect(`/avis/verifier/${token}/result`, 302);
};
```

- [ ] **Step 5.2: Commit**

```bash
git add site/functions/api/avis/verifier/\[token\].ts
git commit -m "feat(avis): endpoint /api/avis/verifier/:token avec transitions status

3 outcomes après vérif email : publication immédiate, préavis 48h
artisan (si email connu + verdict_non_long), ou modération admin
(si mots-flags ou URL détectés)."
```

---

### Task 6: `/api/r/:token` (GET preview pour la page magic link)

**Files:**
- Create: `site/functions/api/r/[token].ts`

- [ ] **Step 6.1: Implémenter GET (preview JSON)**

```typescript
import { verifyToken } from "../../_lib/token";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  AVIS_TOKEN_SECRET: string;
}

export const onRequestGet: PagesFunction<Env, "token"> = async (context) => {
  const payload = await verifyToken(context.params.token, context.env.AVIS_TOKEN_SECRET);
  if (!payload) return new Response(JSON.stringify({ ok: false, error: "token_invalid_or_expired" }), { status: 403 });

  // Fetch avis + pros + response existante
  const avisRes = await fetch(
    `${context.env.SUPABASE_URL}/rest/v1/pro_avis?id=eq.${payload.avis_id}&select=id,pseudo,verdict,texte,status,created_at,pros(slug,nom_entreprise,ville),pro_avis_responses(texte,version,created_at)`,
    { headers: { apikey: context.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}` } }
  );
  const rows = await avisRes.json() as Array<any>;
  if (rows.length === 0) return new Response(JSON.stringify({ ok: false, error: "avis_not_found" }), { status: 404 });

  return new Response(JSON.stringify({
    ok: true,
    avis: rows[0],
    expires_at: new Date(payload.exp * 1000).toISOString(),
  }), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 6.2: Commit**

```bash
git add site/functions/api/r/\[token\].ts
git commit -m "feat(avis): endpoint GET /api/r/:token preview pour magic link artisan"
```

---

### Task 7: Endpoints `/api/r/:token/repondre + signaler + demander-suppression + renouveler`

**Files:**
- Create: `site/functions/api/r/[token]/repondre.ts`
- Create: `site/functions/api/r/[token]/signaler.ts`
- Create: `site/functions/api/r/[token]/demander-suppression.ts`
- Create: `site/functions/api/r/[token]/renouveler.ts`

- [ ] **Step 7.1: `repondre.ts`** (POST réponse artisan, INSERT pro_avis_responses + audit history si édition)

Voir pattern dans submit.ts + token verify. INSERT ou UPDATE selon existence de la réponse précédente. Si update : enregistrer dans pro_avis_response_history.

- [ ] **Step 7.2: `signaler.ts`** (POST flag pour modération admin)

Met `pro_avis.status = 'en_attente_moderation'`, ajoute `moderation_reason = 'signale_par_artisan'`, envoie email admin via Resend.

- [ ] **Step 7.3: `demander-suppression.ts`** (POST demande de suppression formelle)

Idem signaler mais avec moderation_reason = 'suppression_demandee_par_artisan'.

- [ ] **Step 7.4: `renouveler.ts`** (POST génère un nouveau token quand l'ancien a expiré)

Vérifie l'ancien token même expiré (juste signature), génère nouveau, INSERT pro_response_tokens, envoie email artisan avec nouveau lien.

- [ ] **Step 7.5: Commit groupé**

```bash
git add site/functions/api/r/\[token\]/
git commit -m "feat(avis): 4 endpoints magic link artisan repondre/signaler/suppression/renouveler"
```

---

### Task 8: `/api/admin/avis/moderer`

**Files:**
- Create: `site/functions/api/admin/avis/moderer.ts`

- [ ] **Step 8.1: Implémenter** (GET avec query params `id`, `action`, `admin_token`)

```typescript
interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ADMIN_MODERATION_TOKEN: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  const admin_token = url.searchParams.get("admin_token");

  if (admin_token !== context.env.ADMIN_MODERATION_TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!id || !["publier", "rejeter"].includes(action || "")) {
    return new Response("Bad request", { status: 400 });
  }

  const updateBody = action === "publier"
    ? { status: "publie", published_at: new Date().toISOString(), moderated_by: "admin", moderated_at: new Date().toISOString() }
    : { status: "rejete", moderated_by: "admin", moderated_at: new Date().toISOString() };

  const res = await fetch(`${context.env.SUPABASE_URL}/rest/v1/pro_avis?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: context.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${context.env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(updateBody),
  });
  if (!res.ok) return new Response("DB update failed", { status: 502 });

  return new Response(`<html><body><h1>Avis ${action === "publier" ? "publié" : "rejeté"}</h1><p>L'action a été enregistrée. Vous pouvez fermer cette page.</p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
```

- [ ] **Step 8.2: Commit**

```bash
git add site/functions/api/admin/avis/moderer.ts
git commit -m "feat(avis): endpoint admin /api/admin/avis/moderer avec token-auth"
```

---

## Phase 3 , Resend templates

### Task 9: 7 templates HTML email

**Files:**
- Modify: `site/functions/api/avis/submit.ts` (inline template avis_visitor_confirm , déjà fait)
- Modify: `site/functions/api/avis/verifier/[token].ts` (inline templates pour les 3 outcomes)
- Modify: `site/functions/api/r/[token]/*.ts` (inline templates pour artisan)

- [ ] **Step 9.1: Audit em-dashes obligatoire**

```bash
grep -rEn $'\xe2\x80\x93|\xe2\x80\x94' site/functions/api/ | head -5
```

Expected : aucun résultat (règle stricte projet).

- [ ] **Step 9.2: Vérifier le rendu local**

Pour chaque template : `curl --data-urlencode` un submit factice via Wrangler local et vérifier que Resend log les envois dans le dashboard. Si pas de visibilité dashboard, faire un `console.log(html)` temporaire et inspecter.

- [ ] **Step 9.3: Commit (si modifs séparées)**

---

## Phase 4 , Astro UI

### Task 10: `/pro/[slug]/donner-mon-avis/index.astro`

**Files:**
- Create: `site/src/pages/pro/[slug]/donner-mon-avis/index.astro`

- [ ] **Step 10.1: Page complète**

SSR via la même pattern que `/pro/[slug]/index.astro`. Récupère le pro par slug (Supabase fetch dans le frontmatter), affiche :

1. Récap fiche (nom, ville, métier)
2. Charte éditoriale (200 mots, points : pas d'insultes, RGPD, droit de réponse artisan 48h si critique forte, email vérifié obligatoire)
3. Formulaire POST `/api/avis/submit` avec :
   - `<input name="pro_slug" value={slug} type="hidden">`
   - `<input name="pseudo">` (2-30 chars)
   - `<input type="email" name="email">`
   - 3 radio `verdict` : oui / mitige / non
   - `<textarea name="texte">` avec compteur live JS
   - `<input name="company" style="position:absolute;left:-9999px">` honeypot
   - Turnstile widget : `<div class="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY}></div>` + `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async></script>`
   - `<input type="checkbox" name="rgpd" required>` + label conforme
   - `<button type="submit">`

- [ ] **Step 10.2: Test locally**

`wrangler pages dev` puis visite `/pro/caro-renov-colombes/donner-mon-avis/`.

- [ ] **Step 10.3: Commit**

```bash
git add site/src/pages/pro/\[slug\]/donner-mon-avis/index.astro
git commit -m "feat(avis): page formulaire /pro/[slug]/donner-mon-avis/"
```

---

### Task 11: `/avis/verifier/[token]/index.astro`

**Files:**
- Create: `site/src/pages/avis/verifier/[token]/index.astro`

- [ ] **Step 11.1: Page result post-clic email**

SSR : fetch l'état de l'avis par token, affiche message selon status :
- `publie` : "Votre avis a été publié sur la fiche [nom_entreprise]. Lien direct : [URL]"
- `en_attente_preavis_artisan` : "Votre avis a été vérifié. L'artisan a 48h pour répondre avant publication."
- `en_attente_moderation` : "Votre avis a été vérifié et envoyé à notre rédaction pour validation finale."
- 404 / token invalid : "Le lien a expiré ou n'est pas valide."

- [ ] **Step 11.2: Commit**

```bash
git add site/src/pages/avis/verifier/\[token\]/index.astro
git commit -m "feat(avis): page /avis/verifier/:token/ confirmation visiteur"
```

---

### Task 12: `/r/[token]/index.astro`

**Files:**
- Create: `site/src/pages/r/[token]/index.astro`

- [ ] **Step 12.1: Page magic link artisan**

SSR : fetch `/api/r/:token` server-side, render :
- Preview de l'avis (pseudo, date, badge verdict, texte)
- Si réponse existante : afficher avec bouton "Éditer ma réponse" (textarea pré-remplie)
- Sinon : textarea vide (50-2000 chars, compteur live)
- 3 boutons :
  - `<form action="/api/r/{token}/repondre" method="POST">`
  - `<form action="/api/r/{token}/signaler" method="POST">`
  - `<form action="/api/r/{token}/demander-suppression" method="POST">`
- Si token expiré dans la réponse : afficher bouton "Régénérer le lien" → POST `/api/r/{token}/renouveler`

- [ ] **Step 12.2: Commit**

```bash
git add site/src/pages/r/\[token\]/index.astro
git commit -m "feat(avis): page magic link artisan /r/:token/"
```

---

### Task 13: Component `<AvisList>`

**Files:**
- Create: `site/src/components/AvisList.astro`
- Modify: `site/src/pages/pro/[slug].astro` (intégrer)
- Modify: `site/functions/pro/[[slug]].ts` (intégrer en SSR HTML)

- [ ] **Step 13.1: Component standalone**

Props : `avisNombre`, `avisMoyen`, `avis` (array). Rendu :
- Stats horizontal en haut : `[stats avis_nombre publiés. X% recommandent. Y oui / Z mitigé / W non]` avec barre visuelle CSS
- Filtres bouton : Tous / Oui / Mitigé / Non (JS vanilla pour filter)
- Liste paginée 5 par 5, chaque avis :
  - Header : pseudo, date, badge verdict
  - Corps : texte (`white-space: pre-wrap`)
  - Footer : si réponse → `<details>` "Réponse de [nom_entreprise]" pré-déplié
- Si `avisNombre === 0` : bloc vide "Aucun avis pour l'instant. Soyez le premier à publier votre expérience."

- [ ] **Step 13.2: Intégrer dans `/pro/[slug].astro`**

Dans la query Supabase `getStaticPaths`, ajouter la jointure :
```ts
.select("..., pro_avis!inner(id, pseudo, verdict, texte, published_at, pro_avis_responses(texte, created_at))")
.eq("pro_avis.status", "publie")
.order("pro_avis.published_at", { ascending: false })
```

Placer le `<AvisList>` après le bloc Score de Confiance, avant Contact.

- [ ] **Step 13.3: Intégrer dans `functions/pro/[[slug]].ts`**

Idem en SSR : extra fetch pro_avis pour le slug, render HTML inline équivalent (sans JS filtres, juste la liste statique). Plus simple en SSR fallback.

- [ ] **Step 13.4: Commit**

```bash
git add site/src/components/AvisList.astro site/src/pages/pro/\[slug\].astro site/functions/pro/\[\[slug\]\].ts
git commit -m "feat(avis): composant <AvisList> + intégration fiche pro SSG+SSR"
```

---

## Phase 5 , SEO + crons

### Task 14: Schema.org Review + AggregateRating

**Files:**
- Modify: `site/src/utils/seo.ts` (ajouter helpers `jsonLdReview` et `jsonLdAggregateRating`)
- Modify: `site/src/pages/pro/[slug].astro` (émettre)
- Modify: `site/functions/pro/[[slug]].ts` (émettre)

- [ ] **Step 14.1: Helpers seo.ts**

```typescript
export function jsonLdReview(avis: { pseudo: string; verdict: string; texte: string; published_at: string }) {
  const ratingValue = avis.verdict === "oui" ? 5 : avis.verdict === "mitige" ? 3 : 1;
  return {
    "@type": "Review",
    author: { "@type": "Person", name: avis.pseudo },
    datePublished: avis.published_at.slice(0, 10),
    reviewBody: avis.texte,
    reviewRating: { "@type": "Rating", ratingValue, bestRating: 5, worstRating: 1 },
  };
}

export function jsonLdAggregateRating(avis_nombre: number, avis_moyen: number) {
  if (avis_nombre < 3) return null;
  return {
    "@type": "AggregateRating",
    ratingValue: avis_moyen.toFixed(1),
    bestRating: 5,
    worstRating: 1,
    reviewCount: avis_nombre,
  };
}
```

- [ ] **Step 14.2: Intégrer dans JSON-LD LocalBusiness sur fiche pro**

- [ ] **Step 14.3: Valider via Google Rich Results Test**

Coller `https://lobservatoiredespros.com/pro/caro-renov-colombes/` (après pilote) dans https://search.google.com/test/rich-results , vérifier que Review et AggregateRating sont détectés.

- [ ] **Step 14.4: Commit**

```bash
git add site/src/utils/seo.ts site/src/pages/pro/\[slug\].astro site/functions/pro/\[\[slug\]\].ts
git commit -m "feat(avis): schema.org Review + AggregateRating (seuil 3 avis)"
```

---

### Task 15: GitHub Actions cron

**Files:**
- Create: `.github/workflows/auto-publish-preavis-expires.yml`
- Create: `.github/workflows/rgpd-anonymize-old-avis.yml`

- [ ] **Step 15.1: `auto-publish-preavis-expires.yml`**

```yaml
name: Auto-publish préavis expirés
on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch: {}
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Auto-publish expired preavis
        env:
          SUPABASE_PAT: ${{ secrets.SUPABASE_PAT }}
        run: |
          curl -s -X POST \
            -H "Authorization: Bearer $SUPABASE_PAT" \
            -H "Content-Type: application/json" \
            "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query" \
            -d '{"query": "UPDATE public.pro_avis SET status = '\''publie'\'', published_at = now() WHERE status = '\''en_attente_preavis_artisan'\'' AND preavis_envoye_at < (now() - interval '\''48 hours'\'') RETURNING id, pro_id;"}'
```

- [ ] **Step 15.2: `rgpd-anonymize-old-avis.yml`**

```yaml
name: RGPD anonymisation avis > 3 ans
on:
  schedule:
    - cron: "0 4 1 * *"
  workflow_dispatch: {}
jobs:
  anonymize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Anonymize old avis
        env:
          SUPABASE_PAT: ${{ secrets.SUPABASE_PAT }}
        run: |
          curl -s -X POST \
            -H "Authorization: Bearer $SUPABASE_PAT" \
            -H "Content-Type: application/json" \
            "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query" \
            -d '{"query": "UPDATE public.pro_avis SET email = NULL, ip_hash = NULL, user_agent = NULL, anonymized_at = now() WHERE published_at < (now() - interval '\''3 years'\'') AND anonymized_at IS NULL RETURNING id;"}'
```

- [ ] **Step 15.3: Pré-requis : ajouter `SUPABASE_PAT` aux GH secrets**

Si pas déjà présent : `gh secret set SUPABASE_PAT --repo STACK-2026/lobservatoiredespros --body "..."`.

- [ ] **Step 15.4: Test manuel**

```bash
gh workflow run auto-publish-preavis-expires.yml --repo STACK-2026/lobservatoiredespros
gh workflow run rgpd-anonymize-old-avis.yml --repo STACK-2026/lobservatoiredespros
```

Vérifier exit 0 + DB state attendue (probablement aucune ligne à 0 row affected en l'absence d'avis matching).

- [ ] **Step 15.5: Commit**

```bash
git add .github/workflows/auto-publish-preavis-expires.yml .github/workflows/rgpd-anonymize-old-avis.yml
git commit -m "feat(avis): 2 cron GH Actions auto-publish préavis 48h + RGPD anonym 3 ans"
```

---

## Phase 6 , Rollout

### Task 16: E2E staging test

- [ ] **Step 16.1: Wrangler local dev**

```bash
cd ~/stack-2026/lobservatoiredespros/site
wrangler pages dev .  # nécessite TURNSTILE_SECRET_KEY et autres en .dev.vars
```

- [ ] **Step 16.2: Submit un avis test sur une fiche test**

Visite `http://localhost:8788/pro/romain-pascal-plaisians/donner-mon-avis/` (Pascal est un bon cas test : SSR, sans email). Remplir le form, submit.

- [ ] **Step 16.3: Vérifier DB state**

```bash
source ~/stack-2026/.env.master
curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query" \
  -d '{"query": "SELECT id, pseudo, verdict, status, moderation_reason FROM public.pro_avis ORDER BY created_at DESC LIMIT 5;"}'
```

- [ ] **Step 16.4: Vérifier Resend dashboard**

Open https://resend.com/emails et confirmer l'email de confirmation envoyé.

- [ ] **Step 16.5: Click le lien dans le mail, observer transition status**

Status doit passer de `en_attente_verif_email` à `publie` (avis bénin sans flag).

- [ ] **Step 16.6: Visiter `/pro/romain-pascal-plaisians/`**

L'avis doit apparaître dans le bloc `<AvisList>`.

- [ ] **Step 16.7: Deploy production**

```bash
git push origin main
# Watch deploy via gh run watch
```

---

### Task 17: Pilote Caro Renov + Teyssard

- [ ] **Step 17.1: Caro Renov a-t-elle un email artisan en DB ?**

```bash
curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query" \
  -d '{"query": "SELECT slug, email FROM public.pros WHERE slug = '\''caro-renov-colombes'\'';"}'
```

Si `email IS NULL` : le préavis 48h ne se déclenchera pas automatiquement. Décision : on demande au user de pré-publier manuellement le témoignage Teyssard via Mgmt API ET on attend qu'il revendique sa fiche pour activer le droit de réponse.

- [ ] **Step 17.2: Envoyer le mail d'invitation Teyssard**

Envoyer un suivi à `ncteyvan@gmail.com` (Resend, le delivery est OK pour Gmail) avec le lien direct : "Voici le lien pour publier votre témoignage sur Caro Renov : https://lobservatoiredespros.com/pro/caro-renov-colombes/donner-mon-avis/ . Lien valide indéfiniment. Pseudo libre, email vérifié."

- [ ] **Step 17.3: Surveiller la modération**

Selon le contenu du témoignage Teyssard (verdict=non + texte > 500 + nom de tier mentionné), l'avis va probablement être taggué `moderation_reason='url_detected'` ou `verdict_non_long` → modération admin manuelle. Recevoir l'email admin et décider publier/rejeter.

- [ ] **Step 17.4: Sur publication réussie**

Vérifier sur `/pro/caro-renov-colombes/` que le témoignage apparaît, qu'il a généré un schema.org Review (rich result test), et que le `pros.avis_nombre` est passé à 1.

- [ ] **Step 17.5: Updater memory**

Ajouter dans MEMORY.md une entrée "Système d'avis livré, pilote Caro Renov réussi" avec lien vers ce plan et la spec.

---

## Récap effort par phase

| Phase | Tâches | Effort indicatif |
|---|---|---|
| 1 , Foundation DB + utils | 1, 2, 3 | 3h30 |
| 2 , API endpoints | 4, 5, 6, 7, 8 | 7h |
| 3 , Templates Resend | 9 | 1h30 (inline dans 4-8) |
| 4 , Astro UI | 10, 11, 12, 13 | 6h |
| 5 , SEO + crons | 14, 15 | 2h |
| 6 , Rollout | 16, 17 | 3h |
| **Total** | **17 tâches** | **23h** |

---

## Notes opérationnelles

- **Pull before push** sur chaque commit (règle CLAUDE.md globale).
- **Audit em-dash** avant chaque push : `grep -rEn $'\xe2\x80\x93|\xe2\x80\x94' site/`.
- **Self-hosted GH Runners** parfois retardent les workflows : `gh workflow run deploy-site.yml` en manual dispatch après push critique si nécessaire.
- **SSR vs SSG** : Pascal et Caro Renov sont en SSR. La majorité des wave1 (17k slugs) sont SSG : un rebuild est nécessaire après ajout du composant `<AvisList>` pour propager. Le push automatique déclenche le rebuild.
- **Pages_content** : laisser vide pour l'instant (fallback générique côté code), pas une dette technique.
- **Phase 2 litige** : déjà prête côté schéma (champ `type ENUM('avis', 'litige')`). UI à brancher dans Phase 2 produit (post-launch).
