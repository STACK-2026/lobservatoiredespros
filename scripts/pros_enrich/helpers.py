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
    """True if `e` looks like a real contact email worth storing.
    Rejects junk extracted from text: short locals (le/la/de),
    non-whitelisted TLDs, image/asset patterns, noreply/test placeholders.
    """
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
    """Strip spaces/dots/dashes/parens. Convert 0X to +33X canonical form.

    Handles the French visual format '+33 (0) X' where (0) is a placeholder
    that must be dropped: +330XXXXXXXXX -> +33XXXXXXXXX (11 digits after +33).
    """
    digits = re.sub(r"[^\d+]", "", raw)
    if digits.startswith("+33"):
        suffix = digits[3:]
        # Drop leading 0 from visual placeholder '+33 (0) X...' format
        if suffix.startswith("0") and len(suffix) == 10:
            return "+33" + suffix[1:]
        return digits
    if digits.startswith("0033"):
        return "+33" + digits[4:]
    if digits.startswith("0") and len(digits) == 10:
        return "+33" + digits[1:]
    return digits
