from pathlib import Path
from scripts.pros_enrich.api_gouv import parse_annuaire_entreprise_html

FIXTURE = Path(__file__).parent.parent / "fixtures" / "annuaire_siren_example.html"

def test_parse_annuaire_entreprise_returns_dict():
    html = FIXTURE.read_text(encoding="utf-8")
    out = parse_annuaire_entreprise_html(html)
    assert isinstance(out, dict)
    # at minimum 1 of these keys (or empty dict if annuaire publishes none for this siren)
    # The fixture is for a real SIREN, but data.gouv does NOT publish private contact info.
    # The function MUST not crash on valid HTML.
    for k in out:
        assert k in ("site_web", "telephone", "email")

def test_parse_annuaire_entreprise_handles_empty():
    out = parse_annuaire_entreprise_html("<html></html>")
    assert out == {}

def test_parse_annuaire_entreprise_handles_garbage():
    """Returns empty dict (not None, not crash) on non-HTML input."""
    assert parse_annuaire_entreprise_html("") == {}
    assert parse_annuaire_entreprise_html("not html at all") == {}

def test_parse_annuaire_entreprise_ignores_gov_and_social_links():
    """Footer/social links must never be picked as site_web."""
    html = """<html><body>
    <a href="https://etalab.gouv.fr">Etalab</a>
    <a href="https://data.gouv.fr">data.gouv</a>
    <a href="https://github.com/etalab">Code source</a>
    <a href="https://twitter.com/entreprises">Twitter</a>
    <a href="https://linkedin.com/company/foo">LinkedIn</a>
    </body></html>"""
    out = parse_annuaire_entreprise_html(html)
    assert "site_web" not in out

def test_parse_annuaire_entreprise_detects_site_web_hint():
    """When a link is labeled 'site internet' or 'site web', pick it as site_web."""
    html = """<html><body>
    <table>
      <tr><td>Site internet</td><td><a href="https://www.md-habitat.fr">www.md-habitat.fr</a></td></tr>
    </table>
    </body></html>"""
    out = parse_annuaire_entreprise_html(html)
    assert out.get("site_web") == "https://www.md-habitat.fr"

def test_parse_annuaire_entreprise_detects_tel():
    """tel: href is extracted as telephone."""
    html = """<html><body>
    <a href="tel:+33386123456">03 86 12 34 56</a>
    </body></html>"""
    out = parse_annuaire_entreprise_html(html)
    assert out.get("telephone") == "+33386123456"

def test_parse_annuaire_entreprise_detects_mailto():
    """mailto: href is extracted as email."""
    html = """<html><body>
    <a href="mailto:contact@md-habitat.fr">Nous écrire</a>
    </body></html>"""
    out = parse_annuaire_entreprise_html(html)
    assert out.get("email") == "contact@md-habitat.fr"
