"""Crawl pro's official site, extract canonical email + phone(s).
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
    """Pure HTML to dict extractor. No network. Used by tests and production.

    Args:
        html: Raw HTML string to parse.
        base_domain: When set, primary_email is selected only from emails
            whose domain ends with this value. all_emails still contains
            every valid non-blacklisted email found.

    Returns:
        dict with keys: primary_email (str), all_emails (list), phones (list).
    """
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
    emails.update(extract_emails_from_text(text))

    phones_raw = extract_phones_from_text(text)
    phones = sorted({normalize_phone_fr(p) for p in phones_raw if len(normalize_phone_fr(p)) >= 11})

    if base_domain:
        own = {
            e for e in emails
            if e.split("@")[1] == base_domain or e.split("@")[1].endswith("." + base_domain)
        }
        display_emails = sorted(own)
    else:
        own = set(emails)
        display_emails = sorted(emails)

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
        "all_emails": display_emails,
        "phones": phones,
    }


def fetch_contacts_for_site(site_url: str) -> dict:
    """Visit home + CONTACT_PATHS, aggregate contacts.

    Returns dict with keys: primary_email, all_emails, phones, pages_visited.
    Stops early when primary_email is found and at least 3 pages have been visited.
    """
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
