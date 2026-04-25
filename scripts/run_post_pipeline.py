#!/usr/bin/env python3
"""
run_post_pipeline.py , Lance la post-pipeline (geocode + enrich + bodacc + rge
                       + build + deploy + indexnow) sans le bulk/import phase.

A executer apres import_sirene_bulk.py.

Stage 1 (parallele) : geocode + enrich + rge
Stage 2 : bodacc (depend enrich + rge)
Stage 3 : npm run build
Stage 4 : wrangler pages deploy
Stage 5 : submit IndexNow

Usage : nohup python3 -u scripts/run_post_pipeline.py > logs/phase2d/post.log 2>&1 &
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from run_phase2d_orchestrator import post_pipeline, log  # noqa: E402

if __name__ == "__main__":
    log("=" * 72)
    log("RUN POST-PIPELINE START (sans bulk import)")
    log("=" * 72)
    post_pipeline()
