from pathlib import Path
from scripts.pros_enrich.contact_scraper import extract_contacts_from_html

FIXTURE = Path(__file__).parent.parent / "fixtures" / "pro_site_contact_example.html"

def test_extract_contacts_from_html_finds_email_and_phone():
    html = FIXTURE.read_text(encoding="utf-8")
    result = extract_contacts_from_html(html, base_domain="plombier-dupont.fr")
    assert result["primary_email"] == "contact@plombier-dupont.fr"
    assert "+33386123456" in result["phones"]
    # noreply is blacklisted
    assert "noreply@example.com" not in result["all_emails"]

def test_extract_contacts_from_html_filters_off_domain_emails():
    """If base_domain is set, only keep emails on that domain."""
    html = '<a href="mailto:contact@plombier-dupont.fr">x</a> <a href="mailto:spam@othersite.com">y</a>'
    result = extract_contacts_from_html(html, base_domain="plombier-dupont.fr")
    assert result["primary_email"] == "contact@plombier-dupont.fr"
    assert "spam@othersite.com" not in result["all_emails"]


def test_extract_contacts_from_html_rejects_evil_twin_domain():
    """endswith trap: 'notplombier-dupont.fr' must NOT match 'plombier-dupont.fr'."""
    html = (
        '<a href="mailto:hack@notplombier-dupont.fr">evil</a> '
        '<a href="mailto:contact@plombier-dupont.fr">good</a>'
    )
    result = extract_contacts_from_html(html, base_domain="plombier-dupont.fr")
    assert result["primary_email"] == "contact@plombier-dupont.fr"
    assert "hack@notplombier-dupont.fr" not in result["all_emails"]


def test_extract_contacts_from_html_accepts_subdomain():
    """Real subdomains (mail.plombier-dupont.fr) should match base_domain."""
    html = '<a href="mailto:contact@mail.plombier-dupont.fr">sub</a>'
    result = extract_contacts_from_html(html, base_domain="plombier-dupont.fr")
    assert result["primary_email"] == "contact@mail.plombier-dupont.fr"
