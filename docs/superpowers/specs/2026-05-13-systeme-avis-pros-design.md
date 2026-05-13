# Spec — Système d'avis pros + droit de réponse

**Date** : 2026-05-13
**Statut** : Design validé, prêt pour planification d'exécution
**Auteur** : Augustin + Claude
**Trigger** : Témoignage Teyssard reçu via `/contact/` le 2026-05-13 concernant Caro Renov (slug `caro-renov-colombes`). Aucun mécanisme actuel pour publier ce témoignage. Cette spec définit le système qui le permettra et qui établira la mission éditoriale du site (mettre en avant les pros qui font du bon ou du mauvais travail).

---

## 1. Objectifs

**Primaires**
- Permettre à un visiteur de déposer un avis public sur une fiche pro (`/pro/[slug]/`)
- Donner à l'artisan un droit de réponse via lien magique (sans création de compte)
- Modérer pour limiter les avis abusifs sans bloquer la fluidité
- Respecter le RGPD (consentement, conservation, droit à l'oubli)

**Secondaires**
- Préparer l'extension Phase 2 "litige" (avis avec préavis renforcé et badge spécial) sans dette technique
- Enrichir le SEO via `schema.org/Review` et `AggregateRating`
- Réutiliser l'infrastructure existante (Astro + CF Pages + Supabase + Resend)

**Non-objectifs (hors scope Phase 1)**
- Système de compte / dashboard artisan (Phase Premium)
- Notation multi-critères (Phase 2 potentielle, le mode Oui/Non/Mitigé suffit pour démarrer)
- Modération automatisée par IA (filtre auto par règles suffit pour le volume initial)
- Système de vote utile / inutile sur les avis (Phase 3)
- Vérification de transaction par devis/facture uploadé (Phase 3)

---

## 2. Décisions de design (récap des 7 choix validés + défauts pris)

### Décisions explicites
| Sujet | Choix retenu | Pourquoi |
|---|---|---|
| Identification client | Pseudo + email obligatoire **vérifié par lien magique 48h** | Standard marché (Trustpilot, Google), trace réelle pour litiges, friction acceptable |
| Modération | **Hybride** : filtre auto pass → publication immédiate ; filtre flag → modération manuelle | Couvre 90% en auto, garde la main éditoriale sur les 10% sensibles |
| Timing notif artisan | **Hybride par sévérité** : avis bénin → publication immédiate + notif ; avis suspect → préavis 48h artisan | Aligné positionnement "média sérieux qui vérifie" |
| UI formulaire | Route dédiée `/pro/[slug]/donner-mon-avis/` | SEO, indexable, partageable, place pour charte éditoriale |
| Notation | **Oui / Non / Mitigé** + texte ≥ 100 chars | Cohérent avec le témoignage Teyssard, anti-fausse précision |
| Affichage fiche pro | Résumé stats + liste filtrable + réponses imbriquées | Auto-suffisant éditorialement, SEO riche |
| Droit de réponse | Magic link multi-actions (`/r/<token>/`) : répondre, éditer, signaler, demander suppression | Couvre tous les cas légitimes sans nécessiter compte |

### Défauts pris (sans débat)
| Sujet | Choix |
|---|---|
| Anti-spam | Cloudflare Turnstile (gratuit) + honeypot caché + rate limit IP (5/h, 20/jour) + cooldown email (1 avis/pro/email/30j) |
| Filtre auto | Longueur 100-5000 chars ; anti-doublon (même email+pro+texte 80% similaire/30j) ; URLs dans texte → flag ; mots-flags (escroc, voleur, criminel, arnaqueur) → flag (PAS reject) |
| Préavis 48h déclenchement | `verdict='non'` OU mots-flags présents OU `length(texte) > 500` |
| AggregateRating | Publié `≥ 3 avis publiés` uniquement |
| Conservation RGPD | Pseudo + texte = illimité (contenu éditorial). Email + IP hash + UA = anonymisation auto après 3 ans (cron mensuel). Droit à l'oubli sur demande via `/contact/`. |
| Notif visiteur | Email à publication + email si artisan répond |
| Phase 2 litige | Champ `type ENUM('avis','litige')` dès le schéma initial |
| Pseudo public | Saisie 2-30 chars, affiché publiquement |
| URL magic link | `/r/<token>/` (court), token = base64url(HMAC-SHA256(avis_id + pro_id + exp + nonce, secret)) |
| Magic link validité | 90 jours, renouvelable on demand par form `/r/renouveler` qui ré-envoie email artisan |

---

## 3. Architecture

### Vue d'ensemble

```
                  ┌──────────────────────────────────────────────┐
                  │   /pro/[slug]/donner-mon-avis/  (Astro SSR)   │
                  │   • Charte éditoriale + form RGPD-consented   │
                  │   • Turnstile widget + honeypot               │
                  └────────────────────┬─────────────────────────┘
                                       │  POST /api/avis/submit
                                       ▼
                  ┌──────────────────────────────────────────────┐
                  │   CF Pages Function : validation + filtre     │
                  │   • Turnstile verify (server-side)            │
                  │   • Rate limit IP + email cooldown            │
                  │   • Filtre auto longueur/doublon/URL/mots     │
                  │   • INSERT pro_avis status=                   │
                  │       'en_attente_verif_email'                │
                  │   • Resend → visiteur                         │
                  │     "Confirmez votre avis (lien 48h)"         │
                  └────────────────────┬─────────────────────────┘
                                       │  Click lien dans mail
                                       ▼
                  ┌──────────────────────────────────────────────┐
                  │   GET /api/avis/verifier/<token>              │
                  │   • email_verified=true                       │
                  │   • Si filtre flag → status=                  │
                  │       'en_attente_moderation'                 │
                  │     + Resend → admin pour décider             │
                  │   • Sinon, si artisan email connu ET trigger  │
                  │     préavis → status=                         │
                  │       'en_attente_preavis_artisan'            │
                  │     + Resend → artisan "Préavis 48h"          │
                  │   • Sinon → status='publie' + publish_at=now()│
                  │     + bump pros.avis_nombre                   │
                  │     + Resend → visiteur "Publié"              │
                  │     + Resend → artisan (si email) "Publié"    │
                  └─────────┬─────────────────────────┬──────────┘
                            │                         │
                  ┌─────────▼──────────┐    ┌────────▼───────────┐
                  │  /pro/[slug]/      │    │ /r/<token>/         │
                  │  (live, l'avis     │    │ Magic link artisan: │
                  │  apparaît dans     │    │  • Voir l'avis      │
                  │  la liste)         │    │  • Répondre         │
                  │                    │    │  • Éditer réponse   │
                  │                    │    │  • Signaler         │
                  │                    │    │  • Demander suppr.  │
                  └────────────────────┘    └────────────────────┘
```

### Composants

1. **Frontend Astro** (SSR pour les routes dynamiques) :
   - `/pro/[slug]/donner-mon-avis/index.astro`
   - `/avis/verifier/[token]/index.astro`
   - `/r/[token]/index.astro`
   - Composant `<AvisList>` réutilisable, intégré sur `/pro/[slug]/`

2. **Cloudflare Pages Functions** (7 endpoints, voir §5)

3. **Supabase PostgreSQL** :
   - 4 nouvelles tables (`pro_avis`, `pro_avis_responses`, `pro_avis_response_history`, `pro_response_tokens`)
   - 1 fonction PL/pgSQL pour mise à jour `pros.avis_moyen` + `pros.avis_nombre` via trigger AFTER UPDATE OF status ON pro_avis

4. **Resend** :
   - 7 templates email (voir §7)
   - Domaine vérifié : `send.lobservatoiredespros.com`

5. **GitHub Actions** :
   - `auto-publish-preavis-expires.yml` : cron 6h, passe les avis `en_attente_preavis_artisan` dépassés en `publie`
   - `rgpd-anonymize-old-avis.yml` : cron mensuel, anonymise emails/IP des avis > 3 ans

---

## 4. Schéma DB

### Table `pro_avis`

```sql
CREATE TABLE public.pro_avis (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  pro_id uuid NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'avis' CHECK (type IN ('avis','litige')),

  -- Identité client
  pseudo text NOT NULL CHECK (length(pseudo) BETWEEN 2 AND 30),
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text UNIQUE,
  email_verification_expires_at timestamptz,

  -- Contenu
  verdict text NOT NULL CHECK (verdict IN ('oui','non','mitige')),
  texte text NOT NULL CHECK (length(texte) BETWEEN 100 AND 5000),

  -- Workflow
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

  -- RGPD / forensics
  ip_hash text,
  user_agent text,
  rgpd_consent boolean NOT NULL DEFAULT false,
  anonymized_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pro_avis_pro_status_idx ON public.pro_avis(pro_id, status, published_at DESC);
CREATE INDEX pro_avis_token_idx ON public.pro_avis(email_verification_token);
CREATE INDEX pro_avis_pending_idx ON public.pro_avis(status)
  WHERE status IN ('en_attente_preavis_artisan','en_attente_moderation');
CREATE INDEX pro_avis_anonymize_idx ON public.pro_avis(published_at)
  WHERE anonymized_at IS NULL AND status = 'publie';
```

### Table `pro_avis_responses`

```sql
CREATE TABLE public.pro_avis_responses (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  avis_id uuid NOT NULL UNIQUE REFERENCES public.pro_avis(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES public.pros(id),
  texte text NOT NULL CHECK (length(texte) BETWEEN 50 AND 2000),
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'publie' CHECK (status IN ('publie','supprime')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pro_avis_responses_pro_idx ON public.pro_avis_responses(pro_id);
```

### Table `pro_avis_response_history` (audit trail)

```sql
CREATE TABLE public.pro_avis_response_history (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.pro_avis_responses(id) ON DELETE CASCADE,
  texte_old text,
  texte_new text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by_ip_hash text
);

CREATE INDEX pro_avis_response_history_response_idx ON public.pro_avis_response_history(response_id, changed_at DESC);
```

### Table `pro_response_tokens` (magic links audit)

```sql
CREATE TABLE public.pro_response_tokens (
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

CREATE INDEX pro_response_tokens_hash_idx ON public.pro_response_tokens(token_hash);
CREATE INDEX pro_response_tokens_avis_idx ON public.pro_response_tokens(avis_id);
```

### Trigger pour `pros.avis_moyen` + `avis_nombre`

```sql
CREATE OR REPLACE FUNCTION update_pro_avis_aggregate()
RETURNS trigger AS $$
DECLARE
  v_count integer;
  v_score decimal;
BEGIN
  SELECT
    COUNT(*),
    AVG(CASE verdict WHEN 'oui' THEN 5 WHEN 'mitige' THEN 3 WHEN 'non' THEN 1 END)
  INTO v_count, v_score
  FROM public.pro_avis
  WHERE pro_id = COALESCE(NEW.pro_id, OLD.pro_id)
    AND status = 'publie';

  UPDATE public.pros
  SET avis_nombre = v_count,
      avis_moyen = v_score,
      updated_at = now()
  WHERE id = COALESCE(NEW.pro_id, OLD.pro_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pro_avis_aggregate_trigger
AFTER INSERT OR UPDATE OF status OR DELETE ON public.pro_avis
FOR EACH ROW EXECUTE FUNCTION update_pro_avis_aggregate();
```

### RLS (Row-Level Security)

```sql
ALTER TABLE public.pro_avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_avis_responses ENABLE ROW LEVEL SECURITY;

-- Anonymous peut INSERT pro_avis avec rgpd_consent=true, status forcé à 'en_attente_verif_email'
CREATE POLICY "Anonymous insert avis with consent"
ON public.pro_avis FOR INSERT TO anon
WITH CHECK (rgpd_consent = true AND status = 'en_attente_verif_email');

-- Anonymous peut SELECT uniquement les avis publiés
CREATE POLICY "Public read published avis"
ON public.pro_avis FOR SELECT TO anon
USING (status = 'publie');

-- Anonymous peut SELECT les réponses des avis publiés
CREATE POLICY "Public read responses of published avis"
ON public.pro_avis_responses FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.pro_avis WHERE id = avis_id AND status = 'publie'
  )
  AND status = 'publie'
);

-- UPDATE / DELETE sur les 4 tables : service_role uniquement (via CF Pages Functions avec Supabase Mgmt API ou SUPABASE_SERVICE_ROLE_KEY)
```

---

## 5. API endpoints (Cloudflare Pages Functions)

| Endpoint | Méthode | Auth | Description |
|---|---|---|---|
| `/api/avis/submit` | POST | Anonyme + Turnstile | Submit nouvel avis. Valide Turnstile, applique rate limit + cooldown, filtre auto, INSERT pro_avis. Envoie email confirmation visiteur via Resend. |
| `/api/avis/verifier/:token` | GET | Token email_verification | Vérifie l'email, applique workflow (publication immédiate / préavis / modération). Redirige vers `/avis/verifier/<token>/` (page Astro) selon outcome. |
| `/api/r/:token` | GET | Token HMAC magic link | Retourne JSON avec preview de l'avis pour la page Astro `/r/<token>/`. |
| `/api/r/:token/repondre` | POST | Token HMAC magic link | Crée ou met à jour la réponse de l'artisan. Si update, INSERT pro_avis_response_history. |
| `/api/r/:token/signaler` | POST | Token HMAC magic link | Marque l'avis pour modération (status=en_attente_moderation). Envoie email admin. |
| `/api/r/:token/demander-suppression` | POST | Token HMAC magic link | Crée une demande de suppression (passe en file modération avec moderation_reason). |
| `/api/r/:token/renouveler` | POST | Token HMAC magic link | Régénère un token expiré, ré-envoie email artisan. |
| `/api/admin/avis/moderer` | POST | Token admin (env secret) | Approve/reject un avis en attente. Met à jour `pros.avis_*` via trigger. |

**Signature des tokens HMAC** : `base64url(token_payload || hmac_sha256(token_payload, env.AVIS_TOKEN_SECRET))` où `token_payload = base64url({avis_id, pro_id, exp, type, nonce})`. Vérification stateless mais on cross-check avec `pro_response_tokens` pour audit + revocation possible.

---

## 6. Filtre auto + anti-spam

### Règles filtre auto (au submit, avant INSERT)

Deux types d'**outcome** sont possibles : **Reject** (avis pas créé, erreur HTTP), **Silent accept** (faux succès anti-bot), ou **Flag** qui se subdivise en deux pistes distinctes :
- **Flag-modération** → `status='en_attente_moderation'` après vérif email → toi tu décides via les boutons admin dans le mail Resend.
- **Flag-préavis** → `status='en_attente_preavis_artisan'` après vérif email si artisan email connu, sinon directement `status='publie'`. L'artisan a 48h pour répondre avant publication.

| Règle | Outcome |
|---|---|
| `length(texte) < 100` ou `> 5000` | **Reject** (HTTP 400) |
| Turnstile token invalide ou absent | **Reject** (HTTP 403) |
| Rate limit IP : > 5 submits/heure ou > 20/jour | **Reject** (HTTP 429) |
| Cooldown email : 1 avis pour (pro_id, email) sur 30 jours | **Reject** (HTTP 429) |
| Doublon : texte > 80% Levenshtein-similaire à un avis existant de même email | **Reject** (HTTP 409) |
| Honeypot field `company` rempli | **Silent accept** (303 redirect /merci, mais pas d'INSERT) |
| URLs dans texte (`http://`, `https://`, `www.`) | **Flag-modération** : `moderation_reason='url_detected'` |
| Mots-flags : `escroc, voleur, criminel, arnaqueur, fraudeur, escroquerie, arnaque` (liste configurable côté env CF `AVIS_MOTS_FLAGS_CSV`) | **Flag-modération** : `moderation_reason='mots_flags'` |
| `verdict='non'` ET `length(texte) > 500` (sans aucun autre flag) | **Flag-préavis** : déclenche préavis 48h si artisan email connu, sinon publication immédiate |

**Précédence** : Si plusieurs règles flag s'appliquent en même temps, **Flag-modération l'emporte sur Flag-préavis** (i.e. mots-flags + verdict='non' → modération manuelle, pas préavis automatique). Cela force la revue admin sur les cas les plus sensibles.

### Cloudflare Turnstile

- Widget invisible (`appearance: interaction-only`) sur le form pour ne pas casser l'UX
- Site key public dans le frontend, secret key dans CF Pages env `TURNSTILE_SECRET_KEY`
- Verify côté Function avant validation

### Rate limit

- Cloudflare Rate Limiting Rules (1 règle par endpoint `/api/avis/submit`) : 5 requests/IP/hour, 20/IP/day
- Cooldown email : query DB côté Function avant INSERT

---

## 7. Notifications email (Resend)

| ID | Template | Recipient | Trigger | Lien dans le mail |
|---|---|---|---|---|
| `avis_visitor_confirm` | Confirmez votre avis | Visiteur | Submit accepté | `https://lobservatoiredespros.com/api/avis/verifier/<token>` |
| `avis_visitor_published` | Votre avis est publié | Visiteur | Avis passe en `publie` | `https://lobservatoiredespros.com/pro/<slug>/#avis-<id>` |
| `avis_visitor_response` | L'artisan a répondu à votre avis | Visiteur | INSERT pro_avis_responses (1ère fois) | `https://lobservatoiredespros.com/pro/<slug>/#avis-<id>` |
| `avis_pro_preavis` | Un avis sur votre fiche : préavis 48h | Artisan | status passe à `en_attente_preavis_artisan` | `https://lobservatoiredespros.com/r/<token>/` |
| `avis_pro_published_immediate` | Un nouvel avis sur votre fiche | Artisan | status passe à `publie` (cas non-préavis) | `https://lobservatoiredespros.com/r/<token>/` |
| `admin_moderation_required` | Avis en attente de modération | Toi (admin) | status passe à `en_attente_moderation` | 2 boutons HTML : `https://lobservatoiredespros.com/api/admin/avis/moderer?id=<id>&action=publier&admin_token=<env>` et `?action=rejeter` (voir §11) |
| `admin_pro_signalement` | Un artisan signale un avis | Toi (admin) | POST `/api/r/.../signaler` | Idem que ci-dessus (mêmes URLs, action=publier ou rejeter, le contexte de signalement est inclus dans le mail) |

Tous les emails utilisent `noreply@send.lobservatoiredespros.com` (domaine Resend déjà vérifié) avec `reply_to=contact@lobservatoiredespros.com` (sauf templates artisan : `reply_to=` non défini, pour ne pas tromper).

---

## 8. Schema.org markup (sur fiche pro)

### Review par avis publié

```json
{
  "@type": "Review",
  "author": {"@type": "Person", "name": "<pseudo>"},
  "datePublished": "<published_at ISO date>",
  "reviewBody": "<texte avis>",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": <5|3|1>,
    "bestRating": 5,
    "worstRating": 1
  }
}
```

(`verdict=oui` → 5, `mitige` → 3, `non` → 1.)

Si l'avis a une réponse artisan publiée, on ajoute `comment` :
```json
"comment": [{
  "@type": "Comment",
  "author": {"@type": "Organization", "name": "<nom_entreprise>"},
  "text": "<réponse>",
  "datePublished": "<response.created_at>"
}]
```

### AggregateRating (si ≥ 3 avis publiés)

```json
{
  "@type": "AggregateRating",
  "ratingValue": "<avis_moyen, 1 décimale>",
  "bestRating": "5",
  "worstRating": "1",
  "reviewCount": "<avis_nombre>"
}
```

Sous le seuil (1 ou 2 avis) : on n'émet **pas** d'AggregateRating, pour éviter la pseudo-précision.

---

## 9. Cron jobs (GitHub Actions)

### `auto-publish-preavis-expires.yml`

```yaml
name: Auto-publish preavis expirés
on:
  schedule:
    - cron: "0 */6 * * *"  # Toutes les 6 heures
  workflow_dispatch: {}
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: |
          # SQL via Supabase Mgmt API :
          # UPDATE pro_avis SET status='publie', published_at=now()
          # WHERE status='en_attente_preavis_artisan'
          #   AND preavis_envoye_at < now() - INTERVAL '48 hours'
          # + bump pros.avis_nombre via trigger
          # + Resend → visiteur (avis_visitor_published)
          # + Resend → artisan si email connu (avis_pro_published_immediate)
```

### `rgpd-anonymize-old-avis.yml`

```yaml
name: RGPD anonymisation avis > 3 ans
on:
  schedule:
    - cron: "0 4 1 * *"  # 1er du mois à 04:00 UTC
  workflow_dispatch: {}
jobs:
  anonymize:
    runs-on: ubuntu-latest
    steps:
      - run: |
          # SQL :
          # UPDATE pro_avis SET
          #   email = NULL,
          #   ip_hash = NULL,
          #   user_agent = NULL,
          #   anonymized_at = now()
          # WHERE published_at < now() - INTERVAL '3 years'
          #   AND anonymized_at IS NULL
          # Le pseudo et le texte sont conservés (contenu éditorial)
```

---

## 10. Routes Astro

### `/pro/[slug]/donner-mon-avis/index.astro`

- SSR (utilise la même Pages Function pattern que `/pro/[slug]/`)
- Récupère la fiche pro (Supabase, par slug)
- Affiche :
  - Récap fiche (nom_entreprise, ville, métier)
  - Charte éditoriale (max 200 mots, points : on ne publie pas d'insultes / on garde le RGPD / le pro a 48h pour répondre si critique forte / on vérifie ton email avant publication)
  - Formulaire :
    - Pseudo (input text 2-30 chars)
    - Email (input email, required)
    - Verdict (3 boutons radio : `Oui je recommande` / `Mitigé` / `Non je déconseille`)
    - Texte (textarea 100-5000 chars, compteur live)
    - Honeypot `<input type="text" name="company" style="position:absolute;left:-9999px">`
    - Turnstile widget
    - Checkbox RGPD consent (required, libellé conforme : "J'accepte que mon avis soit publié sur lobservatoiredespros.com et que mon email soit utilisé pour vérification et pour permettre à l'artisan de me répondre. [lien RGPD]")
    - Submit button "Publier mon avis"

### `/avis/verifier/[token]/index.astro`

- SSR, lit `[token]` via Astro.params
- Appelle `/api/avis/verifier/<token>` (server-side)
- Selon réponse :
  - OK publié → "Votre avis a été publié sur la fiche [nom_entreprise]. Lien : [...]"
  - OK préavis → "Votre avis a été vérifié. L'artisan a 48h pour répondre avant publication."
  - OK modération → "Votre avis a été vérifié et envoyé à notre rédaction pour validation finale."
  - KO token expiré → "Le lien a expiré. Pour soumettre à nouveau, retournez sur la fiche pro."
  - KO token invalide → 404

### `/r/[token]/index.astro`

- SSR, lit `[token]` via Astro.params
- Appelle `/api/r/<token>` (server-side, GET) → JSON `{avis: {...}, response: {...} | null, expires_at: ...}`
- Affiche :
  - Preview de l'avis (pseudo, date, verdict, texte)
  - Si réponse existante : affichée avec bouton "Éditer ma réponse"
  - Sinon : textarea pour rédiger la réponse (50-2000 chars)
  - 3 boutons : "Signaler cet avis (modération)" / "Demander la suppression" / "Publier ma réponse"
- Si token expiré : affiche bouton "Régénérer le lien" → POST `/api/r/<token>/renouveler`

### `/pro/[slug]/index.astro` (modification)

- Le composant `<AvisList>` ajouté dans le flow de la page :
  - **Au-dessus** : si `avis_nombre >= 3` → résumé stats horizontal ("9 avis : 78 % recommandent") avec barre visuelle
  - Liste verticale paginée 5 par 5 (filtres bouton : Tous / Oui / Mitigé / Non)
  - Pour chaque avis : pseudo, date, badge verdict, texte, et si réponse → bloc imbriqué "Réponse de [nom_entreprise]"
- Le bouton "Laisser un avis" dans le bloc Contact → href `/pro/[slug]/donner-mon-avis/`

---

## 11. Modération admin (UI minimaliste)

Pas de dashboard complet en Phase 1. Workflow admin :

1. Tu reçois un email `admin_moderation_required` avec :
   - Preview de l'avis (pseudo, verdict, texte, fiche pro, raison du flag)
   - 2 boutons en HTML : `[Publier]` (POST `/api/admin/avis/moderer?id=X&action=publier&admin_token=...`) et `[Rejeter]` (action=rejeter)
2. Le token admin = secret stocké en CF Pages env `ADMIN_MODERATION_TOKEN` (long random string)
3. Une fois cliqué : la Function exécute l'action et redirige vers `/admin/avis/[id]/done`

Optionnel ultérieur : page `/admin/avis/` qui liste les avis en attente (auth via header `Authorization: Bearer <ADMIN_MODERATION_TOKEN>`). Hors scope Phase 1.

---

## 12. Rollout

### Étape 1 — Staging (jour J)
- Déployer schéma DB sur production Supabase (migration `20260513_013_pro_avis_system.sql`)
- Déployer endpoints CF Pages Functions
- Déployer routes Astro
- Tester end-to-end avec un avis bidon sur une fiche test (Pascal par exemple, dont on connaît la situation)
- Vérifier les 7 templates Resend
- Vérifier le trigger SQL pour `pros.avis_moyen`

### Étape 2 — Pilote Caro Renov (J+1 à J+3)
- Répondre au mail Teyssard : "Notre nouveau système d'avis est en ligne, voici le lien direct pour publier votre témoignage sur la fiche Caro Renov : `/pro/caro-renov-colombes/donner-mon-avis/`. Vous resterez anonyme côté affichage public. L'artisan recevra un préavis de 48h avant publication."
- Teyssard publie son avis (verdict 'non' + texte 600 mots → flag automatique pour préavis 48h)
- L'artisan Caro Renov n'a **pas d'email connu** en DB (vérifié : `email=null`). Donc pas de préavis possible.
- **Décision pilote** : on bypass le préavis pour ce cas spécifique (mise à jour manuelle status='publie' via Mgmt API) OU on attend que l'artisan revendique via `/candidater/`. Recommandation : on bypass (preuve déjà documentée par Teyssard).

### Étape 3 — Pilote 5 fiches (J+3 à J+10)
- Activer le formulaire sur 5 fiches au choix (par exemple : Caro Renov + Pascal + 3 fiches Tier "argent" avec email connu)
- Surveiller : tentatives de spam, taux de complétion form, qualité des avis
- Itérer sur le filtre auto si besoin

### Étape 4 — Full rollout (J+10)
- Activer sur les 103 651 fiches
- Communication : article observation "Notre nouveau système d'avis est en ligne"
- Surveiller volume + modération

---

## 13. Tests

### Unit (Vitest ou tests inline)
- `filterAuto.test.ts` : règles longueur, doublon (Levenshtein), URLs, mots-flags
- `hmacToken.test.ts` : sign + verify + expire + revoke
- `anonymize.test.ts` : la fonction d'anonymisation laisse pseudo + texte, supprime email + ip + ua

### Integration (Playwright ou Cypress, hors scope si trop lourd)
- E2E : visite `/pro/caro-renov-colombes/donner-mon-avis/` → remplit form → submit → email confirmation → click → avis live
- E2E : magic link → réponse → publication

### Manuel (obligatoire Étape 1)
- Submit 1 avis test en local Wrangler
- Click email Resend en local (Resend dev mode)
- Réponse magic link
- Édition réponse
- Signalement
- Demande suppression
- Vérif schema.org JSON-LD via Rich Results Test Google

---

## 14. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Spam massif (bots qui passent Turnstile) | Rate limit IP CF + cooldown email + filtre doublon. Si problème → ajouter captcha visuel (hCaptcha) |
| Avis diffamatoire passe le filtre auto | Préavis 48h artisan + droit de signalement + cron qui surveille les mots-flags. Backup : tu reçois un mail par avis publié si tu actives le flag "watch all" |
| Artisan en colère menace en privé (mail) | Le système ne crée pas de canal de menace : l'artisan répond publiquement ou rien. Pas d'email visiteur exposé. |
| Visiteur n'arrive pas à confirmer son email (problème spam folder) | Token validité 48h, possibilité de re-submit après expiration. Documenter dans la charte "regardez votre dossier spam". |
| Token magic link compromis (artisan a transféré le mail) | Audit via `pro_response_tokens.consumed_from_ip_hash`. Si pattern abus → revocation manuelle via Mgmt API. |
| GDPR : visiteur demande suppression de SES données | Endpoint manuel via /contact/ (objet "correction") → toi tu fais `UPDATE pro_avis SET email=NULL, pseudo='[supprimé]', texte='[supprimé sur demande]', anonymized_at=now() WHERE id=X` via Mgmt API |
| `pros.avis_moyen` trigger échoue (bug PL/pgSQL) | Tester en staging + fallback : si trigger fail, on recalcule via cron mensuel |

---

## 15. Décisions différées (Phase 2+)

- **Phase 2 (1-3 mois après Phase 1)** : option "litige" sur le form (`type='litige'`). Workflow distinct : toujours préavis 7j + toujours modération manuelle + badge "Litige rapporté" sur l'avis. UI dans la page formulaire : radio "Avis classique" / "Signaler un litige".
- **Phase 3 (3-6 mois)** : système de vote utile / inutile sur les avis (lecteur peut upvote/downvote).
- **Phase 3** : vérification avis par devis/facture uploadé (badge "Avis vérifié transaction").
- **Phase 4** : dashboard pro avec compte+mot de passe (lié Tier Argent/Or payant).

---

## 16. Estimation effort (indicatif)

| Bloc | Effort | Notes |
|---|---|---|
| Migration SQL (4 tables + trigger + RLS) | 2h | Inclus tests trigger en local Supabase |
| 7 endpoints CF Pages Functions | 6h | Reuse pattern `/api/contact.ts` existant |
| 3 routes Astro (form + verify + magic link) | 4h | |
| Composant `<AvisList>` + intégration `/pro/[slug]/` | 3h | Reuse style existant |
| 7 templates Resend HTML | 2h | |
| 2 GitHub Actions (cron preavis + cron RGPD) | 1.5h | Reuse pattern workflows existants |
| Tests unit + manuel E2E | 3h | |
| Doc admin + charte éditoriale form | 1.5h | |
| **TOTAL** | **23h ≈ 3 jours** | Étalable sur 1 semaine confortable |
