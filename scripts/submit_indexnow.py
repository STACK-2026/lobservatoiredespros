#!/usr/bin/env python3
"""
IndexNow submission + Bing URL submission.

Ping Bing/Yandex/IndexNow sur une liste d'URLs modifiees/ajoutees.
Gratuit, pas de cle OAuth (juste une cle IndexNow deposee sur le site).

Key IndexNow : a3f8d2c4b9e14f76a55e1c0b2d7e8f31 (publique dans CLAUDE.md,
fichier .txt deposee a la racine du site : /a3f8d2c4b9e14f76a55e1c0b2d7e8f31.txt).

Usage :
    python3 scripts/submit_indexnow.py https://lobservatoiredespros.com/pro/ace-milbert-freres/
    python3 scripts/submit_indexnow.py --sitemap  # ping toutes les URLs du sitemap
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

HOST = "lobservatoiredespros.com"
KEY = "a3f8d2c4b9e14f76a55e1c0b2d7e8f31"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow"
BING_ENDPOINT = "https://www.bing.com/indexnow"
UA = "ObservatoireDesPros/1.0 (IndexNow)"


def submit_urls(urls: list[str]) -> None:
    """Soumet une liste d'URLs a IndexNow (qui propage a Bing, Yandex, etc.)."""
    if not urls:
        print("[info] no URLs to submit")
        return

    # Batch de 10000 max par requete, on segmente si besoin
    for chunk_start in range(0, len(urls), 10000):
        chunk = urls[chunk_start:chunk_start + 10000]
        body = {
            "host": HOST,
            "key": KEY,
            "keyLocation": KEY_LOCATION,
            "urlList": chunk,
        }
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            INDEXNOW_ENDPOINT,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": UA},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                print(f"[ok] IndexNow batch {chunk_start}-{chunk_start + len(chunk)} : {r.status}")
        except urllib.error.HTTPError as e:
            # 202 Accepted, 200 OK
            if e.code in (200, 202):
                print(f"[ok] IndexNow batch {chunk_start} : {e.code}")
            else:
                print(f"[warn] IndexNow batch {chunk_start} failed : {e.code} {e.reason}")
                try:
                    print("       response:", e.read().decode("utf-8")[:200])
                except Exception:
                    pass
        except Exception as e:
            print(f"[warn] IndexNow batch {chunk_start} failed : {e}")

        time.sleep(0.5)


def fetch_sitemap_urls(sitemap_url: str = f"https://{HOST}/sitemap.xml") -> list[str]:
    """Recupere toutes les URLs d'un sitemap."""
    req = urllib.request.Request(sitemap_url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        xml = r.read().decode("utf-8")
    root = ET.fromstring(xml)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in root.findall(".//sm:loc", ns) if loc.text]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("urls", nargs="*", help="URLs to submit")
    parser.add_argument("--sitemap", action="store_true", help="submit all URLs from sitemap.xml")
    parser.add_argument("--sitemap-url", default=f"https://{HOST}/sitemap.xml")
    args = parser.parse_args()

    if args.sitemap:
        urls = fetch_sitemap_urls(args.sitemap_url)
        print(f"[info] sitemap has {len(urls)} URLs")
    else:
        urls = args.urls
        if not urls:
            print("Usage: submit_indexnow.py <url> [<url>...] or --sitemap")
            sys.exit(1)

    submit_urls(urls)


if __name__ == "__main__":
    main()
