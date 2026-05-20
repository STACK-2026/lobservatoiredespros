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
    """Build a PostgREST query string for fetching pros by enrichment phase.

    phase in {'A', 'B', 'Bprime'}:
      A      - site_web IS NULL (no known website, enrich from annuaire)
      B      - site_web NOT NULL (website known, scrape for contact)
      Bprime - site_web NOT NULL AND coords_source=annuaire (re-crawl after Phase A)
    """
    base = (
        "pros"
        "?select=id,slug,siren,site_web,telephone,email"
        "&active=eq.true"
        "&coords_enriched_at=is.null"
        "&order=id"
    )
    if phase == "B":
        return base + "&site_web=not.is.null"
    if phase == "A":
        return base + "&site_web=is.null"
    if phase == "Bprime":
        # Re-crawl pros whose site_web was discovered in Phase A (source=annuaire)
        return base + "&site_web=not.is.null&coords_source=eq.annuaire"
    raise ValueError(f"unknown phase: {phase}")


def build_update_body(result: dict, source: str) -> dict:
    """Build PATCH body from enrichment result.

    Only includes non-empty fields to avoid clobbering existing data in Supabase.
    coords_enriched_at is always set so a second run won't re-process this pro.
    """
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
    """Return PostgREST resource path for a single pro PATCH."""
    return f"pros?id=eq.{pro_id}"


def fetch_pros_batch(key: str, phase: str, limit: int = 1000, offset: int = 0) -> list:
    """Fetch a paginated batch of pros for the given phase."""
    query = build_pros_query(phase) + f"&limit={limit}&offset={offset}"
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{query}", headers=_headers(key))
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def update_pro(key: str, pro_id: str, body: dict):
    """PATCH a single pro row with enrichment results. Returns HTTP status code."""
    url = f"{SUPABASE_URL}/rest/v1/{build_update_url(pro_id)}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={**_headers(key), "Prefer": "return=minimal"},
        method="PATCH",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status


def count_pros_for_phase(key: str, phase: str) -> int:
    """Return total count of pros matching the given phase filter."""
    query = build_pros_query(phase).split("&order=")[0]
    url = f"{SUPABASE_URL}/rest/v1/{query}&limit=1"
    req = urllib.request.Request(
        url,
        headers={**_headers(key), "Prefer": "count=exact", "Range": "0-0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get("content-range", "0/0")
    return int(cr.split("/")[-1])
