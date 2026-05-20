from scripts.pros_enrich.db import build_pros_query, build_update_body, build_update_url


def test_build_pros_query_phase_b_needs_site_web():
    """Phase B: select pros with site_web NOT NULL AND coords_enriched_at IS NULL."""
    q = build_pros_query("B")
    assert "site_web=not.is.null" in q
    assert "coords_enriched_at=is.null" in q
    assert "active=eq.true" in q
    assert "select=id,slug,siren,site_web,telephone,email" in q


def test_build_pros_query_phase_a_needs_no_site_web():
    """Phase A: select pros with site_web IS NULL AND coords_enriched_at IS NULL."""
    q = build_pros_query("A")
    assert "site_web=is.null" in q
    assert "coords_enriched_at=is.null" in q


def test_build_pros_query_phase_bprime_filters_to_annuaire_source():
    """Phase B': pros enriched by Phase A (site_web newly known, coords_source=annuaire)."""
    q = build_pros_query("Bprime")
    assert "site_web=not.is.null" in q
    assert "coords_source=eq.annuaire" in q


def test_build_update_body_only_includes_non_empty_fields():
    """Don't overwrite existing tel/email with empty string."""
    body = build_update_body({"primary_email": "x@y.fr", "phones": [], "site_web_final": ""}, source="site_web")
    assert body["email"] == "x@y.fr"
    assert "telephone" not in body  # phones empty so not set
    assert "site_web" not in body   # empty so not set
    assert body["coords_source"] == "site_web"
    assert "coords_enriched_at" in body


def test_build_update_body_phone_string_normalization():
    """phones is a list, body['telephone'] is the first item."""
    body = build_update_body({"primary_email": "", "phones": ["+33386123456"], "site_web_final": ""}, source="site_web")
    assert body["telephone"] == "+33386123456"


def test_build_update_url_uses_id():
    assert build_update_url("abc-123") == "pros?id=eq.abc-123"


def test_build_pros_query_order_clause_is_last():
    """Regression: count_pros_for_phase strips '&order=...' as the trailing slice.
    Phase filters must be BEFORE '&order=' to survive the strip.
    Before fix: site_web filter was after &order=id and got dropped by count.
    """
    for phase in ("A", "B", "Bprime"):
        q = build_pros_query(phase)
        order_idx = q.index("&order=")
        # everything after &order= must NOT contain filter clauses
        tail = q[order_idx:]
        assert "site_web" not in tail
        assert "coords_source" not in tail
