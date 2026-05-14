# Phase 6 pilot - Caro Renov Colombes (Teyssard signalement)

**Status:** ready. E2E test passes both flows (publie immediate + preavis 48h). Pilot can launch.

## Context

- **Pro:** CARO-RENOV (slug `caro-renov-colombes`, pro_id `b270cdb4-8a94-467d-820f-f1f453d659de`, 64 RUE VICTOR HUGO 92700 Colombes, SIRET 93507267800011)
- **Actual artisan:** KUCUK Salih (per memory, has not claimed profile via `/candidater/` yet)
- **Pilot client:** Teyssard, contacted via `/contact/` on 13/05/2026, reports a bad experience with carrelage work that was never published due to absence of an avis system. He is the trigger of Phase 1-5 of the avis system.

## Pre-flight checks (all green)

| Check | Status |
|---|---|
| Pro exists in DB, `active=true` | OK |
| `email` column is `null` (no artisan email) | OK |
| `avis_nombre=0` (no avis yet) | OK |
| Form page `/pro/caro-renov-colombes/donner-mon-avis/` returns 200 | OK |
| Submit endpoint `/api/avis/submit` accepts form data | OK (E2E) |
| Verifier endpoint transitions `en_attente_verif_email` -> `publie` | OK (E2E) |
| Avis displayed on `/pro/caro-renov-colombes/` once published | OK (E2E) |
| SUPABASE_SERVICE_KEY in CF Pages env | OK (deployed 2026-05-14 18:00 UTC) |
| Schema.org Review + AggregateRating emitted on pro page | OK (auto from AvisList) |
| Em-dash audit clean | OK (no dashes in form, emails, schema) |

## Expected flow for Teyssard

Because `caro-renov-colombes` has `email IS NULL`, the artisan-notification path does not fire. The branch in `functions/api/avis/verifier/[token].ts` lines 138-180:

```
if (moderation_reason && moderation_reason !== "verdict_non_long") {
  nextStatus = "en_attente_moderation";   // flagged content -> admin queue
} else if (moderation_reason === "verdict_non_long" && artisanEmail) {
  nextStatus = "en_attente_preavis_artisan";  // negative long avis + email -> 48h preavis
} else {
  nextStatus = "publie";   // <-- Teyssard path: verdict=non + long text + NO artisanEmail
}
```

So Teyssard's verdict=non + long text (>500 chars) avis publishes immediately upon email verification, with no 48h delay and no artisan notification. If KUCUK Salih later claims the profile via `/candidater/`, he can then respond publicly via the admin moderation interface (we may need to mint him a magic-link manually since the original publication did not generate one).

## Steps for the pilot

### 1. Send Teyssard the link

Reply to Teyssard on his original contact thread with this message (FR, neutral tone):

```
Bonjour M. Teyssard,

Comme convenu, nous avons mis en ligne le mecanisme d'avis pros sur
L'Observatoire des Pros. Vous pouvez maintenant soumettre votre temoignage
sur Caro-Renov via ce lien :

https://lobservatoiredespros.com/pro/caro-renov-colombes/donner-mon-avis/

Apres soumission, vous recevrez un email pour confirmer votre adresse
(verification 48h max). L'avis sera ensuite publie sur la fiche de
l'entreprise, et l'artisan pourra y repondre publiquement s'il souscrit
a notre programme.

Cordialement,
La redaction de L'Observatoire des Pros
```

### 2. Monitor the submission

Once Teyssard submits, the avis appears in `pro_avis` with `status='en_attente_verif_email'`. To check live:

```bash
PAT=$(grep '^SUPABASE_PAT=' /Users/lestoilettesdeminette/stack-2026/.env.master | cut -d= -f2-)
SVC=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys" \
  -H "Authorization: Bearer $PAT" \
  -H "User-Agent: lobserv-monitor" | \
  python3 -c "import json,sys; [print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role' and k.get('type')=='legacy']")

curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pro_avis?pro_id=eq.b270cdb4-8a94-467d-820f-f1f453d659de&select=id,pseudo,verdict,status,created_at,published_at&order=created_at.desc&limit=5" \
  -H "apikey: $SVC" -H "Authorization: Bearer $SVC" | python3 -m json.tool
```

### 3. If Teyssard's avis is flagged `en_attente_moderation`

If the filter caught something (URL, mot flag, etc.), `moderation_reason` will be set and the admin moderation queue will receive an email to `contact@lobservatoiredespros.com` with publier/rejeter buttons. Decide based on substance.

### 4. Post-publication visibility

Once `status='publie'`:
- Appears on `https://lobservatoiredespros.com/pro/caro-renov-colombes/` in the `<AvisList>` component
- Schema.org Review JSON-LD added to the page (verdict=non maps to ratingValue=1)
- Counts roll up via the `update_pro_avis_aggregate` trigger: `avis_nombre=1`, `avis_moyen=1.0`

### 5. If KUCUK Salih claims the profile

Workflow when the artisan wants to respond:
1. He fills `/candidater/` with his email + SIRET match
2. Admin (you) approves and sets `pros.email` to his email
3. Mint a response token manually:
   ```ts
   const reponseToken = await signToken({
     avis_id: '<teyssard avis id>',
     pro_id: 'b270cdb4-8a94-467d-820f-f1f453d659de',
     exp: Math.floor(Date.now()/1000) + 90*86400,
     type: 'reponse',
     nonce: crypto.randomUUID(),
   }, AVIS_TOKEN_SECRET);
   ```
4. Send him the magic link `/r/<reponseToken>/` manually via Resend
5. He uses the page to post a public response, which appears nested under the avis

## Known limitations of the pilot

1. **No artisan notification.** Since `caro-renov-colombes` has no email, Salih is not informed by the system. We could surface this via `/candidater/` outreach.
2. **No 48h preavis grace period.** The publication is immediate. For a less litigious starting point we could switch the default to manual moderation for the first 10 avis on the platform. Out of scope for this pilot.
3. **Turnstile is not active.** Phase 1-5 left the env vars `TURNSTILE_SECRET_KEY` and `PUBLIC_TURNSTILE_SITE_KEY` unset. The honeypot + cooldown + filter are the only spam defences. Turnstile to be activated via the CF dashboard before high-volume rollout.

## Rollback if the pilot goes wrong

If the avis turns out to be misleading or the publication causes legal exposure:

```bash
# Admin moderation endpoint (rejeter)
curl -sS "https://lobservatoiredespros.com/api/admin/avis/moderer?id=<avis_id>&action=rejeter&admin_token=<ADMIN_MODERATION_TOKEN>"
```

Or via service_role:

```bash
curl -X PATCH "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pro_avis?id=eq.<avis_id>" \
  -H "apikey: $SVC" -H "Authorization: Bearer $SVC" \
  -H "Content-Type: application/json" \
  -d '{"status":"rejete","rejection_reason":"manual review"}'
```

## E2E test status

`site/scripts/test-e2e-avis.py` runs both flows against production with marker-based isolation + cleanup. Result: PASS as of 2026-05-14 18:00 UTC (commit `52246a6` with SUPABASE_SERVICE_KEY fix).

```
=== Flow A : publie immediate (no artisan email, verdict=oui) ===
  13/13 assertions OK

=== Flow B : preavis 48h (artisan email present, verdict=non + long text) ===
  12/12 assertions OK

E2E test PASS
```
