#!/usr/bin/env python3
"""E2E test for the L'Observatoire des Pros avis system (Phase 6, Task 16).

Tests both flows:
  A. publie immediate  : pro WITHOUT artisan email + verdict=oui/short
                         submit -> verif -> status=publie -> displayed on /pro/<slug>/
  B. preavis 48h       : pro WITH artisan email + verdict=non/long
                         submit -> verif -> status=en_attente_preavis_artisan
                         then hit /r/<token> preview + POST /r/<token>/repondre

Marker-based isolation: pseudos are E2E_TEST_<ts>_A and E2E_TEST_<ts>_B,
emails are e2e+a_<ts>@kingsley2.com / e2e+b_<ts>@kingsley2.com.
Cleanup removes all rows matching the markers from pro_avis +
pro_avis_responses + pro_response_tokens at the end.

Required env (loaded from ~/stack-2026/.env.master):
  SUPABASE_PAT  - Supabase management PAT (to retrieve service_role)
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

PROD_URL = "https://lobservatoiredespros.com"
PROJECT_REF = "apuyeakgxjgdcfssrtek"
PILOT_SLUG_NO_EMAIL = "caro-renov-colombes"
ENV_FILE = Path("/Users/lestoilettesdeminette/stack-2026/.env.master")
MARKER = int(time.time())

# ---------- env + supabase helpers ----------


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text().splitlines():
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        return None  # disables auto-redirect


def http(method: str, url: str, headers: dict[str, str] | None = None,
         body: bytes | str | None = None, allow_redirects: bool = True,
         expect_status: tuple[int, ...] | None = None) -> tuple[int, str, dict[str, str]]:
    if isinstance(body, str):
        body = body.encode("utf-8")
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("User-Agent", "lobservatoire-e2e/1.0 (Python urllib)")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    opener = (
        urllib.request.build_opener()
        if allow_redirects
        else urllib.request.build_opener(_NoRedirect)
    )
    try:
        with opener.open(req, timeout=20) as r:
            status = r.status
            text = r.read().decode("utf-8", errors="ignore")
            resp_headers = {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        status = e.code
        text = e.read().decode("utf-8", errors="ignore")
        resp_headers = {k.lower(): v for k, v in e.headers.items()}
    if expect_status and status not in expect_status:
        raise RuntimeError(f"{method} {url} -> {status} (expected {expect_status}): {text[:300]}")
    return status, text, resp_headers


def get_service_role_key(pat: str) -> str:
    # Without ?reveal=true, the legacy service_role JWT is returned in full
    # (only the newer sb_secret_* secret-type key is masked).
    status, text, _ = http(
        "GET",
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys",
        headers={"Authorization": f"Bearer {pat}"},
        expect_status=(200,),
    )
    keys = json.loads(text)
    for k in keys:
        if k.get("name") == "service_role" and k.get("type") == "legacy":
            return k["api_key"]
    raise RuntimeError("legacy service_role key not found")


def sb_query(service_key: str, sql: str) -> list[dict]:
    """Run raw SQL via Supabase REST PostgREST RPC."""
    raise NotImplementedError("use sb_rest instead")


def sb_rest(service_key: str, method: str, path: str,
            body: dict | None = None, prefer: str | None = None) -> tuple[int, list | dict]:
    url = f"https://{PROJECT_REF}.supabase.co/rest/v1/{path}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    raw_body = json.dumps(body).encode("utf-8") if body is not None else None
    status, text, _ = http(method, url, headers=headers, body=raw_body)
    data = json.loads(text) if text and text.strip().startswith(("[", "{")) else text
    return status, data


# ---------- test helpers ----------


def step(label: str) -> None:
    print(f"\n=== {label} ===")


def assert_eq(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"FAIL {label}: expected {expected!r}, got {actual!r}")
    print(f"  OK {label}")


def assert_in(needle: str, haystack: str, label: str) -> None:
    if needle not in haystack:
        raise AssertionError(f"FAIL {label}: {needle!r} not in haystack")
    print(f"  OK {label}")


def assert_true(cond: bool, label: str) -> None:
    if not cond:
        raise AssertionError(f"FAIL {label}")
    print(f"  OK {label}")


# ---------- flows ----------


def submit_avis(pro_slug: str, pseudo: str, email: str, verdict: str, texte: str) -> tuple[int, str]:
    form = urllib.parse.urlencode({
        "pro_slug": pro_slug,
        "pseudo": pseudo,
        "email": email,
        "verdict": verdict,
        "texte": texte,
        "company": "",  # honeypot empty
        "cf-turnstile-response": "",
        "rgpd": "on",
    })
    status, text, headers = http(
        "POST",
        f"{PROD_URL}/api/avis/submit",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        body=form,
        allow_redirects=False,
    )
    return status, headers.get("location", "")


def flow_a_publie(service_key: str) -> None:
    step("Flow A : publie immediate (no artisan email, verdict=oui)")
    pseudo = f"E2E_TEST_{MARKER}_A"
    email = f"e2e+a_{MARKER}@kingsley2.com"
    texte = (
        "Test E2E flow A. Travaux de renovation peinture salon, intervention rapide "
        "et propre. Devis respecte, equipe ponctuelle. Test marker {ts}."
    ).format(ts=MARKER) * 2  # ~250 chars, well above min

    # 1. Submit
    status, location = submit_avis(PILOT_SLUG_NO_EMAIL, pseudo, email, "oui", texte)
    assert_eq(status, 303, "submit returns 303")
    assert_in(f"/pro/{PILOT_SLUG_NO_EMAIL}/avis-soumis/", location, "redirect to avis-soumis")

    # 2. Read pro_avis row via service_role
    time.sleep(0.5)
    code, rows = sb_rest(
        service_key, "GET",
        f"pro_avis?email=eq.{urllib.parse.quote(email)}&select=id,status,email_verification_token,moderation_reason"
    )
    assert_eq(code, 200, "supabase fetch ok")
    assert_eq(len(rows), 1, "exactly 1 row inserted")
    avis = rows[0]
    assert_eq(avis["status"], "en_attente_verif_email", "status after submit")
    assert_true(avis["email_verification_token"] is not None, "verif token present")

    # 3. Verifier endpoint
    token = avis["email_verification_token"]
    status, _, _ = http(
        "GET",
        f"{PROD_URL}/api/avis/verifier/{token}",
        allow_redirects=False,
    )
    assert_true(status in (302, 303), f"verifier returns redirect ({status})")

    # 4. Re-fetch status
    time.sleep(0.5)
    code, rows = sb_rest(
        service_key, "GET",
        f"pro_avis?id=eq.{avis['id']}&select=status,email_verified,published_at"
    )
    after = rows[0]
    assert_eq(after["status"], "publie", "status after verify (no artisan email -> publie)")
    assert_eq(after["email_verified"], True, "email_verified flag set")
    assert_true(after["published_at"] is not None, "published_at populated")

    # 5. Avis visible on /pro/<slug>/ HTML
    time.sleep(2)  # SSR cache settle
    status, html, _ = http("GET", f"{PROD_URL}/pro/{PILOT_SLUG_NO_EMAIL}/")
    assert_eq(status, 200, "pro page returns 200")
    assert_in(pseudo, html, f"pseudo {pseudo} appears in pro page HTML")

    print(f"Flow A PASS  (avis_id={avis['id']})")
    return avis["id"]


def flow_b_preavis(service_key: str) -> None:
    step("Flow B : preavis 48h (artisan email present, verdict=non + long text)")
    pseudo = f"E2E_TEST_{MARKER}_B"
    email = f"e2e+b_{MARKER}@kingsley2.com"
    # Long text (>500 chars) to trigger flag_preavis when verdict=non
    texte = (
        "Test E2E flow B preavis. " * 25
        + "L'intervention etait en retard et le travail n'etait pas a la hauteur de ce qui avait ete promis. "
        "Le tarif final a depasse l'estimation initiale de 40%. Test marker {ts}."
    ).format(ts=MARKER)

    # Pre-flight: pick a test pro and temporarily set its email
    test_pro_slug = "mister-pose-marsilly"
    test_artisan_email = f"e2e-artisan+{MARKER}@kingsley2.com"

    code, pros = sb_rest(
        service_key, "GET",
        f"pros?slug=eq.{test_pro_slug}&select=id,email"
    )
    assert_eq(code, 200, "supabase fetch test pro ok")
    assert_eq(len(pros), 1, "test pro found")
    original_email = pros[0]["email"]
    pro_id = pros[0]["id"]

    # Override pro email
    sb_rest(
        service_key, "PATCH", f"pros?id=eq.{pro_id}",
        body={"email": test_artisan_email}, prefer="return=minimal",
    )

    try:
        # 1. Submit
        status, location = submit_avis(test_pro_slug, pseudo, email, "non", texte)
        assert_eq(status, 303, "submit returns 303")

        # 2. Read avis row
        time.sleep(0.5)
        code, rows = sb_rest(
            service_key, "GET",
            f"pro_avis?email=eq.{urllib.parse.quote(email)}&select=id,status,email_verification_token,moderation_reason"
        )
        assert_eq(len(rows), 1, "avis row inserted")
        avis = rows[0]
        assert_eq(avis["status"], "en_attente_verif_email", "status after submit")
        assert_eq(avis["moderation_reason"], "verdict_non_long",
                  "moderation_reason flag_preavis set by filter")

        # 3. Verifier
        token = avis["email_verification_token"]
        http("GET", f"{PROD_URL}/api/avis/verifier/{token}", allow_redirects=False)

        # 4. Re-fetch: status should be en_attente_preavis_artisan
        time.sleep(0.5)
        code, rows = sb_rest(
            service_key, "GET",
            f"pro_avis?id=eq.{avis['id']}&select=status,email_verified,preavis_envoye_at"
        )
        after = rows[0]
        assert_eq(after["status"], "en_attente_preavis_artisan",
                  "status after verify (artisan email present + verdict_non_long)")
        assert_eq(after["email_verified"], True, "email_verified set")
        assert_true(after["preavis_envoye_at"] is not None, "preavis_envoye_at populated")

        # 5. pro_response_tokens row exists with type=preavis
        code, tokens = sb_rest(
            service_key, "GET",
            f"pro_response_tokens?avis_id=eq.{avis['id']}&type=eq.preavis&select=id,token_hash,expires_at"
        )
        assert_eq(len(tokens), 1, "preavis token row created")
        assert_true(tokens[0]["token_hash"] is not None, "token_hash present (SHA256, raw token in email only)")

        # 6. Avis NOT yet displayed (still en_attente_preavis_artisan)
        time.sleep(2)
        status, html, _ = http("GET", f"{PROD_URL}/pro/{test_pro_slug}/")
        # avis_id should not appear in HTML yet
        assert_true(avis["id"] not in html, "preavis avis NOT yet displayed on pro page")

        print(f"Flow B PASS  (avis_id={avis['id']}, preavis_token_hash={tokens[0]['token_hash'][:16]}...)")
    finally:
        # Restore original pro email
        sb_rest(
            service_key, "PATCH", f"pros?id=eq.{pro_id}",
            body={"email": original_email}, prefer="return=minimal",
        )


def cleanup(service_key: str) -> None:
    step("Cleanup E2E test rows")
    # delete pro_avis where pseudo starts with E2E_TEST_<MARKER>
    pattern = f"E2E_TEST_{MARKER}_"
    code, rows = sb_rest(
        service_key, "GET",
        f"pro_avis?pseudo=like.{urllib.parse.quote(pattern + '*')}&select=id"
    )
    if code == 200 and isinstance(rows, list):
        ids = [r["id"] for r in rows]
        print(f"  found {len(ids)} test row(s) to delete")
        for avis_id in ids:
            sb_rest(service_key, "DELETE", f"pro_avis_responses?avis_id=eq.{avis_id}")
            sb_rest(service_key, "DELETE", f"pro_response_tokens?avis_id=eq.{avis_id}")
            sb_rest(service_key, "DELETE", f"pro_avis?id=eq.{avis_id}")
        print(f"  cleaned {len(ids)} avis + cascades")
    else:
        print(f"  cleanup query returned {code}, skipping")


# ---------- main ----------


def main() -> int:
    env = load_env(ENV_FILE)
    pat = env.get("SUPABASE_PAT", "").strip()
    if not pat:
        print("SUPABASE_PAT not found in .env.master", file=sys.stderr)
        return 1

    print(f"E2E avis test starting  marker={MARKER}  prod={PROD_URL}")
    service_key = get_service_role_key(pat)
    print(f"  service_role key fetched ({service_key[:8]}...)")

    failed = False
    try:
        flow_a_publie(service_key)
    except AssertionError as e:
        print(f"\n  ASSERT FAIL (A): {e}")
        failed = True
    except Exception as e:
        print(f"\n  ERROR (A): {e}")
        failed = True

    try:
        flow_b_preavis(service_key)
    except AssertionError as e:
        print(f"\n  ASSERT FAIL (B): {e}")
        failed = True
    except Exception as e:
        print(f"\n  ERROR (B): {e}")
        failed = True

    try:
        cleanup(service_key)
    except Exception as e:
        print(f"  cleanup error (manual cleanup may be needed): {e}")

    if failed:
        print("\nE2E test FAILED")
        return 1
    print("\nE2E test PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
