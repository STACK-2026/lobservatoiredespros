"""
Push contacts vers une audience Resend.
Usage:
  python3 scripts/push_resend_audience.py <csv_path> <audience_id> [--limit N]

Resend API:
  POST /audiences/:audience_id/contacts
  body: {email, first_name, last_name, unsubscribed:false}
Rate limit: 2 req/s par défaut. On reste à ~1.5/s.

Le first_name reçoit le nom_entreprise (Resend n'a pas de custom fields).
La segmentation fine vit dans les CSV par métier/dept.
"""
import csv
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT.parent / ".env.master"


def load_key() -> str:
    for line in ENV.read_text().splitlines():
        if line.startswith("RESEND_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("RESEND_API_KEY introuvable")


def post_contact(audience_id: str, key: str, payload: dict, retries: int = 4):
    url = f"https://api.resend.com/audiences/{audience_id}/contacts"
    data = json.dumps(payload).encode()
    for attempt in range(retries):
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "User-Agent": "lobservatoiredespros-import/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.load(r), 200
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:200]
            if e.code == 429 or e.code >= 500:
                time.sleep(2 ** attempt)
                continue
            return body, e.code
        except Exception as e:
            time.sleep(2 ** attempt)
    return "max_retries", 0


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit("usage: push_resend_audience.py <csv> <audience_id> [--limit N]")
    csv_path = Path(args[0]).expanduser().resolve()
    audience_id = args[1]
    limit = None
    if "--limit" in args:
        limit = int(args[args.index("--limit") + 1])

    key = load_key()

    log_path = ROOT / "logs" / f"resend_push_{audience_id[:8]}.log"
    log_path.parent.mkdir(exist_ok=True)
    log = log_path.open("a", encoding="utf-8")
    log.write(f"\n--- {time.strftime('%Y-%m-%d %H:%M:%S')} import {csv_path.name} -> {audience_id}\n")

    seen = set()
    ok = 0
    dup = 0
    err = 0
    skipped = 0
    n_total = 0
    t0 = time.monotonic()

    with csv_path.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if limit is not None and n_total >= limit:
                break
            n_total += 1
            email = (row.get("email") or "").strip().lower()
            if not email or "@" not in email:
                skipped += 1
                continue
            if email in seen:
                dup += 1
                continue
            seen.add(email)

            nom = (row.get("nom_entreprise") or "").strip()[:50]
            ville = (row.get("ville") or "").strip()[:30]
            payload = {
                "email": email,
                "first_name": nom or "Pro",
                "last_name": ville or "",
                "unsubscribed": False,
            }
            body, code = post_contact(audience_id, key, payload)
            if code == 200 or code == 201:
                ok += 1
            elif code == 422 and isinstance(body, str) and "already" in body.lower():
                dup += 1
            else:
                err += 1
                log.write(f"ERR {code} {email} | {body}\n")
            if (ok + err + dup) % 50 == 0:
                rate = (ok + err + dup) / max(1, time.monotonic() - t0)
                print(f"... {ok} ok, {dup} dup, {err} err, {skipped} skip ({rate:.1f}/s)")
            time.sleep(0.7)  # ~1.4 req/s, sous la limite Resend

    elapsed = time.monotonic() - t0
    summary = (
        f"FIN | total={n_total} ok={ok} dup={dup} err={err} skip={skipped} "
        f"elapsed={elapsed:.0f}s rate={ok/max(1,elapsed):.1f}/s\n"
    )
    print(summary.strip())
    log.write(summary)
    log.close()


if __name__ == "__main__":
    main()
