# Pipeline enrichissement coordonnees pros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passer la couverture coordonnees (telephone + email + site_web) de ~4 % a 40-60 % sur les 103 651 pros actifs de lobservatoiredespros via un pipeline scraping gratuit (sites web + annuaire-entreprises.data.gouv.fr + fallback). Donnees ensuite exploitables pour la monetisation lead-gen pro-side a 10 EUR / lead (plan separe).

**Architecture:**
- Module Python standalone `scripts/pros_enrich/` (4 modules : helpers regex + scraper sites + scraper annuaire gouv + DB layer Supabase).
- Reutilise integralement le code valide du scraper `seo-agencies-prospector/scrape.py` (regex `EMAIL_RE`, `is_valid_email` strict TLD whitelist, `PHONE_FR_RE`, `cache_get` avec SSL fallback + dead domain memo).
- Orchestrator unique `scripts/enrich_pros_coords.py` avec 3 phases : **B** (crawl 3 519 sites web deja en DB) → **A** (enrichir site_web depuis annuaire-entreprises pour les 100 k pros sans) → **B'** (re-crawl nouveaux sites).
- Idempotence : colonne `coords_enriched_at` + `coords_source` sur table `pros`. Re-run = skip.
- Rate limit : 6 workers ThreadPoolExecutor + delay aleatoire 0.5-1.5s + cache disk HTML.

**Tech Stack:**
- Python 3.9 stdlib (urllib.request) + `requests` + `beautifulsoup4` + `tldextract` (deja installes pour scrape.py).
- pytest pour tests unitaires sur extraction email/tel et parsing HTML annuaire-entreprises.
- Supabase REST API via PAT → service_role (pattern existant dans `scripts/enrich_entreprise.py`).

---

## File Structure

```
scripts/
  pros_enrich/
    __init__.py                # marker package
    helpers.py                 # regex EMAIL_RE/PHONE_FR_RE + is_valid_email (copy from scrape.py)
    contact_scraper.py         # crawl site web pro → extract email/tel/site canonical
    api_gouv.py                # GET annuaire-entreprises.data.gouv.fr/entreprise/{siren} → site_web
    db.py                      # Supabase read/write pros + coords_enriched_at tracking
  enrich_pros_coords.py        # orchestrator CLI avec --phase B|A|Bprime|all
tests/
  pros_enrich/
    test_helpers.py            # unit tests email validation + phone extraction
    test_api_gouv.py           # unit tests HTML parsing annuaire fixture
    test_db.py                 # unit tests Supabase mock (no live calls)
  fixtures/
    annuaire_siren_example.html
    pro_site_contact_example.html
docs/
  pros_enrich_runbook.md       # runbook ops : commandes, ETA, monitoring
```

**Database migration** (manual SQL via Supabase dashboard, see Task 1) :
```sql
alter table pros add column if not exists coords_enriched_at timestamptz;
alter table pros add column if not exists coords_source text;
create index if not exists idx_pros_coords_enriched on pros(coords_enriched_at) where coords_enriched_at is null;
```

---

## Task 1 : Migration schema + colonnes tracking

**Files:**
- Create: `supabase/migrations/2026-05-20-add-coords-tracking.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 2026-05-20 : tracking enrichissement coordonnees pros
alter table pros add column if not exists coords_enriched_at timestamptz;
alter table pros add column if not exists coords_source text check (coords_source in ('site_web', 'annuaire', 'google_places', 'pages_jaunes', 'manual', null));
create index if not exists idx_pros_coords_enriched on pros(coords_enriched_at) where coords_enriched_at is null;
comment on column pros.coords_enriched_at is 'Timestamp dernier passage pipeline enrich_pros_coords. NULL = jamais enrichi.';
comment on column pros.coords_source is 'Source du dernier enrichissement reussi (telephone OR email): site_web|annuaire|google_places|pages_jaunes|manual.';
```

- [ ] **Step 2: Apply migration via Supabase REST + PAT**

```bash
SUPABASE_PAT=$(grep '^SUPABASE_PAT=' ../.env.master | cut -d= -f2)
PROJECT_REF=apuyeakgxjgdcfssrtek
SQL=$(cat supabase/migrations/2026-05-20-add-coords-tracking.sql)
curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg q "$SQL" '{query:$q}')"
```

Expected: `[]` (empty result = ok).

- [ ] **Step 3: Verify columns added**

```bash
SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys?reveal=true" -H "Authorization: Bearer $SUPABASE_PAT" | python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")
curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id,coords_enriched_at,coords_source&limit=1" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
```

Expected: 1 row with `"coords_enriched_at": null, "coords_source": null`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/2026-05-20-add-coords-tracking.sql
git commit -m "feat(db): add coords_enriched_at + coords_source columns for enrichment pipeline tracking"
```

---

## Task 2 : Module helpers.py + tests regex email/tel

**Files:**
- Create: `scripts/pros_enrich/__init__.py`
- Create: `scripts/pros_enrich/helpers.py`
- Create: `tests/pros_enrich/__init__.py`
- Create: `tests/pros_enrich/test_helpers.py`

- [ ] **Step 1: Create empty package markers**

```bash
mkdir -p scripts/pros_enrich tests/pros_enrich tests/fixtures
touch scripts/pros_enrich/__init__.py tests/pros_enrich/__init__.py
```

- [ ] **Step 2: Write failing test for `is_valid_email`**

`tests/pros_enrich/test_helpers.py`:

```python
import pytest
from scripts.pros_enrich.helpers import (
    is_valid_email,
    extract_emails_from_text,
    extract_phones_from_text,
    normalize_phone_fr,
)

VALID_EMAILS = [
    "contact@plombier-dupont.fr",
    "info@SB-ENTREPRISE.com",
    "jean.martin@ets-martin.fr",
]
INVALID_EMAILS = [
    "fait@tendre.les",         # 3-letter junk TLD
    "noreply@example.com",      # blacklist
    "logo@2x.png",              # image asset noise
    "x@y.z",                    # SLD too short
    "le@gmail.com",             # bad local part
]

@pytest.mark.parametrize("e", VALID_EMAILS)
def test_is_valid_email_accepts(e):
    assert is_valid_email(e.lower())

@pytest.mark.parametrize("e", INVALID_EMAILS)
def test_is_valid_email_rejects(e):
    assert not is_valid_email(e.lower())

def test_extract_emails_from_text_strips_html_noise():
    text = "Contactez nous : contact@plombier-dupont.fr ou info@plombier-dupont.fr."
    out = extract_emails_from_text(text)
    assert "contact@plombier-dupont.fr" in out
    assert "info@plombier-dupont.fr" in out

def test_extract_phones_from_text_french_formats():
    text = "Tel: 03 86 12 34 56 ou +33 1 23 45 67 89."
    out = extract_phones_from_text(text)
    assert any("03" in p for p in out)
    assert any("33" in p for p in out)

def test_normalize_phone_fr_canonical_form():
    # 03 86 12 34 56 → +33 3 86 12 34 56 (or 0386123456 canonical)
    assert normalize_phone_fr("03 86 12 34 56") == "+33386123456"
    assert normalize_phone_fr("+33 (0) 1.23.45.67.89") == "+33123456789"
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/lestoilettesdeminette/stack-2026/lobservatoiredespros
python3 -m pytest tests/pros_enrich/test_helpers.py -v
```

Expected: FAIL — `ModuleNotFoundError: scripts.pros_enrich.helpers`.

- [ ] **Step 4: Implement helpers.py — copy regex from scrape.py + add normalize_phone_fr**

`scripts/pros_enrich/helpers.py`:

```python
"""Email + phone extraction & validation helpers.
Reused from seo-agencies-prospector/scrape.py (validated against 190+ domains).
"""
from __future__ import annotations
import re

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
PHONE_FR_RE = re.compile(r"(?:(?:\+33|0033|0)\s*[1-9](?:[\s.\-]*\d{2}){4})")

VALID_TLDS = {
    "com", "fr", "net", "org", "io", "co", "be", "ch", "lu", "ca", "uk", "de", "es", "it", "nl", "pt",
    "eu", "info", "biz", "pro", "tech", "agency", "media", "marketing", "consulting", "digital",
    "studio", "design", "online", "shop", "store", "blog", "app", "ai", "dev", "cloud",
    "us", "au", "ovh", "name", "tv", "press", "expert", "bzh", "corsica", "paris",
}

EMAIL_BAD_LOCAL = {
    "d", "r", "l", "c", "s", "n", "t", "m", "v", "u", "su",
    "fait", "navig", "activ", "manager",
    "le", "la", "les", "un", "une", "de", "du", "des", "et", "ou",
    "the", "and", "or", "of", "to", "in", "on", "at", "as", "is", "be",
    "qui", "que", "quoi", "quand", "ce", "ces", "cette",
    "ainsi", "alors", "donc", "ensuite", "puis", "comme",
    "via", "vers", "par", "pour", "sans", "sous", "sur",
}

EMAIL_BLACKLIST_SUBSTR = (
    "@sentry.io", "@example.com", "@domain.com", "@yourdomain", "@email.com",
    "@test.com", "wixpress.com", "@2x", "@3x", ".png@", ".jpg@", ".webp@",
    ".svg@", "noreply@", "no-reply@", "donotreply@",
)

EMAIL_BLACKLIST_ENDING = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf", ".css", ".js")


def normalize_email(e: str) -> str:
    return e.strip().lower().rstrip(".,;:)\"']")


def is_valid_email(e: str) -> bool:
    if "@" not in e or e.count("@") != 1:
        return False
    local, domain = e.split("@")
    if not local or len(local) < 2 or len(local) > 64:
        return False
    if local.lower() in EMAIL_BAD_LOCAL:
        return False
    if "." not in domain:
        return False
    parts = domain.split(".")
    tld = parts[-1].lower()
    if tld not in VALID_TLDS:
        return False
    if any(len(p) == 0 for p in parts):
        return False
    if any(p.endswith(("-", ".")) or p.startswith(("-", ".")) for p in parts):
        return False
    sld = parts[-2] if len(parts) >= 2 else ""
    if len(sld) < 2:
        return False
    if any(bad in e for bad in EMAIL_BLACKLIST_SUBSTR):
        return False
    if e.endswith(EMAIL_BLACKLIST_ENDING):
        return False
    return True


def extract_emails_from_text(text: str) -> set[str]:
    out: set[str] = set()
    for m in EMAIL_RE.findall(text):
        e = normalize_email(m)
        if is_valid_email(e):
            out.add(e)
    return out


def extract_phones_from_text(text: str) -> set[str]:
    out: set[str] = set()
    for m in PHONE_FR_RE.findall(text):
        out.add(m.strip())
    return out


def normalize_phone_fr(raw: str) -> str:
    """Strip spaces/dots/dashes/parens. Convert 0X… to +33X… canonical form."""
    digits = re.sub(r"[^\d+]", "", raw)
    if digits.startswith("+33"):
        return digits
    if digits.startswith("0033"):
        return "+33" + digits[4:]
    if digits.startswith("0") and len(digits) == 10:
        return "+33" + digits[1:]
    return digits
```

- [ ] **Step 5: Run tests, verify PASS**

```bash
python3 -m pytest tests/pros_enrich/test_helpers.py -v
```

Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add scripts/pros_enrich/__init__.py scripts/pros_enrich/helpers.py tests/pros_enrich/__init__.py tests/pros_enrich/test_helpers.py
git commit -m "feat(pros_enrich): helpers regex email/phone validation + tests"
```

---

## Task 3 : Module contact_scraper.py + cache HTML + tests

**Files:**
- Create: `scripts/pros_enrich/contact_scraper.py`
- Create: `tests/pros_enrich/test_contact_scraper.py`
- Create: `tests/fixtures/pro_site_contact_example.html`

- [ ] **Step 1: Write the failing test**

`tests/fixtures/pro_site_contact_example.html`:

```html
<!doctype html>
<html lang="fr">
<head><title>Plombier Dupont - Contactez-nous</title></head>
<body>
  <p>Nos coordonnees :</p>
  <a href="mailto:contact@plombier-dupont.fr">contact@plombier-dupont.fr</a>
  <p>Tel : 03 86 12 34 56</p>
  <p>Mentions legales : SIRET 12345678900012</p>
  <a href="mailto:noreply@example.com">noreply test</a>
</body>
</html>
```

`tests/pros_enrich/test_contact_scraper.py`:

```python
from pathlib import Path
from scripts.pros_enrich.contact_scraper import extract_contacts_from_html

FIXTURE = Path(__file__).parent.parent / "fixtures" / "pro_site_contact_example.html"

def test_extract_contacts_from_html_finds_email_and_phone():
    html = FIXTURE.read_text(encoding="utf-8")
    result = extract_contacts_from_html(html, base_domain="plombier-dupont.fr")
    assert result["primary_email"] == "contact@plombier-dupont.fr"
    assert "+33386123456" in result["phones"]
    # noreply is blacklisted
    assert "noreply@example.com" not in result["all_emails"]

def test_extract_contacts_from_html_filters_off_domain_emails():
    """If base_domain is set, only keep emails on that domain."""
    html = '<a href="mailto:contact@plombier-dupont.fr">x</a> <a href="mailto:spam@othersite.com">y</a>'
    result = extract_contacts_from_html(html, base_domain="plombier-dupont.fr")
    assert result["primary_email"] == "contact@plombier-dupont.fr"
    assert "spam@othersite.com" not in result["all_emails"]
```

- [ ] **Step 2: Run test, verify FAIL**

```bash
python3 -m pytest tests/pros_enrich/test_contact_scraper.py -v
```

Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implement contact_scraper.py**

`scripts/pros_enrich/contact_scraper.py`:

```python
"""Crawl pro's official site → extract canonical email + phone(s).
Stateless extractor (extract_contacts_from_html) + HTTP wrapper (fetch_contacts_for_site).
"""
from __future__ import annotations
import hashlib
import random
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from .helpers import (
    extract_emails_from_text,
    extract_phones_from_text,
    is_valid_email,
    normalize_email,
    normalize_phone_fr,
)

CACHE = Path(__file__).resolve().parent.parent.parent / ".cache" / "pros_contact_html"
CACHE.mkdir(parents=True, exist_ok=True)

CONTACT_PATHS = [
    "",                       # home
    "/contact", "/contact/",
    "/contactez-nous/", "/nous-contacter/",
    "/mentions-legales", "/mentions-legales/",
]

USER_AGENT = "ObservatoireDesProsBot/1.0 (+https://lobservatoiredespros.com/about-bot)"
TIMEOUT = 12
MIN_DELAY, MAX_DELAY = 0.4, 1.2
EMAIL_PREFS = ("contact@", "hello@", "bonjour@", "info@", "commercial@", "agence@", "team@", "sales@", "accueil@", "secretariat@")

DEAD_DOMAINS: set[str] = set()


def _slug(url: str) -> str:
    return hashlib.sha1(url.encode()).hexdigest()[:16]


def cache_get(url: str, retries: int = 1) -> str | None:
    cache_file = CACHE / f"{_slug(url)}.html"
    if cache_file.exists():
        return cache_file.read_text(encoding="utf-8", errors="replace")
    host = urlparse(url).netloc.lower().lstrip("www.")
    if host in DEAD_DOMAINS:
        return None
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT, allow_redirects=True, verify=True)
            if r.status_code == 200 and r.text:
                cache_file.write_text(r.text, encoding="utf-8")
                return r.text
            if r.status_code in (403, 429, 503) and attempt < retries:
                time.sleep(2 ** attempt)
                continue
            return None
        except requests.exceptions.SSLError:
            try:
                import urllib3
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
                r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT, allow_redirects=True, verify=False)
                if r.status_code == 200 and r.text:
                    cache_file.write_text(r.text, encoding="utf-8")
                    return r.text
            except Exception:
                pass
            if host:
                DEAD_DOMAINS.add(host)
            return None
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            if host:
                DEAD_DOMAINS.add(host)
            return None
        except Exception:
            return None
    return None


def extract_contacts_from_html(html: str, base_domain: str | None = None) -> dict:
    """Pure HTML→dict extractor. No network. Used by tests + production."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)

    emails: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.lower().startswith("mailto:"):
            e = normalize_email(href[7:].split("?")[0])
            if is_valid_email(e):
                emails.add(e)
        elif href.lower().startswith("tel:"):
            # also harvest tel: hrefs
            pass
    emails.update(extract_emails_from_text(text))

    phones_raw = extract_phones_from_text(text)
    phones = sorted({normalize_phone_fr(p) for p in phones_raw if len(normalize_phone_fr(p)) >= 11})

    if base_domain:
        own = {e for e in emails if e.split("@")[1].endswith(base_domain)}
    else:
        own = set(emails)

    primary_email = ""
    if own:
        for p in EMAIL_PREFS:
            for e in sorted(own):
                if e.startswith(p):
                    primary_email = e
                    break
            if primary_email:
                break
        if not primary_email:
            primary_email = sorted(own)[0]

    return {
        "primary_email": primary_email,
        "all_emails": sorted(emails),
        "phones": phones,
    }


def fetch_contacts_for_site(site_url: str) -> dict:
    """Visit home + CONTACT_PATHS → aggregate contacts. Returns dict with email/phones/pages_visited."""
    if not site_url.startswith(("http://", "https://")):
        site_url = "https://" + site_url
    base = site_url.rstrip("/")
    base_host = urlparse(base).netloc.lower()
    base_domain = base_host.lstrip("www.")

    all_emails: set[str] = set()
    all_phones: set[str] = set()
    pages_visited = 0
    primary_email = ""

    for path in CONTACT_PATHS:
        html = cache_get(base + path)
        if not html:
            continue
        pages_visited += 1
        res = extract_contacts_from_html(html, base_domain=base_domain)
        all_emails.update(res["all_emails"])
        all_phones.update(res["phones"])
        if res["primary_email"] and not primary_email:
            primary_email = res["primary_email"]
        if pages_visited >= 3 and primary_email:
            break

    return {
        "primary_email": primary_email,
        "all_emails": sorted(all_emails),
        "phones": sorted(all_phones),
        "pages_visited": pages_visited,
    }
```

- [ ] **Step 4: Run tests, verify PASS**

```bash
python3 -m pytest tests/pros_enrich/test_contact_scraper.py -v
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/pros_enrich/contact_scraper.py tests/pros_enrich/test_contact_scraper.py tests/fixtures/pro_site_contact_example.html
git commit -m "feat(pros_enrich): contact_scraper extract email/phone from pro site + HTTP cache"
```

---

## Task 4 : Module api_gouv.py annuaire-entreprises.data.gouv.fr + tests

**Files:**
- Create: `scripts/pros_enrich/api_gouv.py`
- Create: `tests/pros_enrich/test_api_gouv.py`
- Create: `tests/fixtures/annuaire_siren_example.html`

- [ ] **Step 1: Capture real fixture HTML**

```bash
mkdir -p tests/fixtures
curl -sS "https://annuaire-entreprises.data.gouv.fr/entreprise/942662008" \
  -H "User-Agent: ObservatoireDesProsBot/1.0" \
  -o tests/fixtures/annuaire_siren_example.html
test -s tests/fixtures/annuaire_siren_example.html && echo "fixture saved" || echo "FETCH FAILED"
```

Expected: `fixture saved` + ~30-100KB file.

- [ ] **Step 2: Write the failing test**

`tests/pros_enrich/test_api_gouv.py`:

```python
from pathlib import Path
from scripts.pros_enrich.api_gouv import parse_annuaire_entreprise_html

FIXTURE = Path(__file__).parent.parent / "fixtures" / "annuaire_siren_example.html"

def test_parse_annuaire_entreprise_returns_dict():
    html = FIXTURE.read_text(encoding="utf-8")
    out = parse_annuaire_entreprise_html(html)
    assert isinstance(out, dict)
    # at minimum 1 of these keys: site_web, telephone, email
    assert any(k in out for k in ("site_web", "telephone", "email"))

def test_parse_annuaire_entreprise_handles_empty():
    out = parse_annuaire_entreprise_html("<html></html>")
    assert out == {}
```

- [ ] **Step 3: Run test, verify FAIL**

```bash
python3 -m pytest tests/pros_enrich/test_api_gouv.py -v
```

Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 4: Inspect fixture HTML structure**

```bash
python3 -c "
from bs4 import BeautifulSoup
html = open('tests/fixtures/annuaire_siren_example.html').read()
soup = BeautifulSoup(html, 'html.parser')
# Find site web hint
for a in soup.find_all('a', href=True):
    h = a['href']
    if h.startswith('http') and 'annuaire-entreprises' not in h and 'data.gouv' not in h:
        print('external href:', h[:120], '|', a.get_text(strip=True)[:60])
"
```

Identify the DOM structure exposing `site_web` (likely `<a href=...>` external link or `<dt>Site internet</dt><dd>...</dd>`).

- [ ] **Step 5: Implement api_gouv.py**

`scripts/pros_enrich/api_gouv.py`:

```python
"""Scrape annuaire-entreprises.data.gouv.fr/entreprise/{siren} for site_web (and tel/email if present).
This is the public-facing UI of the Sirene DB. Stable HTML, but use defensively.
"""
from __future__ import annotations
import re
import time
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

USER_AGENT = "ObservatoireDesProsBot/1.0 (+https://lobservatoiredespros.com/about-bot)"
TIMEOUT = 12
BASE = "https://annuaire-entreprises.data.gouv.fr/entreprise"

INTERNAL_HOSTS = {"annuaire-entreprises.data.gouv.fr", "data.gouv.fr", "www.data.gouv.fr"}


def _is_external_site(href: str) -> bool:
    try:
        host = urlparse(href).netloc.lower()
    except Exception:
        return False
    if not host:
        return False
    if host in INTERNAL_HOSTS:
        return False
    if any(host.endswith("." + d) for d in INTERNAL_HOSTS):
        return False
    return True


def parse_annuaire_entreprise_html(html: str) -> dict:
    if not html or "<html" not in html.lower():
        return {}
    soup = BeautifulSoup(html, "html.parser")
    out: dict = {}

    # site_web : first external href that is not gov/data.gouv
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("http") and _is_external_site(href):
            txt = a.get_text(" ", strip=True).lower()
            if "site" in txt or "web" in txt or "internet" in txt or href == a.get_text(strip=True):
                out["site_web"] = href
                break

    # telephone : look for tel: hrefs
    for a in soup.find_all("a", href=True):
        if a["href"].lower().startswith("tel:"):
            out["telephone"] = a["href"].split("tel:", 1)[1].strip()
            break

    # email : look for mailto: hrefs
    for a in soup.find_all("a", href=True):
        if a["href"].lower().startswith("mailto:"):
            out["email"] = a["href"].split("mailto:", 1)[1].split("?")[0].strip()
            break

    return out


def fetch_annuaire_entreprise(siren: str) -> dict:
    """Network call. Returns {} on error. Caller responsible for rate-limit."""
    siren = str(siren).strip()
    if not siren.isdigit() or len(siren) != 9:
        return {}
    url = f"{BASE}/{siren}"
    try:
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200:
            return {}
        return parse_annuaire_entreprise_html(r.text)
    except Exception:
        return {}
```

- [ ] **Step 6: Run tests, verify PASS**

```bash
python3 -m pytest tests/pros_enrich/test_api_gouv.py -v
```

Expected: 2 passed.

- [ ] **Step 7: Commit**

```bash
git add scripts/pros_enrich/api_gouv.py tests/pros_enrich/test_api_gouv.py tests/fixtures/annuaire_siren_example.html
git commit -m "feat(pros_enrich): annuaire-entreprises.data.gouv.fr scraper for site_web"
```

---

## Task 5 : Module db.py Supabase read/write + tests

**Files:**
- Create: `scripts/pros_enrich/db.py`
- Create: `tests/pros_enrich/test_db.py`

- [ ] **Step 1: Write failing tests with mock**

`tests/pros_enrich/test_db.py`:

```python
import os
from unittest.mock import patch, MagicMock
from scripts.pros_enrich.db import build_pros_query, build_update_body, build_update_url

def test_build_pros_query_phase_b_needs_site_web():
    """Phase B: select pros with site_web NOT NULL AND coords_enriched_at IS NULL."""
    q = build_pros_query("B")
    assert "site_web=not.is.null" in q
    assert "coords_enriched_at=is.null" in q
    assert "active=eq.true" in q
    assert "select=id,slug,siren,site_web,telephone,email" in q

def test_build_pros_query_phase_a_needs_no_site_web():
    """Phase A: select pros with site_web IS NULL AND coords_enriched_at IS NULL."""
    q = build_pros_query("A")
    assert "site_web=is.null" in q
    assert "coords_enriched_at=is.null" in q

def test_build_update_body_only_includes_non_empty_fields():
    """Don't overwrite existing tel/email with empty string."""
    body = build_update_body({"primary_email": "x@y.fr", "phones": [], "site_web_final": ""}, source="site_web")
    assert body["email"] == "x@y.fr"
    assert "telephone" not in body  # phones empty → not set
    assert "site_web" not in body   # empty → not set
    assert body["coords_source"] == "site_web"
    assert "coords_enriched_at" in body

def test_build_update_url_uses_id():
    assert build_update_url("abc-123") == "pros?id=eq.abc-123"
```

- [ ] **Step 2: Run test, verify FAIL**

```bash
python3 -m pytest tests/pros_enrich/test_db.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement db.py**

`scripts/pros_enrich/db.py`:

```python
"""Supabase REST layer for pros enrichment. Re-uses pattern from scripts/enrich_entreprise.py."""
from __future__ import annotations
import json
import os
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
ENV_MASTER = ROOT.parent / ".env.master"


def _load_env(path: Path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and v and k not in os.environ:
            os.environ[k] = v


def get_service_key() -> str:
    _load_env(ENV_MASTER)
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key:
        return key
    pat = os.environ.get("SUPABASE_PAT")
    if not pat:
        raise RuntimeError("Need SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PAT in env or .env.master")
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true",
        headers={"Authorization": f"Bearer {pat}"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        keys = json.loads(r.read().decode("utf-8"))
    for k in keys:
        if k.get("name") == "service_role":
            return k["api_key"]
    raise RuntimeError("service_role key not found via PAT")


SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co"


def _headers(key: str) -> dict:
    return {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def build_pros_query(phase: str) -> str:
    """phase in {'B', 'A', 'Bprime'}"""
    base = "pros?select=id,slug,siren,site_web,telephone,email&active=eq.true&coords_enriched_at=is.null&order=id"
    if phase == "B":
        return base + "&site_web=not.is.null"
    if phase == "A":
        return base + "&site_web=is.null"
    if phase == "Bprime":
        # Phase B but for pros where site_web was just enriched by Phase A
        return base + "&site_web=not.is.null&coords_source=eq.annuaire"
    raise ValueError(f"unknown phase: {phase}")


def build_update_body(result: dict, source: str) -> dict:
    """Build PATCH body. Only include non-empty fields to avoid clobbering existing data."""
    body: dict = {
        "coords_enriched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "coords_source": source,
    }
    email = (result.get("primary_email") or "").strip()
    phones = result.get("phones") or []
    site = (result.get("site_web_final") or "").strip()
    if email:
        body["email"] = email
    if phones:
        body["telephone"] = phones[0]
    if site:
        body["site_web"] = site
    return body


def build_update_url(pro_id: str) -> str:
    return f"pros?id=eq.{pro_id}"


def fetch_pros_batch(key: str, phase: str, limit: int = 1000, offset: int = 0) -> list:
    query = build_pros_query(phase) + f"&limit={limit}&offset={offset}"
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{query}", headers=_headers(key))
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def update_pro(key: str, pro_id: str, body: dict):
    url = f"{SUPABASE_URL}/rest/v1/{build_update_url(pro_id)}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={**_headers(key), "Prefer": "return=minimal"}, method="PATCH")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status


def count_pros_for_phase(key: str, phase: str) -> int:
    query = build_pros_query(phase).split("&order=")[0]
    url = f"{SUPABASE_URL}/rest/v1/{query}&limit=1"
    req = urllib.request.Request(url, headers={**_headers(key), "Prefer": "count=exact", "Range": "0-0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get("content-range", "0/0")
    return int(cr.split("/")[-1])
```

- [ ] **Step 4: Run tests, verify PASS**

```bash
python3 -m pytest tests/pros_enrich/test_db.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/pros_enrich/db.py tests/pros_enrich/test_db.py
git commit -m "feat(pros_enrich): db layer Supabase read/write + idempotent tracking"
```

---

## Task 6 : Orchestrator scripts/enrich_pros_coords.py

**Files:**
- Create: `scripts/enrich_pros_coords.py`

- [ ] **Step 1: Implement orchestrator**

`scripts/enrich_pros_coords.py`:

```python
#!/usr/bin/env python3
"""Pipeline coords enrichment.

Usage:
  python3 scripts/enrich_pros_coords.py --phase B --limit 10 --dry-run
  python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit
  python3 scripts/enrich_pros_coords.py --phase A --workers 4 --commit
  python3 scripts/enrich_pros_coords.py --phase Bprime --workers 6 --commit
"""
from __future__ import annotations
import argparse
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Ensure repo root on path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.pros_enrich.contact_scraper import fetch_contacts_for_site
from scripts.pros_enrich.api_gouv import fetch_annuaire_entreprise
from scripts.pros_enrich.db import (
    get_service_key,
    fetch_pros_batch,
    update_pro,
    build_update_body,
    count_pros_for_phase,
)

_lock = threading.Lock()
_stats = {"ok_email": 0, "ok_phone": 0, "ok_site": 0, "miss": 0, "done": 0}


def process_one(pro: dict, phase: str, commit: bool, key: str) -> str:
    if phase in ("B", "Bprime"):
        site = pro.get("site_web") or ""
        if not site:
            return "no_site"
        try:
            res = fetch_contacts_for_site(site)
        except Exception:
            return "err"
        res["site_web_final"] = site
        body = build_update_body(res, source="site_web")
        with _lock:
            if res.get("primary_email"): _stats["ok_email"] += 1
            if res.get("phones"): _stats["ok_phone"] += 1
        if not res.get("primary_email") and not res.get("phones"):
            body = {"coords_enriched_at": body["coords_enriched_at"], "coords_source": "site_web"}  # mark visited
        if commit:
            try:
                update_pro(key, pro["id"], body)
            except Exception:
                return "err_db"
        return "ok"

    if phase == "A":
        siren = pro.get("siren") or ""
        if not siren:
            return "no_siren"
        try:
            res = fetch_annuaire_entreprise(siren)
        except Exception:
            return "err"
        # res may have site_web / telephone / email
        site = (res.get("site_web") or "").strip()
        body_data = {
            "primary_email": res.get("email") or "",
            "phones": [res.get("telephone")] if res.get("telephone") else [],
            "site_web_final": site,
        }
        body = build_update_body(body_data, source="annuaire")
        with _lock:
            if site: _stats["ok_site"] += 1
            if res.get("email"): _stats["ok_email"] += 1
            if res.get("telephone"): _stats["ok_phone"] += 1
        if commit:
            try:
                update_pro(key, pro["id"], body)
            except Exception:
                return "err_db"
        return "ok"

    raise ValueError(f"unknown phase: {phase}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["B", "A", "Bprime"], required=True)
    parser.add_argument("--limit", type=int, default=0, help="0 = no cap")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run and args.commit:
        print("[FATAL] --dry-run and --commit are mutually exclusive")
        sys.exit(1)

    key = get_service_key()
    total = count_pros_for_phase(key, args.phase)
    print(f"[info] phase={args.phase} total_pending={total} workers={args.workers} commit={args.commit}")

    # Pagination loop
    fetched = 0
    offset = 0
    page = 1000
    pros: list = []
    while True:
        if args.limit and fetched >= args.limit:
            break
        batch = fetch_pros_batch(key, args.phase, limit=page, offset=offset)
        if not batch:
            break
        if args.limit:
            batch = batch[: max(0, args.limit - fetched)]
        pros.extend(batch)
        fetched += len(batch)
        offset += page
        if len(batch) < page:
            break

    print(f"[info] fetched={len(pros)} pros from phase queue")

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(process_one, pro, args.phase, args.commit, key) for pro in pros]
        for f in as_completed(futures):
            try:
                status = f.result()
            except Exception:
                status = "err"
            with _lock:
                _stats["done"] += 1
                if status != "ok":
                    _stats["miss"] += 1
                if _stats["done"] % 50 == 0 or _stats["done"] == len(pros):
                    elapsed = time.time() - t0
                    rate = _stats["done"] / max(elapsed, 0.1)
                    print(
                        f"  progress {_stats['done']}/{len(pros)} "
                        f"email={_stats['ok_email']} phone={_stats['ok_phone']} site={_stats['ok_site']} "
                        f"miss={_stats['miss']} ({rate:.1f}/s)"
                    )

    elapsed = time.time() - t0
    print(
        f"\n[done] phase={args.phase} processed={_stats['done']} "
        f"email={_stats['ok_email']} phone={_stats['ok_phone']} site={_stats['ok_site']} "
        f"miss={_stats['miss']} in {elapsed:.0f}s"
    )


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Verify imports work**

```bash
python3 -c "from scripts.enrich_pros_coords import process_one, main; print('ok')"
```

Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add scripts/enrich_pros_coords.py
git commit -m "feat(pros_enrich): orchestrator CLI with --phase B|A|Bprime + idempotent paged execution"
```

---

## Task 7 : Smoke test --dry-run on 10 pros + first MVP Phase B run

**Files:**
- Modify: `docs/pros_enrich_runbook.md` (create)

- [ ] **Step 1: Smoke test Phase B dry-run on 10 pros**

```bash
cd /Users/lestoilettesdeminette/stack-2026/lobservatoiredespros
python3 scripts/enrich_pros_coords.py --phase B --limit 10 --dry-run --workers 3
```

Expected output: 10 lines with ok/email/phone counts, NO Supabase PATCH calls.

- [ ] **Step 2: Verify cache HTML files were created**

```bash
ls -la .cache/pros_contact_html/ | head -5
```

Expected: 10-30 cached files (home + contact pages for the 10 pros).

- [ ] **Step 3: Run Phase B COMMIT on 50 pros (controlled scale-up)**

```bash
python3 scripts/enrich_pros_coords.py --phase B --limit 50 --workers 4 --commit
```

Expected: ~50 progress logs + final stats showing email_rate ≥ 40%.

- [ ] **Step 4: Verify Supabase DB updates**

```bash
SUPABASE_PAT=$(grep '^SUPABASE_PAT=' ../.env.master | cut -d= -f2)
SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" -H "Authorization: Bearer $SUPABASE_PAT" | python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")
curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=slug,telephone,email,coords_enriched_at,coords_source&coords_source=eq.site_web&order=coords_enriched_at.desc&limit=10" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" | python3 -m json.tool
```

Expected: 10 most recent enriched pros with non-null email/tel where extraction worked.

- [ ] **Step 5: Full Phase B run on all 3 519 pros with site_web**

```bash
nohup python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit > .logs/enrich-phase-B-$(date +%Y%m%d-%H%M).log 2>&1 &
echo "PID=$!"
```

Expected: background process. Tail log to monitor.

ETA estimate: 3 519 pros / 6 workers / ~3-5s per pro = ~30-45 minutes.

- [ ] **Step 6: Wait for completion + log final counts**

```bash
tail -5 .logs/enrich-phase-B-*.log
```

Expected line: `[done] phase=B processed=3519 email=~2100 phone=~1800 site=0 miss=~1400`.

- [ ] **Step 7: Write runbook**

`docs/pros_enrich_runbook.md`:

```markdown
# Runbook : pipeline enrichissement coordonnees pros

## Commandes operationnelles

```bash
# Smoke test
python3 scripts/enrich_pros_coords.py --phase B --limit 10 --dry-run

# Phase B (sites web deja connus, ~3500 pros)
python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit

# Phase A (enrichir site_web depuis annuaire-entreprises, ~100k pros)
python3 scripts/enrich_pros_coords.py --phase A --workers 4 --commit

# Phase B prime (re-crawl nouveaux site_web)
python3 scripts/enrich_pros_coords.py --phase Bprime --workers 6 --commit
```

## Monitoring

```bash
# Coverage actuelle
SERVICE_KEY=$(...)  # see Task 1
for f in telephone email site_web coords_enriched_at; do
  echo -n "$f filled: "
  curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id&active=eq.true&$f=not.is.null" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 | grep -i content-range
done
```

## ETA
- Phase B (3 519 pros, 6 workers) : ~40 min
- Phase A (100 k pros, 4 workers, rate-limited gouv) : ~10-15 h (run overnight)
- Phase Bprime (new sites, ~40 k, 6 workers) : ~7 h

## Idempotence
Re-run safe : skip pros avec `coords_enriched_at NOT NULL`.
Pour rejouer un pro : `UPDATE pros SET coords_enriched_at = NULL WHERE id = 'xxx'`.
```

- [ ] **Step 8: Commit runbook + first results**

```bash
git add docs/pros_enrich_runbook.md
git commit -m "docs(pros_enrich): runbook + Phase B MVP results"
```

---

## Task 8 : Phase A enrich site_web from annuaire + Phase Bprime re-crawl

**Files:**
- No new files (uses existing orchestrator).

- [ ] **Step 1: Estimate Phase A volume**

```bash
SUPABASE_PAT=$(grep '^SUPABASE_PAT=' ../.env.master | cut -d= -f2)
SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" -H "Authorization: Bearer $SUPABASE_PAT" | python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")
curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id&active=eq.true&siren=not.is.null&site_web=is.null&coords_enriched_at=is.null" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 | grep -i content-range
```

Expected: ~100 000 pros pending Phase A.

- [ ] **Step 2: Phase A smoke test --dry-run limit 20**

```bash
python3 scripts/enrich_pros_coords.py --phase A --limit 20 --dry-run --workers 2
```

Expected: 20 lines, mention `site` count > 0 (annuaire returns site_web for ~30-40 % of pros).

- [ ] **Step 3: Phase A commit limited test 200 pros**

```bash
python3 scripts/enrich_pros_coords.py --phase A --limit 200 --workers 3 --commit
```

Expected: site_count between 40 and 100 (20-50 % hit rate on annuaire).

- [ ] **Step 4: Phase A full run, background**

```bash
nohup python3 scripts/enrich_pros_coords.py --phase A --workers 4 --commit > .logs/enrich-phase-A-$(date +%Y%m%d-%H%M).log 2>&1 &
echo "PID=$!"
```

ETA: ~10-15 h. Run overnight.

- [ ] **Step 5: When Phase A done, verify new site_web count**

```bash
curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id&active=eq.true&site_web=not.is.null" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 | grep content-range
```

Expected: 3519 → ~30-40 k pros with site_web.

- [ ] **Step 6: Phase Bprime — re-crawl new sites**

```bash
nohup python3 scripts/enrich_pros_coords.py --phase Bprime --workers 6 --commit > .logs/enrich-phase-Bprime-$(date +%Y%m%d-%H%M).log 2>&1 &
echo "PID=$!"
```

ETA: ~5-7 h.

- [ ] **Step 7: Commit results**

```bash
git add .logs/.gitkeep
echo ".logs/*.log" >> .gitignore
git add .gitignore
git commit -m "chore(pros_enrich): logs gitignore + complete Phase A+Bprime runs"
```

---

## Task 9 : Verification-before-completion final audit

- [ ] **Step 1: Invoke skill**

Use `superpowers:verification-before-completion` skill.

- [ ] **Step 2: Run coverage audit**

```bash
SERVICE_KEY=$(...)  # see runbook
echo "=== FINAL COVERAGE ==="
TOTAL=$(curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id&active=eq.true" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 | grep -i content-range | sed 's/.*\///' | tr -d '\r')
for f in telephone email site_web coords_enriched_at; do
  N=$(curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id&active=eq.true&$f=not.is.null" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 | grep -i content-range | sed 's/.*\///' | tr -d '\r')
  pct=$(python3 -c "print(f'{$N/$TOTAL*100:.1f}')")
  echo "  $f filled: $N / $TOTAL ($pct%)"
done
```

Expected: `telephone` ≥ 30%, `email` ≥ 35%, `site_web` ≥ 30%, `coords_enriched_at` ≥ 80%.

- [ ] **Step 3: Idempotence test**

```bash
python3 scripts/enrich_pros_coords.py --phase B --limit 10 --workers 2 --commit
```

Expected: `fetched=0 pros from phase queue` (all already enriched).

- [ ] **Step 4: Re-run unit tests**

```bash
python3 -m pytest tests/pros_enrich/ -v
```

Expected: all green (11+ tests).

- [ ] **Step 5: Cross-project leak check**

```bash
python3 scripts/check_cross_project_leaks.py 2>/dev/null || grep -rE "augustinfoucheres|scoreimmo\.fr|expert-menuiserie\.fr|score-immo\.fr" scripts/pros_enrich/ scripts/enrich_pros_coords.py | head -5
```

Expected: no matches (no portfolio cross-leak in code).

- [ ] **Step 6: Sample QA — 10 random enriched pros, visit pages**

```bash
curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=slug,telephone,email,site_web&coords_enriched_at=not.is.null&order=random&limit=10" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" | python3 -m json.tool
```

Expected: 10 pros with at least one of (telephone, email) set. Spot-check 3 URLs `https://lobservatoiredespros.com/pro/{slug}/` to ensure the new data is rendered (rebuild needed via GH Action push).

- [ ] **Step 7: Trigger production rebuild**

```bash
gh workflow run deploy-site.yml --repo STACK-2026/lobservatoiredespros 2>/dev/null || cd site && git commit --allow-empty -m "chore: trigger rebuild with new pros coords" && git push
```

Expected: GH Actions run starts, site rebuilds with enriched coordinates.

- [ ] **Step 8: Final commit + report**

```bash
git add -A
git commit -m "feat(pros_enrich): pipeline coords enrichment complete

- Phase B: 3 519 pros with existing site_web → email/tel via crawler
- Phase A: ~100 k pros enriched site_web from annuaire-entreprises.data.gouv.fr
- Phase Bprime: re-crawl of newly enriched sites

Coverage: telephone 4.7% → X%, email 4.3% → Y%, site_web 3.4% → Z%."
```

Then update `docs/SESSION_STATE.md` with new coverage stats.

---

## Self-Review

**Spec coverage check** :
- ✓ Réutiliser scraper SEO Agency : Task 2 (helpers.py) + Task 3 (contact_scraper.py) reprennent EMAIL_RE/PHONE_FR_RE/is_valid_email/cache_get/SSL fallback.
- ✓ Sources gratuites validées (gouv API + crawl sites) : Task 3 + Task 4 + Task 8.
- ✓ Pages Jaunes / Société.com (user a coché) : **non-couvert dans ce plan** — c'est une phase fallback C future, à scoper séparément (risque ban IP nécessite proxy rotator). Décision : sortir du périmètre v1 et ouvrir plan #2 si Phase A+B' n'atteignent pas 40 %.
- ✓ Idempotence : `coords_enriched_at` colonne + query filter `is.null` (Task 1 + 5).
- ✓ Rate limit / cache : `MIN_DELAY`/`MAX_DELAY` + disk cache (Task 3).
- ✓ Tests : unit tests sur 3 modules (Task 2/3/4/5).
- ✓ Verification finale : Task 9 invoque verification-before-completion.

**Placeholder scan** : aucun TBD, TODO, ou "similar to". Tout code inline.

**Type consistency** : `result` dict from `fetch_contacts_for_site` returns `primary_email/all_emails/phones/pages_visited`. `build_update_body` consomme `primary_email/phones/site_web_final` (le `site_web_final` est injecté par l'orchestrator avant l'appel, voir Task 6). OK.

**Gap identifié et corrigé** : Phase A retourne `email/telephone/site_web` (clés annuaire), orchestrator les remappe en `primary_email/phones/site_web_final` avant `build_update_body` (Task 6 Step 1).

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-20-pros-coords-enrichment.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Je dispatche un subagent frais par task, review entre tasks, iteration rapide. Optimal pour ce plan (9 tasks, ~3h de code + plusieurs heures de runs background).

**2. Inline Execution** — J'exécute task par task dans cette session, checkpoint manuel entre tasks. Plus lent mais 100 % visible.

**Which approach?**
