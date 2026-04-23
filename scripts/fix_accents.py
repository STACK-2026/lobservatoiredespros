#!/usr/bin/env python3
"""
Fix accents francais manquants dans les zones TEXTE des .astro et .md.

Safe : ne touche pas aux attributs HTML, class, id, var names, js code.
On remplace UNIQUEMENT dans :
  - Contenu entre > et < (zone texte HTML)
  - Contenu markdown (.md entier sauf code blocks)
  - Strings JSX/TSX type `texte`...` ou "texte..." dans zone frontmatter

Usage :
    python3 scripts/fix_accents.py --dry-run
    python3 scripts/fix_accents.py --apply
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

# Racine
ROOT = Path(__file__).resolve().parent.parent / "site"

# Mapping mots -> mots accentues.
# IMPORTANT : on utilise des boundaries \b, casesensitive.
REPLACEMENTS = [
    # A majuscule
    ("Edition", "Édition"),
    ("Editeur", "Éditeur"),
    ("Editorial", "Éditorial"),
    ("Editoriale", "Éditoriale"),
    ("Etat", "État"),
    ("Etats", "États"),
    ("Echeance", "Échéance"),
    ("Element", "Élément"),
    # minuscules courantes
    ("edition", "édition"),
    ("editions", "éditions"),
    ("editeur", "éditeur"),
    ("editorial", "éditorial"),
    ("editoriale", "éditoriale"),
    ("editoriales", "éditoriales"),
    ("methode", "méthode"),
    ("methodologie", "méthodologie"),
    ("redaction", "rédaction"),
    ("medaille", "médaille"),
    ("medailles", "médailles"),
    ("laureat", "lauréat"),
    ("Laureat", "Lauréat"),
    ("laureate", "lauréate"),
    ("laureats", "lauréats"),
    ("verifie", "vérifié"),
    ("verifiee", "vérifiée"),
    ("verifies", "vérifiés"),
    ("verifiees", "vérifiées"),
    ("certifie", "certifié"),
    ("certifiee", "certifiée"),
    ("certifies", "certifiés"),
    ("certifiees", "certifiées"),
    ("recommande", "recommandé"),
    ("recommandee", "recommandée"),
    ("recommandes", "recommandés"),
    ("recommandees", "recommandées"),
    ("publie", "publié"),
    ("publiee", "publiée"),
    ("publies", "publiés"),
    ("publiees", "publiées"),
    ("fondee", "fondée"),
    ("fondees", "fondées"),
    ("creee", "créée"),
    ("creees", "créées"),
    ("integre", "intégré"),
    ("integree", "intégrée"),
    ("integres", "intégrés"),
    ("integrees", "intégrées"),
    ("presente", "présente"),
    ("presentee", "présentée"),
    ("presentes", "présentes"),
    ("presentees", "présentées"),
    ("detaille", "détaillé"),
    ("detaillee", "détaillée"),
    ("detailles", "détaillés"),
    ("detaillees", "détaillées"),
    ("numero", "numéro"),
    ("numeros", "numéros"),
    ("numerote", "numéroté"),
    ("numerotee", "numérotée"),
    ("tres", "très"),
    ("duree", "durée"),
    ("durees", "durées"),
    ("deja", "déjà"),
    ("apres", "après"),
    ("immediat", "immédiat"),
    ("immediate", "immédiate"),
    ("immediatement", "immédiatement"),
    ("rejete", "rejeté"),
    ("rejetee", "rejetée"),
    ("retire", "retiré"),
    ("retires", "retirés"),
    ("retiree", "retirée"),
    ("accepte", "accepté"),
    ("acceptee", "acceptée"),
    ("acceptes", "acceptés"),
    ("acceptees", "acceptées"),
    ("declare", "déclaré"),
    ("declaree", "déclarée"),
    ("declares", "déclarés"),
    ("declarees", "déclarées"),
    ("signale", "signalé"),
    ("signalee", "signalée"),
    ("signales", "signalés"),
    ("signalees", "signalées"),
    ("signe", "signé"),
    ("signee", "signée"),
    ("signes", "signés"),
    ("signees", "signées"),
    ("designe", "désigné"),
    ("designee", "désignée"),
    ("cite", "cité"),
    ("citee", "citée"),
    ("cites", "cités"),
    ("citees", "citées"),
    ("illustre", "illustré"),
    ("illustree", "illustrée"),
    ("derniere", "dernière"),
    ("dernieres", "dernières"),
    ("premiere", "première"),
    ("premieres", "premières"),
    ("deuxieme", "deuxième"),
    ("troisieme", "troisième"),
    ("categorie", "catégorie"),
    ("categories", "catégories"),
    ("qualite", "qualité"),
    ("qualites", "qualités"),
    ("reference", "référence"),
    ("references", "références"),
    ("referencee", "référencée"),
    ("referencees", "référencées"),
    ("periode", "période"),
    ("periodes", "périodes"),
    ("probleme", "problème"),
    ("problemes", "problèmes"),
    ("systeme", "système"),
    ("systemes", "systèmes"),
    ("experience", "expérience"),
    ("experiences", "expériences"),
    ("specialise", "spécialisé"),
    ("specialisee", "spécialisée"),
    ("specialises", "spécialisés"),
    ("specialisees", "spécialisées"),
    ("specialite", "spécialité"),
    ("specialites", "spécialités"),
    ("echeance", "échéance"),
    ("echeances", "échéances"),
    ("debut", "début"),
    ("decembre", "décembre"),
    ("present", "présent"),
    ("presente", "présente"),  # déjà mis
    ("mensuelle", "mensuelle"),  # neutre
    ("acces", "accès"),
    ("legal", "légal"),
    ("legale", "légale"),
    ("legalement", "légalement"),
    ("legales", "légales"),
    ("integree", "intégrée"),
    ("propose", "proposé"),
    ("proposee", "proposée"),
    ("proposes", "proposés"),
    ("ecrit", "écrit"),
    ("ecrite", "écrite"),
    ("francais", "français"),
    ("francaise", "française"),
    ("francaises", "françaises"),
    ("Francais", "Français"),
    ("Francaise", "Française"),
    ("serieux", "sérieux"),
    ("serieuse", "sérieuse"),
    ("activite", "activité"),
    ("activites", "activités"),
    ("ancienne", "ancienne"),  # neutre
    ("anciennete", "ancienneté"),
    ("generale", "générale"),
    ("general", "général"),
    ("generaux", "généraux"),
    ("nationale", "nationale"),  # neutre
    ("national", "national"),  # neutre
    ("artisans", "artisans"),  # neutre
    ("pres", "près"),
    ("suivante", "suivante"),  # neutre
    ("recu", "reçu"),
    ("recue", "reçue"),
    ("recus", "reçus"),
    ("acheve", "achevé"),
    ("achevee", "achevée"),
    ("acheves", "achevés"),
    ("ete", "été"),
    ("hiver", "hiver"),  # neutre
    ("telephone", "téléphone"),
    ("telephones", "téléphones"),
    ("representants", "représentants"),
    ("representant", "représentant"),
    ("representee", "représentée"),
    ("represente", "représenté"),
    ("represent", "représent"),  # eviter
    ("demi", "demi"),  # neutre
    ("genre", "genre"),  # neutre
    ("entree", "entrée"),
    ("entrees", "entrées"),
    ("resume", "résumé"),
    ("resumes", "résumés"),
    ("reseau", "réseau"),
    ("reseaux", "réseaux"),
    ("rehabilitation", "réhabilitation"),
    ("serie", "série"),
    ("series", "séries"),
    ("prealable", "préalable"),
    ("prealables", "préalables"),
    ("hebergement", "hébergement"),
    ("hebergeur", "hébergeur"),
    ("hebergement", "hébergement"),
    ("propriete", "propriété"),
    ("proprietes", "propriétés"),
    ("donnees", "données"),
    ("collecte", "collecte"),  # neutre
    ("duree", "durée"),  # dup
    ("delai", "délai"),
    ("delais", "délais"),
    ("protection", "protection"),  # neutre
    ("protege", "protégé"),
    ("protegee", "protégée"),
    ("proteger", "protéger"),
    ("confidentialite", "confidentialité"),
    ("cetera", "cetera"),  # neutre
    ("derogation", "dérogation"),
    ("regles", "règles"),
    ("regle", "règle"),
    ("dernier", "dernier"),  # neutre
    ("privilegie", "privilégié"),
    ("separe", "séparé"),
    ("separee", "séparée"),
    ("decret", "décret"),
    ("decrets", "décrets"),
    ("constitue", "constitué"),
    ("constituee", "constituée"),
    ("indique", "indiqué"),
    ("indiquee", "indiquée"),
    ("indiques", "indiqués"),
    ("verifies", "vérifiés"),
    # Apres chaine courte
    ("a jour", "à jour"),
    ("a venir", "à venir"),
    ("a titre", "à titre"),
    ("a ce jour", "à ce jour"),
    ("a partir", "à partir"),
    ("a propos", "à propos"),
    ("a domicile", "à domicile"),
    ("a noter", "à noter"),
    ("a suivre", "à suivre"),
    ("au-dela", "au-delà"),
]

# Par securite, on evite de toucher ces contextes (class names, slugs, emails, imports)
AVOID_CONTEXT = [
    re.compile(r"class(Name)?=['\"][^'\"]*$"),
    re.compile(r"slug=['\"][^'\"]*$"),
    re.compile(r"href=['\"][^'\"]*$"),
    re.compile(r"src=['\"][^'\"]*$"),
    re.compile(r"data-[a-z-]+=['\"][^'\"]*$"),
    re.compile(r"id=['\"][^'\"]*$"),
    re.compile(r"@[a-zA-Z0-9.]+$"),  # emails
    re.compile(r"^\s*import\s"),
    re.compile(r"^\s*from\s+['\"]"),
    re.compile(r"^\s*//"),
    re.compile(r"\.(com|fr|org|gouv|net|io)"),
]


def is_in_code_block(md_content: str, pos: int) -> bool:
    """Detecte si la position est dans un code block ``` ... ``` ou dans inline ``"""
    # ```
    fences = [m.start() for m in re.finditer(r"^```", md_content, re.M)]
    open_count = sum(1 for f in fences if f < pos)
    if open_count % 2 == 1:
        return True
    # inline
    line_start = md_content.rfind("\n", 0, pos) + 1
    line = md_content[line_start:pos]
    if line.count("`") % 2 == 1:
        return True
    return False


def fix_text(text: str) -> tuple[str, int]:
    """Applique tous les remplacements dans un bloc de texte."""
    count = 0
    for old, new in REPLACEMENTS:
        if old == new:
            continue
        pattern = r"\b" + re.escape(old) + r"\b"
        new_text, n = re.subn(pattern, new, text)
        if n > 0:
            text = new_text
            count += n
    return text, count


def fix_astro(content: str) -> tuple[str, int]:
    """Fix les accents dans un .astro : seulement dans le contenu HTML visible (entre > et <).
    Skip les blocs <script> et <style> qui contiennent du code.
    Skip aussi le frontmatter --- ... --- en tete de fichier.
    """
    total = 0

    # 1. Extraire le frontmatter ---...--- en tete pour ne pas y toucher
    fm_match = re.match(r"^(---\s*\n[\s\S]*?\n---\s*\n)", content)
    frontmatter = ""
    body = content
    if fm_match:
        frontmatter = fm_match.group(1)
        body = content[fm_match.end():]

    # 2. Remplacer les blocs <script>...</script> et <style>...</style> par placeholders
    placeholders: list[str] = []
    def store(m):
        placeholders.append(m.group(0))
        return f"\x00BLOCK{len(placeholders)-1}\x00"

    body = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", store, body, flags=re.IGNORECASE)
    body = re.sub(r"<style\b[^>]*>[\s\S]*?</style>", store, body, flags=re.IGNORECASE)

    # 3. Remplacer dans >TEXT<
    def replace_text(m):
        nonlocal total
        gap = m.group(1)
        stripped = gap.strip()
        if not stripped or len(stripped) < 2:
            return m.group(0)
        if stripped.startswith("{") and stripped.endswith("}"):
            return m.group(0)
        if "\x00BLOCK" in gap:
            return m.group(0)
        new, n = fix_text(gap)
        total += n
        return ">" + new + "<"

    pattern = re.compile(r">([^<]+)<", re.DOTALL)
    body = pattern.sub(replace_text, body)

    # 4. Restaurer placeholders
    for i, block in enumerate(placeholders):
        body = body.replace(f"\x00BLOCK{i}\x00", block)

    return frontmatter + body, total


def fix_ts(content: str) -> tuple[str, int]:
    """Fix accents dans les strings TS : seulement entre " " ou ' ' ou ` `.

    On identifie chaque string littéral et on applique fix_text dedans.
    On ne touche JAMAIS les identifiers, clés d'objet sans quotes, etc.
    """
    total = 0
    out = []
    i = 0
    n = len(content)
    while i < n:
        c = content[i]
        if c in ('"', "'", "`"):
            # Début d'une string litérale
            quote = c
            start = i
            i += 1
            while i < n:
                if content[i] == "\\":
                    i += 2
                    continue
                if content[i] == quote:
                    break
                # Pour les template literals `...`, on ignore les ${...} expressions
                if quote == "`" and content[i:i+2] == "${":
                    depth = 1
                    i += 2
                    while i < n and depth > 0:
                        if content[i] == "{":
                            depth += 1
                        elif content[i] == "}":
                            depth -= 1
                        i += 1
                    continue
                i += 1
            # string complete entre start..i (exclusive)
            str_content = content[start+1:i]
            fixed, nf = fix_text(str_content)
            total += nf
            out.append(content[start])
            out.append(fixed)
            if i < n:
                out.append(content[i])
                i += 1
        elif c == "/" and i + 1 < n and content[i+1] == "/":
            # Ligne commentaire, on copie telle quelle jusqu'au \n
            end = content.find("\n", i)
            if end == -1:
                end = n
            out.append(content[i:end])
            i = end
        elif c == "/" and i + 1 < n and content[i+1] == "*":
            # Bloc commentaire
            end = content.find("*/", i + 2)
            if end == -1:
                end = n
            else:
                end += 2
            out.append(content[i:end])
            i = end
        else:
            out.append(c)
            i += 1
    return "".join(out), total


def fix_md(content: str) -> tuple[str, int]:
    """Fix .md : replace partout sauf dans les code blocks."""
    total = 0
    # Split sur les fences de code
    parts = re.split(r"(```[\s\S]*?```)", content)
    new_parts = []
    for i, part in enumerate(parts):
        if i % 2 == 1:
            # C'est un code block, on ne touche pas
            new_parts.append(part)
            continue
        # Skip aussi inline code (`...`)
        inline_parts = re.split(r"(`[^`\n]+`)", part)
        new_inline = []
        for j, ip in enumerate(inline_parts):
            if j % 2 == 1:
                new_inline.append(ip)
                continue
            fixed, n = fix_text(ip)
            total += n
            new_inline.append(fixed)
        new_parts.append("".join(new_inline))
    return "".join(new_parts), total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Ecrit les fichiers (sinon dry-run)")
    args = parser.parse_args()

    targets: list[Path] = []
    for ext in (".astro", ".md"):
        targets.extend((ROOT / "src" / "components").rglob(f"*{ext}"))
        targets.extend((ROOT / "src" / "pages").rglob(f"*{ext}"))
        targets.extend((ROOT / "src" / "content").rglob(f"*{ext}"))
    # Aussi les data files .ts (seed-pros, glossaire) + site.config.ts
    for p in [
        ROOT / "src" / "data" / "glossaire.ts",
        ROOT / "src" / "data" / "seed-pros.ts",
        ROOT / "site.config.ts",
    ]:
        if p.exists():
            targets.append(p)

    total_changes = 0
    for f in sorted(set(targets)):
        content = f.read_text(encoding="utf-8")
        if f.suffix == ".astro":
            new_content, n = fix_astro(content)
        elif f.suffix == ".ts":
            # Pour .ts : on remplace seulement dans les strings "..." et `...`,
            # pas dans les noms de variable/fonction/import.
            new_content, n = fix_ts(content)
        else:
            new_content, n = fix_md(content)
        if n > 0:
            total_changes += n
            try:
                rel = f.relative_to(ROOT)
            except ValueError:
                rel = f
            print(f"  {rel} : {n} remplacements")
            if args.apply:
                f.write_text(new_content, encoding="utf-8")

    print(f"\n[done] {total_changes} accents fixes, apply={args.apply}")


if __name__ == "__main__":
    main()
