#!/usr/bin/env python3
"""
run_phase2d_orchestrator.py , import national 15 metiers x 96 dpts metropole
                              avec audit gate entre chaque metier.

Strategie :
  - Pour chaque metier :
      1. Lance import_sirene.py --metier X --all-depts --insert --limit 100
         (SIRET dedup garantit zero doublon, dpts deja faits sont quasi-instant)
      2. Audit via audit_metier_post_import.py
      3. Si critical issues -> halt et exit (review manuelle)
      4. Si warn issues -> log mais continue
      5. Append au docs/AUDIT_LOG.md
  - Logs detailles dans logs/phase2d/ (un fichier stdout par metier)
  - Resume safe : kill puis relance, le SIRET dedup gere les overlaps

Usage :
  python3 scripts/run_phase2d_orchestrator.py [--start-from electricien]
  nohup python3 -u scripts/run_phase2d_orchestrator.py > logs/phase2d/orchestrator.log 2>&1 &
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LOGS_DIR = REPO / "logs" / "phase2d"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
ORCH_LOG = LOGS_DIR / "orchestrator.log"
AUDIT_LOG = REPO / "docs" / "AUDIT_LOG.md"
ENV_MASTER = Path.home() / "stack-2026" / ".env.master"
PROJECT_REF = "apuyeakgxjgdcfssrtek"

METIERS = [
    "plombier", "electricien", "couvreur", "menuisier", "isolation",
    "chauffagiste", "plaquiste", "carreleur", "peintre", "serrurier",
    "macon", "jardinier", "climaticien", "cuisiniste", "parqueteur",
]

LIMIT_PER_COMBO = 100
IMPORT_TIMEOUT = 18000
MIN_PROS_PER_DPT_DONE = 80


def load_pat():
    for line in ENV_MASTER.read_text().splitlines():
        if line.startswith("SUPABASE_PAT="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("SUPABASE_PAT introuvable")


def db_query(sql, pat):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
            "User-Agent": "lobservatoiredespros-orchestrator/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def all_metropole_dpts(pat):
    rows = db_query(
        "SELECT code FROM zones WHERE type='departement' "
        "AND code NOT IN ('971','972','973','974','976','975','977','978','984','986','987','988') "
        "ORDER BY code",
        pat,
    )
    return [r["code"] for r in rows]


def metier_coverage(slug, pat):
    rows = db_query(
        f"""SELECT z.code, COUNT(DISTINCT pm.pro_id) AS pros
            FROM zones z
            JOIN pro_zones pz ON pz.zone_id = z.id
            JOIN pro_metiers pm ON pm.pro_id = pz.pro_id
            JOIN metiers m ON m.id = pm.metier_id
            WHERE z.type='departement' AND m.slug='{slug}'
            GROUP BY z.code""",
        pat,
    )
    return {r["code"]: r["pros"] for r in rows}


def missing_dpts_for(slug, pat):
    all_d = all_metropole_dpts(pat)
    cov = metier_coverage(slug, pat)
    return [d for d in all_d if cov.get(d, 0) < MIN_PROS_PER_DPT_DONE]


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with ORCH_LOG.open("a") as f:
        f.write(line + "\n")


def import_metier(slug, pat):
    missing = missing_dpts_for(slug, pat)
    if not missing:
        log(f"SKIP IMPORT metier={slug} (deja complet : 96/96 dpts >= {MIN_PROS_PER_DPT_DONE} pros)")
        return True
    log(f"IMPORT START metier={slug} : {len(missing)}/96 dpts manquants")
    log(f"  dpts : {','.join(missing[:20])}{'...' if len(missing) > 20 else ''}")
    cmd = [
        sys.executable, "scripts/import_sirene.py",
        "--metier", slug,
        "--depts", ",".join(missing),
        "--insert",
        "--limit", str(LIMIT_PER_COMBO),
    ]
    out_file = LOGS_DIR / f"import_{slug}.log"
    log(f"  log : {out_file}")
    t0 = time.time()
    try:
        with out_file.open("w") as f:
            proc = subprocess.run(
                cmd, cwd=str(REPO),
                stdout=f, stderr=subprocess.STDOUT,
                timeout=IMPORT_TIMEOUT,
            )
        elapsed = time.time() - t0
        log(f"IMPORT END   metier={slug} ({elapsed:.0f}s, exit={proc.returncode})")
        return proc.returncode == 0
    except subprocess.TimeoutExpired:
        log(f"IMPORT TIMEOUT metier={slug} (>{IMPORT_TIMEOUT}s)")
        return False
    except Exception as e:
        log(f"IMPORT EXCEPTION metier={slug} : {e}")
        return False


def audit_metier(slug):
    cmd = [sys.executable, "scripts/audit_metier_post_import.py", "--metier", slug]
    log(f"AUDIT START metier={slug}")
    proc = subprocess.run(
        cmd, cwd=str(REPO), capture_output=True, text=True, timeout=120,
    )
    output = proc.stdout + ("\n--- STDERR ---\n" + proc.stderr if proc.stderr else "")
    log(f"AUDIT END   metier={slug} (exit={proc.returncode})")
    for line in output.splitlines():
        log(f"  | {line}")

    with AUDIT_LOG.open("a") as f:
        f.write("\n## Phase 2.D , audit `" + slug + "` , " +
                datetime.now().strftime("%Y-%m-%d %H:%M") + "\n\n")
        f.write("```\n" + output + "\n```\n")

    return proc.returncode


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start-from", help="Skip metiers avant celui-ci (ex: electricien)")
    ap.add_argument("--only", help="Run only ces metiers (CSV)")
    args = ap.parse_args()

    metiers = METIERS[:]
    if args.start_from:
        if args.start_from in metiers:
            metiers = metiers[metiers.index(args.start_from):]
        else:
            log(f"start-from inconnu : {args.start_from}")
            sys.exit(1)
    if args.only:
        wanted = [m.strip() for m in args.only.split(",") if m.strip()]
        metiers = [m for m in METIERS if m in wanted]

    pat = load_pat()
    log("=" * 72)
    log(f"ORCHESTRATOR Phase 2.D START , metiers : {metiers}")
    log(f"limit/combo : {LIMIT_PER_COMBO} , target ~ {LIMIT_PER_COMBO * 96} pros / metier")
    log("=" * 72)

    t_start = time.time()
    halted_at = None
    for i, slug in enumerate(metiers, 1):
        log("")
        log(f"=== METIER {i}/{len(metiers)} : {slug} ===")
        ok = import_metier(slug, pat)
        if not ok:
            log(f"FAIL import {slug}, halting orchestrator")
            halted_at = slug
            break
        time.sleep(3)
        rc = audit_metier(slug)
        if rc == 2:
            log(f"AUDIT CRITICAL on {slug} (rc=2), halting for manual review")
            halted_at = slug
            break
        elif rc == 1:
            log(f"AUDIT WARN on {slug} (rc=1), continuing")
        else:
            log(f"AUDIT OK on {slug}, next metier")

    elapsed = time.time() - t_start
    log("=" * 72)
    if halted_at:
        log(f"ORCHESTRATOR HALTED at metier={halted_at} after {elapsed:.0f}s")
        sys.exit(2)
    log(f"ORCHESTRATOR import phase DONE , {len(metiers)} metiers en {elapsed:.0f}s")

    # Post-import : enrichissements + build + deploy
    log("=" * 72)
    log("POST-IMPORT phase START (geocode + enrich + bodacc + RGE + build + deploy)")
    log("=" * 72)
    post_pipeline()


def get_service_role_key(pat):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys?reveal=true",
        headers={
            "Authorization": f"Bearer {pat}",
            "User-Agent": "lobservatoiredespros-orchestrator/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        keys = json.loads(r.read())
    for k in keys:
        if k.get("name") == "service_role":
            return k.get("api_key")
    raise RuntimeError("service_role key introuvable")


def run_step(name, cmd, env=None, timeout=14400):
    log(f"STEP START : {name}")
    log(f"  cmd : {' '.join(cmd)}")
    log_file = LOGS_DIR / f"step_{name}.log"
    t0 = time.time()
    try:
        with log_file.open("w") as f:
            proc = subprocess.run(
                cmd, cwd=str(REPO),
                stdout=f, stderr=subprocess.STDOUT,
                env=env, timeout=timeout,
            )
        elapsed = time.time() - t0
        log(f"STEP END   : {name} ({elapsed:.0f}s, exit={proc.returncode})")
        return proc.returncode == 0
    except subprocess.TimeoutExpired:
        log(f"STEP TIMEOUT : {name} (>{timeout}s)")
        return False
    except Exception as e:
        log(f"STEP EXCEPTION : {name} : {e}")
        return False


def post_pipeline():
    pat = load_pat()
    try:
        service_key = get_service_role_key(pat)
    except Exception as e:
        log(f"FATAL : impossible de recuperer service_role key : {e}")
        return

    env = os.environ.copy()
    env["SUPABASE_URL"] = f"https://{PROJECT_REF}.supabase.co"
    env["SUPABASE_SERVICE_ROLE_KEY"] = service_key

    steps = [
        ("geocode", [sys.executable, "scripts/geocode_pros.py", "--commit", "--only-missing"]),
        ("enrich", [sys.executable, "scripts/enrich_entreprise.py", "--commit", "--only-missing"]),
        ("bodacc", [sys.executable, "scripts/sync_bodacc.py", "--commit", "--only-missing"]),
        ("rge", [sys.executable, "scripts/sync_rge_qualifications.py", "--all"]),
    ]
    for name, cmd in steps:
        ok = run_step(name, cmd, env=env)
        if not ok:
            log(f"STEP FAILED : {name} , halting post-pipeline (build/deploy skipped)")
            return

    cf_env = env.copy()
    for line in ENV_MASTER.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            if k in ("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"):
                cf_env[k] = v.strip()

    site_dir = REPO / "site"
    log("STEP START : npm run build")
    t0 = time.time()
    log_file = LOGS_DIR / "step_build.log"
    try:
        with log_file.open("w") as f:
            proc = subprocess.run(
                ["npm", "run", "build"], cwd=str(site_dir),
                stdout=f, stderr=subprocess.STDOUT, env=cf_env, timeout=3600,
            )
        log(f"STEP END   : build ({time.time()-t0:.0f}s, exit={proc.returncode})")
        if proc.returncode != 0:
            log("BUILD FAILED , deploy skipped")
            return
    except Exception as e:
        log(f"BUILD EXCEPTION : {e}")
        return

    log("STEP START : wrangler pages deploy")
    t0 = time.time()
    log_file = LOGS_DIR / "step_deploy.log"
    try:
        with log_file.open("w") as f:
            proc = subprocess.run(
                ["npx", "wrangler", "pages", "deploy", "dist",
                 "--project-name=lobservatoiredespros",
                 "--branch=main", "--commit-dirty=true"],
                cwd=str(site_dir),
                stdout=f, stderr=subprocess.STDOUT, env=cf_env, timeout=1800,
            )
        log(f"STEP END   : deploy ({time.time()-t0:.0f}s, exit={proc.returncode})")
    except Exception as e:
        log(f"DEPLOY EXCEPTION : {e}")
        return

    log("STEP START : submit IndexNow")
    run_step("indexnow", [sys.executable, "scripts/submit_indexnow.py", "--sitemap"])
    log("=" * 72)
    log("POST-PIPELINE DONE")
    log("=" * 72)


if __name__ == "__main__":
    main()
