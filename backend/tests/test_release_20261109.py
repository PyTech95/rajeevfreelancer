"""Checks for the Nov 2026 indexing / favicon / Google-profile release."""
import public_seo
from data import CITY_MAP
from google_profile import GOOGLE_MAP_EMBED_URL, GOOGLE_REVIEWS_SNAPSHOT

# Mirrors DEFAULT_SITE["business"] in server.py (server.py needs a database to import).
DEFAULTS = {
    "rating": "5.0", "reviews_count": "13", "reviews_verified": True, "reviews_checked_on": "2026-11-09",
    "google_maps_url": "https://maps.google.com/maps?cid=10332082874224753124",
    "google_review_url": "https://g.page/r/CeQ5EOSh7mKPEBI/review", "google_place_cid": "10332082874224753124",
    "map_embed_url": GOOGLE_MAP_EMBED_URL, "show_map": True, "google_reviews": GOOGLE_REVIEWS_SNAPSHOT,
}


def test_server_defaults_match_test_mirror():
    import re, ast
    from pathlib import Path
    src = (Path(__file__).resolve().parents[1] / "server.py").read_text()
    block = re.search(r'"business": \{(.*?)\n    \},', src, re.S).group(1)
    for key in ("rating", "reviews_count", "google_maps_url", "google_review_url", "google_place_cid", "reviews_checked_on"):
        value = re.search(rf'"{key}": "([^"]+)"', block).group(1)
        assert value == DEFAULTS[key], key
    assert '"reviews_verified": True' in block and '"show_map": True' in block


def test_legacy_wordpress_urls_redirect_to_live_hubs():
    legacy = {"seo": "freelance-seo-expert"}
    cases = {
        "/freelance-app-development": "/freelancer-app-developer",
        "/freelance-seo-services": "/freelancer-seo-expert",
        "/freelance-web-design-services": "/freelancer-website-developer",
        "/digital-marketing-services": "/freelancer-digital-marketing-consultant",
        "/freelance-services/freelance-seo-expert-in-pune": "/freelancer-seo-expert/pune-india",
        "/sms-marketing.php": "/sms-marketing-freelancer",
        "/services/seo": "/freelancer-seo-expert",
    }
    for path, target in cases.items():
        assert public_seo.legacy_wordpress_target(path, legacy, CITY_MAP) == target, path


def test_legacy_fallback_leaves_real_404s_alone():
    legacy = {}
    for path in ("/about-us", "/mumbai", "/wp-content/uploads/x.png", "/blog/some-post", "/a/b/c", "/freelancer-seo-expert/unknown-place", "/contact-us.html"):
        assert public_seo.legacy_wordpress_target(path, legacy, CITY_MAP) is None, path


def test_google_profile_placeholders_are_replaced():
    from google_profile import google_profile_business
    stored = {
        "rating": "4.9", "reviews_count": "96", "reviews_verified": False,
        "google_maps_url": "https://www.google.com/maps/place/Gurgaon,+Haryana",
        "map_embed_url": "https://www.google.com/maps?q=Gurgaon,Haryana,India&output=embed",
        "founder_name": "Rajeev ",
    }
    out = google_profile_business(stored, DEFAULTS)
    assert out["reviews_verified"] is True
    assert out["rating"] == "5.0" and out["reviews_count"] == "13"
    assert "cid=10332082874224753124" in out["google_maps_url"]
    assert out["map_embed_url"].startswith("https://www.google.com/maps/embed?pb=")
    assert out["founder_name"] == "Rajeev "  # unrelated admin edits survive
    assert out["google_reviews"] and all(r["rating"] == 5 for r in out["google_reviews"])


def test_google_profile_admin_values_are_kept():
    from google_profile import google_profile_business
    stored = {"rating": "4.8", "reviews_count": "40", "reviews_verified": True, "map_embed_url": "https://www.google.com/maps/embed?pb=custom", "google_maps_url": "https://maps.app.goo.gl/x"}
    out = google_profile_business(stored, DEFAULTS)
    assert out["rating"] == "4.8" and out["reviews_count"] == "40"
    assert out["map_embed_url"].endswith("custom") and out["google_maps_url"].endswith("/x")
    hidden = google_profile_business({"rating": "3.9", "reviews_count": "2", "reviews_verified": False}, DEFAULTS)
    assert hidden["reviews_verified"] is False  # a deliberately hidden rating stays hidden


def test_google_profile_placeholder_wins_even_when_flag_merged_from_defaults():
    # Live case on 9 Nov 2026: the stored document had rating 4.9 / 96 reviews but
    # no reviews_verified key, so the merge with the defaults made it "verified".
    from google_profile import google_profile_business
    merged = {"rating": "4.9", "reviews_count": "96", "reviews_verified": True, "founder_name": "Rajeev "}
    out = google_profile_business(merged, DEFAULTS, {"rating": "4.9", "reviews_count": "96", "founder_name": "Rajeev "})
    assert (out["rating"], out["reviews_count"], out["reviews_verified"]) == ("5.0", "13", True)
    # A real figure typed by an admin without ticking "checked" stays hidden.
    real = google_profile_business({"rating": "4.7", "reviews_count": "21", "reviews_verified": True}, DEFAULTS, {"rating": "4.7", "reviews_count": "21"})
    assert real["reviews_verified"] is False and real["rating"] == "4.7"


def test_local_facts_layer_adds_unique_data_and_links():
    from location_facts import local_facts, local_facts_html, content_layer_date
    facts = local_facts("freelancer-seo-expert", "pune-india", path="/freelancer-seo-expert/pune-india")
    assert facts["place"]["country"] == "India" and facts["place"]["population"] > 1_000_000
    assert facts["time"]["timezone"] == "Asia/Kolkata"
    assert len(facts["nearby"]) >= 4 and all(n["path"].startswith("/freelance") for n in facts["nearby"])
    assert len(facts["sibling_services"]) == 7
    html = local_facts_html(facts)
    assert 'class="rf-local-facts"' in html or "rf-local-facts" in html
    assert html.count("<a href=") >= 15
    assert content_layer_date() == "2026-11-09"
    # Two different places never share the same facts block.
    other = local_facts_html(local_facts("freelancer-seo-expert", "berlin-germany", path="/freelancer-seo-expert/berlin-germany"))
    assert other != html and "Europe/Berlin" in other


def test_grouped_sitemap_index_has_named_children_with_lastmod():
    from sitemap_shards import render_grouped_sitemap_files
    groups = [
        ("core", {"/": {"lastmod": "2026-11-01"}}),
        ("places-base-freelancer-seo-expert", {f"/freelancer-seo-expert/p{i}-india": {"lastmod": "2026-11-09"} for i in range(3)}),
    ]
    out = render_grouped_sitemap_files(groups, "https://rajeevfreelancer.com")
    assert "<sitemapindex" in out["root_xml"]
    assert "/sitemaps/core.xml" in out["root_xml"] and "/sitemaps/places-base-freelancer-seo-expert.xml" in out["root_xml"]
    assert out["root_xml"].count("<lastmod>") == 2
    assert set(out["shards"]) == {"sitemaps/core.xml", "sitemaps/places-base-freelancer-seo-expert.xml"}
    assert out["shards"]["sitemaps/places-base-freelancer-seo-expert.xml"].count("<url>") == 3
