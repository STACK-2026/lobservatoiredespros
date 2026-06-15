# Modification d'avis par lien magique - Design (2026-06-15)

## Contexte

Une visiteuse (Stephanie L., `stephanielachieze032527@gmail.com`, pseudo `Bvrpp-j`, avis
`e7540254-99ca-49a5-a0c0-37909800daa0` sur MSL CARRELAGE, verdict `non`, statut `publie`)
a ecrit deux fois a `contact@` pour demander si elle peut modifier son avis. Aujourd'hui le
systeme ne propose aucun moyen pour un visiteur de modifier un avis deja publie.

Objectif : (1) permettre la modification d'un avis publie via un lien magique signe, (2) ajouter
automatiquement un bouton "Modifier mon avis" dans l'email de publication pour tous les futurs
avis, (3) un endpoint admin pour envoyer ce lien manuellement aux reclamations recues par email
(comme celle de la dame).

## Architecture (suit les patterns existants)

Flow avis existant : `donner-mon-avis` (form) -> `api/avis/submit` (INSERT, statut
`en_attente_verif_email`) -> email de confirmation -> `api/avis/verifier/[token]` (publie +
emails) -> `avis/verifier/[token]` (page resultat). Magic-links artisan signes HMAC-SHA256 via
`_lib/token.ts`, audites dans `pro_response_tokens`. Envois Resend (User-Agent navigateur
obligatoire, sinon 403/1010 derriere Cloudflare).

### 1. Token (`_lib/token.ts`)
Ajouter le type `"edition"` a l'union `TokenPayload.type` et a la whitelist de `verifyToken`.
Meme secret `AVIS_TOKEN_SECRET`, meme format. Expiration **90 jours** (coherent preavis/reponse).

### 2. Helper de formulaire partage (`_lib/avisForm.ts`)
Extraire le bloc HTML du formulaire d'avis dans `renderAvisForm(opts)` parametre par : `mode`
(`create`|`edit`), `actionUrl`, `hiddenFields`, `turnstileSiteKey`, `values` (prefill
pseudo/verdict/texte), `showEmail`, libelles (eyebrow/heading/submit/charte). `donner-mon-avis.ts`
et la page d'edition l'utilisent tous deux. En mode `edit` : email masque (identite connue via
token), pas de Turnstile (le token authentifie), verdict pre-coche, texte pre-rempli.

### 3. Page d'edition (`functions/avis/modifier/[token].ts`, GET)
Verifie le token -> recupere l'avis par `avis_id` -> si statut editable
(`publie`/`en_attente_moderation`/`en_attente_preavis_artisan`) rend le formulaire prefille
postant vers `/api/avis/modifier` (token en champ cache). Token invalide/expire ou avis non
editable (`rejete`/`supprime`) -> page d'erreur brandee.

### 4. Soumission (`functions/api/avis/modifier.ts`, POST)
Verifie le token -> recupere l'avis (cle service) -> re-execute `runFilter` sur le nouveau
contenu :
- `silent_accept` (honeypot) -> redirige, aucune modification ;
- `reject` -> page d'erreur, rien n'est modifie ;
- `flag_moderation` -> UPDATE (pseudo/verdict/texte/`edited_at`), statut `en_attente_moderation`
  (l'avis quitte le public le temps de l'examen), email admin avec boutons publier/rejeter ;
- `pass` ou `flag_preavis` -> UPDATE + statut `publie`, `published_at` et `edited_at` rafraichis
  (pas de nouveau preavis 48h sur une edition).
Si le verdict a change ET l'artisan a un email ET statut final `publie` -> re-notification artisan
(nouveau magic-link reponse). Email de confirmation a la visiteuse dans tous les cas. La reponse
est une page HTML de confirmation brandee (pas de route resultat supplementaire).

### 5. Bouton dans l'email de publication (`api/avis/verifier/[token].ts`)
Au moment de l'email "Votre avis est en ligne", generer aussi un token `edition` et ajouter un
bouton "Modifier mon avis" (`/avis/modifier/<token>/`). -> tous les futurs avis publies l'ont.

### 6. Endpoint admin (`functions/api/admin/avis/lien-edition.ts`, GET)
Protege par `ADMIN_MODERATION_TOKEN`. `?id=<avisId>` -> genere le lien d'edition, l'audite, et
(par defaut) envoie a l'email de la visiteuse un message courtois avec le bouton. Renvoie une page
HTML affichant le lien. Sert a repondre a la dame maintenant et a toute reclamation future par mail.

## Migration schema (Management API)
- `alter table pro_avis add column if not exists edited_at timestamptz;`
- Elargir la contrainte : `pro_response_tokens_type_check` doit autoriser
  `['preavis','reponse','edition']` (sinon l'audit du token edition echoue).

## Hors perimetre (YAGNI)
Pas de suppression via ce flow (deja possible via `/contact/`), pas d'edition d'avis non verifie,
pas d'historique de versions, pas de modification de l'email (cle d'identite/cooldown).

## Regles brand
Accents UTF-8 corrects, aucun tiret cadratin, vouvoiement visiteur, "nous" editorial. UA navigateur
sur tous les envois Resend.
