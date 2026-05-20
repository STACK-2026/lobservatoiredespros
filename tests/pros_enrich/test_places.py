from scripts.pros_enrich.places import (
    build_query,
    is_good_match,
    normalize_phone_from_places,
    looks_like_official_site,
)


def test_build_query_uses_nom_cp_ville():
    pro = {"nom_entreprise": "MD HABITAT", "code_postal": "35150", "ville": "Janze"}
    assert build_query(pro) == "MD HABITAT 35150 Janze"


def test_build_query_handles_missing_fields():
    assert build_query({"nom_entreprise": "X", "code_postal": "", "ville": "Paris"}) == "X Paris"
    assert build_query({"nom_entreprise": "Y", "code_postal": "75001", "ville": ""}) == "Y 75001"
    assert build_query({"nom_entreprise": ""}) == ""


def test_is_good_match_via_postcode():
    pro = {"nom_entreprise": "SB ENTREPRISE", "code_postal": "44130"}
    place = {"displayName": {"text": "Some other name"}, "formattedAddress": "10 rue X, 44130 Blain, France"}
    assert is_good_match(pro, place) is True


def test_is_good_match_via_name_token():
    pro = {"nom_entreprise": "ICONIK CUISINES", "code_postal": "54000"}
    place = {"displayName": {"text": "iconik cuisines"}, "formattedAddress": "3 rue Mazagran, 54000 Nancy, France"}
    assert is_good_match(pro, place) is True


def test_is_good_match_rejects_wrong_postcode_and_name():
    pro = {"nom_entreprise": "ABCDEF Plomberie", "code_postal": "75001"}
    place = {"displayName": {"text": "Random Pizzeria"}, "formattedAddress": "1 rue Y, 83000 Toulon, France"}
    assert is_good_match(pro, place) is False


def test_normalize_phone_prefers_international():
    place = {"internationalPhoneNumber": "+33 3 83 46 62 30", "nationalPhoneNumber": "03 83 46 62 30"}
    assert normalize_phone_from_places(place) == "+33383466230"


def test_normalize_phone_falls_back_to_national():
    place = {"nationalPhoneNumber": "03 83 46 62 30"}
    assert normalize_phone_from_places(place) == "+33383466230"


def test_normalize_phone_empty():
    assert normalize_phone_from_places({}) == ""


def test_looks_like_official_site_accepts_clean():
    assert looks_like_official_site("https://iconik-cuisines.fr/", {}) is True
    assert looks_like_official_site("https://www.plombier-dupont.fr", {}) is True


def test_looks_like_official_site_rejects_socials_and_directories():
    assert looks_like_official_site("https://www.facebook.com/ju.philippeau", {}) is False
    assert looks_like_official_site("https://www.qualit-enr.org/entreprises/x", {}) is False
    assert looks_like_official_site("https://www.pagesjaunes.fr/x", {}) is False
    assert looks_like_official_site("https://linkedin.com/in/x", {}) is False


def test_looks_like_official_site_handles_empty():
    assert looks_like_official_site("", {}) is False
