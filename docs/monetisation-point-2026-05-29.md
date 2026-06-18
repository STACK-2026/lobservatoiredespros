# L'Observatoire des Pros — Point monétisation (29/05/2026)

> Document de reprise « au millimètre ». État des stats live, décision de modèle,
> liste chaude de prospects, et recette reproductible d'accès aux données.
> Auteur de la session : analyse Claude Code à la demande d'Augustin.

---

## 0. TL;DR

- **SEO marche, monétisation = 0.** Le site est déjà une **machine à lead-gen non facturée et non attribuée** : ~25-35 intentions de contact/semaine (reveals tél/email sur fiches `/pro/`), en croissance depuis le fix Resend (11/05). Le visiteur part appeler le pro → rien capturé, pro ne sait pas que ça vient de nous.
- **Modèle retenu = abonnement « fiche revendiquée / vérifiée » (29/89 €), PAS pay-per-lead générique.** Les chiffres l'imposent : 97 % du trafic et 86 % des intentions de contact sont **nominatifs** (`/pro/`). Le générique métier/département ne pèse que **2,9 %** du trafic → une marketplace de leads génériques crèverait de faim.
- **Action « maintenant » = validation manuelle**, pas de dev produit. Appeler 5-20 pros chauds avec *leurs* chiffres, viser 2-3 oui à 29 € encaissés à la main (lien Stripe). Si ça paie → on construit. Si 0 → le levier redevient SEO (pousser métier/dept).
- **Infra déjà là** : `pros.tier` (gratuit/argent/or), table `abonnements`, prix 29/89 €. Quasi rien à coder côté produit.

---

## 1. Recette d'accès aux données (reproductible)

### Supabase (projet `apuyeakgxjgdcfssrtek`)
- L'endpoint SQL du Management API (`/v1/projects/{ref}/database/query`) renvoie **403** avec notre PAT → **passer par PostgREST** `https://{ref}.supabase.co/rest/v1/`.
- Récupérer la **service_role key** via le PAT (pattern de `scripts/export_pros_emails.py`) :
  `GET https://api.supabase.com/v1/projects/{ref}/api-keys?reveal=true` (header `Authorization: Bearer $SUPABASE_PAT`).
- ⚠️ **Cloudflare error 1010** sur les requêtes urllib → ajouter un **User-Agent navigateur** (`Mozilla/5.0 ... Chrome/...`) sur TOUS les appels (Management API + PostgREST).
- Lecture interdite à `anon` sur `contact_messages` / `form_events` / `events` → service_role obligatoire.

### GSC (API)
- Propriété : `sc-domain:lobservatoiredespros.com`, permission **owner**.
- Creds : `GSC_CLIENT_ID/SECRET/REFRESH_TOKEN` dans `.env.master`, helper `scripts/intel/_common.py::gsc_access_token()`.
- **Le nombre « pages dans l'index » n'est exposé par AUCUNE API** (rapport Indexation = UI-only). Plancher fiable = pages avec ≥1 impression via Search Analytics (sans le cap 1000 lignes de l'export UI).

---

## 2. Indexation (source : screenshot GSC user, maj 25/05)

| Métrique | Valeur |
|---|---|
| Dans l'index | **99 k** |
| Non indexées | 6,68 k (7 motifs ; top : « explorée non indexée » 881, « canonique correcte » 228, 404 = 85) |
| URLs soumises (sitemaps) | ~105 300 (87 851 fiches `/pro/` + 17 458 autres) |
| **Taux d'indexation** | **~94 %** (excellent pour pSEO de 2 mois) |
| Plancher API (pages ≥1 impression) | 50 384 |

---

## 3. Stats lead-gen (live, 29/05)

### A. Volume & source
- `contact_messages` = **3 lignes au total, 0 `piste`** (que signalement/correction/autre). Le formulaire de demande projet « je cherche un maçon » **n'existe pas**.
- Intentions de contact (table `events`, sur ~1 mois) : **44 phone** (click+reveal), **44 email**, **7 website**. Tendance hebdo en hausse.
- **Origine** (n=98) : **85,7 % `/pro/` (nominatif)**, 7,1 % page métier liste, 7,1 % éditorial, ~0 % métier/dept générique.

### B. Funnel & délivrabilité
| Form | view | focus | success |
|---|---|---|---|
| contact | 56 | 18 | 2 |
| candidater | 24 | 12 | 0 (cf. §5) |
| newsletter | 1083 | 0 | 1 |
- **Bruit bot massif** : `form_events` 92 % bots (13 853/15 051) ; `page_views` **99 % bots** (1 126 942/1 136 796 → 9 854 humains). → dashboards maison faux tant que non filtrés.
- **Device humains** : **88 % mobile** / 12 % desktop (LCP mobile ~5,2 s = friction sur le device qui convertit).
- Délivrabilité Resend : n=2-3 → non significatif, et la livraison n'est pas loggée en base (vérifier logs Resend si besoin). **Non bloquant** à ce volume.

### C. Qualité
n=3, non significatif. 0 spam, mais 0 vraie demande projet.

### D. Côté offre (vivier pitchable)
| Métrique | Valeur |
|---|---|
| pros total / actifs | 103 662 / 103 651 |
| **joignables (tél OU email)** | **8 192 (8 %)** |
| tél / email / site web | 8 087 / 4 552 / 5 976 |
| payants / abonnements / verified | 0 / 0 / 0 |
| candidatures pros entrantes | 3 |
→ **92 % des fiches n'ont aucune coordonnée = invendables.**

### E. Plafond — trafic commercial (GSC 28j)
| Segment | clics | % | pages |
|---|---|---|---|
| **fiche `/pro/` (nominatif)** | **5 480** | **97,0 %** | 49 126 |
| métier/dept (générique) | 165 | 2,9 % | 1 197 |
| éditorial | 6 | 0,1 % | 37 |
| tarifs | 0 | 0 % | 10 |

---

## 4. Liste chaude — prospects à appeler

**Fichier** : `exports/liste_chaude_pitch.csv` (reveals/fiche × pros joignables). 41 fiches sollicitées, **17 joignables**.

Top à appeler :
| Demandes | Entreprise | Ville | Tél |
|---|---|---|---|
| 20 | LT CONFORT | Clermont-Créans | 06 21 60 92 57 |
| 6 | 3K INSTALLATION | Saint-Maurice-de-Beynost | 06 69 32 96 73 |
| 4 | GROUPE MULLER TRADING | Paris | 01 59 53 02 64 |
| 3 | LES MENUISERIES D'AUXIGNY | Quantilly | +33 2 48 57 16 71 |
| 3 | EURL GERMAIN | Alligny-en-Morvan | 03 86 76 11 00 |

⚠️ **PRO2BO (Flacheres, 5 demandes) = injoignable** (ni tél ni email en base) → enrichir sa fiche, c'est de la demande qui fuit.

### Pitch (honnête, attribué, chiffré)
La donnée est *« X personnes ont cliqué pour obtenir vos coordonnées »* (pas X clients signés). Rester factuel.

> « Bonjour, je suis de L'Observatoire des Pros, un guide en ligne des artisans du bâtiment. **[Entreprise] a une fiche chez nous, et le mois dernier [N] personnes ont cliqué pour récupérer vos coordonnées depuis cette fiche.** Aujourd'hui c'est gratuit et vous ne le saviez pas. Pour **29 €/an**, vous revendiquez votre fiche : vous passez en tête de votre catégorie, vous recevez ces demandes, et vous voyez vos stats. On en discute 2 minutes ? »

Variante email (objet : *« [N] personnes ont cherché à vous joindre via notre site le mois dernier »*).

**Objectif : 2-3 oui à 29 €, encaissement manuel (lien Stripe). Zéro code.**

---

## 5. Funnel `candidater` — PAS cassé (correction d'une fausse alerte)

`src/pages/candidater/index.astro` → `functions/api/candidature.ts`. Backend **OK** (3 candidatures y sont bien passées).

- ❌ **Correction** : une première analyse annonçait un « bug SIRET espaces → 400 silencieux ». **FAUX.** Le serveur fait `get("siret").replace(/\s+/g, "")` (ligne 117) **avant** le test `/^\d{14}$/` (ligne 134). Le format espacé `123 456 789 00012` passe. HTML `pattern="[0-9 ]{14,18}"` cohérent. **Aucun bug.**
- **Vraie cause des 0 complétion** : ~0 trafic pro qualifié sur `/candidater/` (24 vues/mois, gonflées bots, sur un site fréquenté à 97 % par des particuliers). + probable **sous-comptage** de `form_events.success` (POST natif → 303 redirect, le beacon JS ne part pas avant navigation). Vérité = table `candidatures` = 3.
- 🪨 **9 champs obligatoires** = friction design (pas un bug). À dégraisser **au moment du self-serve** → 2 champs (email pro + SIRET), pré-remplir le reste depuis `pros` (données déjà en base). Risque mineur : honeypot `company` (ligne 105) potentiellement autofill par password managers.

**Conséquence** : rien à corriger côté code aujourd'hui. La 1ʳᵉ vente vient des **appels manuels**, pas d'un pro qui remplit ce form seul.

---

## 6. Next steps (par ordre)

1. **[Augustin]** Appeler les 17 pros joignables de `exports/liste_chaude_pitch.csv` (commencer par LT Confort). Viser 2-3 oui à 29 €.
2. **[au besoin, sur demande]** Préparer lien de paiement Stripe 29 €/an + mailing pré-rempli pour les joignables par email.
3. **[au besoin]** Enrichir la fiche PRO2BO (et les 24 sollicités injoignables) — pipeline coords existant : `scripts/enrich_*.py`, `scripts/geocode_pros.py`.
4. **[quand self-serve]** Dégraisser `candidater` à 2 champs + corriger le tracking `success` (beacon `sendBeacon` avant redirect).
5. **[hygiène data]** Filtrer les bots dans les dashboards maison (99 % du bruit) avant de piloter quoi que ce soit sur ces chiffres.
6. **[fallback]** Si 0 vente à ce volume → levier SEO : pousser les pages métier/dept (2,9 % → ouvrir un jour l'option pay-per-lead).

---

*Mémoire associée : `project_lobservatoiredespros_monetisation_29mai.md` dans le store mémoire global.*
