import pytest
from scripts.pros_enrich.helpers import (
    is_valid_email,
    extract_emails_from_text,
    extract_phones_from_text,
    normalize_phone_fr,
)

VALID_EMAILS = [
    "contact@plombier-dupont.fr",
    "info@SB-ENTREPRISE.com",
    "jean.martin@ets-martin.fr",
]
INVALID_EMAILS = [
    "fait@tendre.les",         # 3-letter junk TLD
    "noreply@example.com",      # blacklist
    "logo@2x.png",              # image asset noise
    "x@y.z",                    # SLD too short
    "le@gmail.com",             # bad local part
]

@pytest.mark.parametrize("e", VALID_EMAILS)
def test_is_valid_email_accepts(e):
    assert is_valid_email(e.lower())

@pytest.mark.parametrize("e", INVALID_EMAILS)
def test_is_valid_email_rejects(e):
    assert not is_valid_email(e.lower())

def test_extract_emails_from_text_strips_html_noise():
    text = "Contactez nous : contact@plombier-dupont.fr ou info@plombier-dupont.fr."
    out = extract_emails_from_text(text)
    assert "contact@plombier-dupont.fr" in out
    assert "info@plombier-dupont.fr" in out

def test_extract_phones_from_text_french_formats():
    text = "Tel: 03 86 12 34 56 ou +33 1 23 45 67 89."
    out = extract_phones_from_text(text)
    assert any("03" in p for p in out)
    assert any("33" in p for p in out)

def test_normalize_phone_fr_canonical_form():
    # 03 86 12 34 56 -> +33 3 86 12 34 56 canonical
    assert normalize_phone_fr("03 86 12 34 56") == "+33386123456"
    assert normalize_phone_fr("+33 (0) 1.23.45.67.89") == "+33123456789"
