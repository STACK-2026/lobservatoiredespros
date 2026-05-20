"""Scrape annuaire-entreprises.data.gouv.fr/entreprise/{siren} for site_web (and tel/email if present).
This is the public-facing UI of the Sirene DB. Stable HTML, but use defensively.

NOTE: as of 2026, annuaire-entreprises does NOT publish private contact info (telephone,
email, site_web) for most SMEs. The recherche-entreprises API only exposes legal/administrative
data. This parser returns {} for most real SIREN pages. It is retained for defensive coverage
in case the site begins exposing such data, and for completeness of the enrichment pipeline.
"""
from __future__ import annotations
import re
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

USER_AGENT = "ObservatoireDesProsBot/1.0 (+https://lobservatoiredespros.com/about-bot)"
TIMEOUT = 12
BASE = "https://annuaire-entreprises.data.gouv.fr/entreprise"

# Domains that are NOT the pro's site (they are gov, social, or analytics links appearing in footer/nav)
INTERNAL_HOSTS = {
    "annuaire-entreprises.data.gouv.fr",
    "data.gouv.fr",
    "www.data.gouv.fr",
    "github.com",
    "etalab.gouv.fr",
    "www.etalab.gouv.fr",
    "service-public.fr",
    "www.service-public.fr",
    "numerique.gouv.fr",
    "www.numerique.gouv.fr",
    "entreprises.gouv.fr",
    "www.entreprises.gouv.fr",
    "economie.gouv.fr",
    "www.economie.gouv.fr",
    "legifrance.gouv.fr",
    "twitter.com",
    "x.com",
    "facebook.com",
    "www.facebook.com",
    "linkedin.com",
    "www.linkedin.com",
    "youtube.com",
    "www.youtube.com",
    "instagram.com",
    "www.instagram.com",
    "matomo.org",
    "googletagmanager.com",
    "support.google.com",
    "support.mozilla.org",
    "www.apple.com",
    "support.microsoft.com",
}


def _is_external_site(href: str) -> bool:
    """Return True if href points to an external pro site (not a gov/social/analytics host)."""
    try:
        host = urlparse(href).netloc.lower().strip()
    except Exception:
        return False
    if not host:
        return False
    # Normalize www prefix for comparison
    host_no_www = host[4:] if host.startswith("www.") else host
    if host in INTERNAL_HOSTS or host_no_www in INTERNAL_HOSTS:
        return False
    # Reject subdomains of blocked hosts (e.g. api.data.gouv.fr)
    for blocked in INTERNAL_HOSTS:
        if host_no_www.endswith("." + blocked):
            return False
    return True


def parse_annuaire_entreprise_html(html: str) -> dict:
    """Parse the HTML of an annuaire-entreprises page and extract site_web, telephone, email.

    Returns a dict with zero or more of the keys: site_web, telephone, email.
    Returns {} if the page contains no contact data or if the input is invalid.
    Never raises.
    """
    if not html:
        return {}
    # Require at minimum a recognizable HTML tag to avoid treating garbage as HTML
    if "<html" not in html.lower() and "<body" not in html.lower() and "<table" not in html.lower():
        return {}

    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        return {}

    out: dict = {}

    # site_web: prefer link with text hint like "site internet", "site web", or "site du"
    # Also accept a link whose visible text IS the URL (e.g. "www.plombier-dupont.fr")
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not (href.startswith("http") and _is_external_site(href)):
            continue
        txt = a.get_text(" ", strip=True).lower()
        # Text-based hint
        if "site" in txt or "web" in txt or "internet" in txt:
            out["site_web"] = href
            break
        # URL-as-text pattern: visible text looks like a domain
        visible = a.get_text(strip=True).lower().lstrip("www.")
        url_host = urlparse(href).netloc.lower().lstrip("www.")
        if visible and url_host and url_host.startswith(visible[:8]):
            out["site_web"] = href
            break

    # telephone: look for tel: hrefs
    for a in soup.find_all("a", href=True):
        raw = a["href"]
        if raw.lower().startswith("tel:"):
            number = raw.split(":", 1)[1].strip()
            if number:
                out["telephone"] = number
                break

    # email: look for mailto: hrefs
    for a in soup.find_all("a", href=True):
        raw = a["href"]
        if raw.lower().startswith("mailto:"):
            address = raw.split(":", 1)[1].split("?")[0].strip()
            if address:
                out["email"] = address
                break

    return out


def fetch_annuaire_entreprise(siren: str) -> dict:
    """Fetch and parse the annuaire-entreprises page for a given SIREN.

    Network call. Returns {} on any error (HTTP error, bot protection, timeout).
    Caller is responsible for rate-limiting.
    """
    siren = str(siren).strip()
    if not re.fullmatch(r"\d{9}", siren):
        return {}
    url = f"{BASE}/{siren}"
    try:
        r = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=TIMEOUT,
            allow_redirects=True,
        )
        if r.status_code != 200:
            return {}
        # Bail early if blocked by Incapsula/Baleen (bot protection)
        if "Incapsula" in r.text or "blnChallengeStore" in r.text:
            return {}
        return parse_annuaire_entreprise_html(r.text)
    except Exception:
        return {}
