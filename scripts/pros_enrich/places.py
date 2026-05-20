"""Google Places API (NEW) Text Search Pro wrapper.

Returns nationalPhoneNumber + websiteUri + formattedAddress for a pro
matched by name + ville + code_postal.

Pricing : 32 USD / 1000 calls. Free tier 200 USD / month = 6 250 calls / month.
Designed for slow-cadence "escargot" runs ranked by score_confiance.

Anti-burn rules :
  - Hard cap on call count per run (caller passes --limit)
  - 0.3s delay between calls (well below Google's 60 QPS limit)
  - Skip pros with empty name or city
  - Match quality filter : only return result if displayName matches pro nom
    OR formattedAddress matches code_postal (avoid grabbing wrong business)
"""
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


_load_env(ENV_MASTER)

API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.businessStatus",
])

MIN_DELAY = 0.3
USER_AGENT = "ObservatoireDesProsBot/1.0"


def build_query(pro: dict) -> str:
    """Build Places text query from pro fields.

    Strategy : '{nom_entreprise} {code_postal} {ville}' produces best match.
    Fallback : '{nom_entreprise} {ville}'.
    """
    nom = (pro.get("nom_entreprise") or "").strip()
    ville = (pro.get("ville") or "").strip()
    cp = (pro.get("code_postal") or "").strip()
    if not nom:
        return ""
    parts = [nom]
    if cp:
        parts.append(cp)
    if ville:
        parts.append(ville)
    return " ".join(parts)


def is_good_match(pro: dict, place: dict) -> bool:
    """Filter false positives. Confirm match by either :
      - displayName contains a token from pro.nom_entreprise (>=3 chars), OR
      - formattedAddress contains pro.code_postal
    """
    nom = (pro.get("nom_entreprise") or "").lower()
    cp = (pro.get("code_postal") or "").strip()
    addr = (place.get("formattedAddress") or "").lower()
    name = (place.get("displayName") or {}).get("text", "").lower()
    if cp and cp in addr:
        return True
    if name and nom:
        nom_tokens = {t for t in nom.split() if len(t) >= 3}
        for t in nom_tokens:
            if t in name:
                return True
    return False


def normalize_phone_from_places(place: dict) -> str:
    """Prefer international (already +33...) over national."""
    intl = (place.get("internationalPhoneNumber") or "").strip()
    if intl:
        return intl.replace(" ", "")
    nat = (place.get("nationalPhoneNumber") or "").strip()
    if not nat:
        return ""
    digits = "".join(c for c in nat if c.isdigit())
    if len(digits) == 10 and digits.startswith("0"):
        return "+33" + digits[1:]
    return nat


def looks_like_official_site(uri: str, pro: dict) -> bool:
    """Reject obvious non-official URIs : Facebook, Instagram, LinkedIn,
    annuaire sites, etc. We only want the pro's own domain."""
    if not uri:
        return False
    lc = uri.lower()
    banned = (
        "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com",
        "youtube.com", "tiktok.com", "yelp.com", "tripadvisor.",
        "pagesjaunes.fr", "annuaire-", "societe.com", "verif.com",
        "qualit-enr.org", "qualibat.com",
    )
    if any(b in lc for b in banned):
        return False
    return True


def search_pro(pro: dict, api_key: str = "") -> dict:
    """Hit Places NEW Text Search Pro. Returns dict :
      {primary_email: "", phones: [...], site_web_final: "...", matched: bool, place_id: "..."}
    primary_email always empty (Places does not expose email).
    """
    key = api_key or API_KEY
    if not key:
        return {"primary_email": "", "phones": [], "site_web_final": "", "matched": False, "place_id": ""}
    query = build_query(pro)
    if not query:
        return {"primary_email": "", "phones": [], "site_web_final": "", "matched": False, "place_id": ""}
    body = json.dumps({"textQuery": query, "languageCode": "fr", "regionCode": "FR"}).encode("utf-8")
    req = urllib.request.Request(
        SEARCH_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": FIELD_MASK,
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    time.sleep(MIN_DELAY)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
    except Exception:
        return {"primary_email": "", "phones": [], "site_web_final": "", "matched": False, "place_id": ""}
    places = data.get("places") or []
    if not places:
        return {"primary_email": "", "phones": [], "site_web_final": "", "matched": False, "place_id": ""}
    # Pick first result that passes the match filter (defensively)
    for place in places:
        if not is_good_match(pro, place):
            continue
        if place.get("businessStatus") in ("CLOSED_PERMANENTLY", "CLOSED_TEMPORARILY"):
            continue
        phone = normalize_phone_from_places(place)
        site = place.get("websiteUri") or ""
        if not looks_like_official_site(site, pro):
            site = ""
        return {
            "primary_email": "",
            "phones": [phone] if phone else [],
            "site_web_final": site,
            "matched": True,
            "place_id": place.get("id", ""),
        }
    return {"primary_email": "", "phones": [], "site_web_final": "", "matched": False, "place_id": ""}
