"""
Découpe pros_with_email_*.csv en segments :
  - exports/segments/by_metier/{metier}.csv
  - exports/segments/by_dept/{dept_code}.csv
  - exports/segments/priority_or_argent.csv  (89 contacts premium)
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORTS = ROOT / "exports"


def find_master() -> Path:
    candidates = sorted(EXPORTS.glob("pros_with_email_*.csv"), reverse=True)
    if not candidates:
        sys.exit("Aucun pros_with_email_*.csv dans exports/. Lance d'abord export_pros_emails.py")
    return candidates[0]


def main():
    master = find_master()
    print(f"Source : {master.name}")

    by_metier_dir = EXPORTS / "segments" / "by_metier"
    by_dept_dir = EXPORTS / "segments" / "by_dept"
    by_metier_dir.mkdir(parents=True, exist_ok=True)
    by_dept_dir.mkdir(parents=True, exist_ok=True)

    by_metier = defaultdict(list)
    by_dept = defaultdict(list)
    priority = []

    with master.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        for row in reader:
            m = row.get("metier_principal") or "_inconnu"
            d = row.get("departement_code") or "_inconnu"
            by_metier[m].append(row)
            by_dept[d].append(row)
            if row.get("niveau_confiance") in ("or", "argent"):
                priority.append(row)

    def write(path: Path, rows: list):
        with path.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=fields)
            w.writeheader()
            w.writerows(rows)

    for m, rows in sorted(by_metier.items()):
        write(by_metier_dir / f"{m}.csv", rows)
    for d, rows in sorted(by_dept.items()):
        write(by_dept_dir / f"{d}.csv", rows)

    priority.sort(
        key=lambda r: (
            0 if r.get("niveau_confiance") == "or" else 1,
            -float(r["score_confiance"] or 0),
        )
    )
    write(EXPORTS / "segments" / "priority_or_argent.csv", priority)

    print(f"Métiers   : {len(by_metier)} fichiers -> {by_metier_dir}")
    print(f"Départs   : {len(by_dept)} fichiers -> {by_dept_dir}")
    print(f"Priority  : {len(priority)} contacts (OR+ARGENT) -> exports/segments/priority_or_argent.csv")

    print("\nRecap métier :")
    for m, rows in sorted(by_metier.items(), key=lambda kv: -len(kv[1])):
        print(f"  {m:<14} {len(rows):>5}")


if __name__ == "__main__":
    main()
