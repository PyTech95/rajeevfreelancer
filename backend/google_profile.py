"""Google Business Profile facts shown on the site.

Everything here was read from the public listing (Maps CID 10332082874224753124)
on 2026-11-09. Update the snapshot from the listing; never edit review wording.
"""

GOOGLE_MAP_EMBED_URL = (
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d448557.6735738471!2d77.2005332!3d28.559045949999998"
    "!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x61cba1c16596fc7b%3A0x8f62eea1e41039e4"
    "!2sRajeev%20Freelancer%20-%20Website%20and%20App%20Development!5e0!3m2!1sen!2sin!4v1794202533313!5m2!1sen!2sin"
)

# Verbatim copies of the reviews that are publicly visible on the Google listing
# (checked 2026-11-09). Ratings-only reviews carry an empty text. Never edit the
# wording; refresh the list from the listing instead.
GOOGLE_REVIEWS_SNAPSHOT = [
    {
        "author": "SK Gupta",
        "rating": 5,
        "date": "2026-09",
        "text": (
            "Excellent work and highly recommended! I am very happy with the Bill Generation Software developed by Rajeev. "
            "He understood our requirements perfectly and delivered a smooth, user-friendly, and efficient billing solution.\n\n"
            "The software has made our bill generation process much faster and easier, saving us valuable time and reducing manual work. "
            "Rajeev was professional, responsive, and committed throughout the project.\n\n"
            "Thank you for the excellent work. I would definitely recommend Rajeev for software development projects.\n\n— Sanjay Gupta"
        ),
    },
    {
        "author": "Dheeraj Kumar",
        "rating": 5,
        "date": "2026-11",
        "text": (
            "I am Dheeraj, and I had the opportunity to receive online training from Rajeev Sir. The entire training experience was very good "
            "and informative. Rajeev Sir explained every topic clearly, with practical examples, making it easy to understand. His teaching style, "
            "knowledge, patience, and support made the learning experience smooth and effective.\n\nThank you, Rajeev Sir."
        ),
    },
    {"author": "intrinsicamerica", "rating": 5, "date": "2026-11", "text": "Excellent work. thank you Rajeev"},
    {"author": "Nek Sathi", "rating": 5, "date": "2026-09", "text": "He has done amazing work on Time - Thank you, Rajeev"},
    {"author": "Mohammad Asif", "rating": 5, "date": "2026-09", "text": "Amazing website creator"},
    {"author": "Akhilesh kumar Sah", "rating": 5, "date": "2026-11", "text": ""},
    {"author": "nstu india", "rating": 5, "date": "2026-09", "text": ""},
]

_LEGACY_MAP_URLS = ("maps?q=Gurgaon,Haryana,India&output=embed", "maps/place/Gurgaon,+Haryana")
_PLACEHOLDER_RATINGS = {"", "4.9"}
_PLACEHOLDER_REVIEW_COUNTS = {"", "96"}


def google_profile_business(business: dict, defaults: dict) -> dict:
    """Replace pre-launch placeholders stored in the settings document.

    Earlier builds shipped a generic Gurgaon map and an unverified "4.9 / 96
    reviews" placeholder that the admin had to switch off. The real listing now
    exists, so a stored generic map or an unverified placeholder rating is
    swapped for the checked snapshot. Values an admin entered deliberately
    (a different rating with the verified box ticked, or a custom map) are kept.
    """
    out = dict(business or {})
    for key in ("map_embed_url", "google_maps_url"):
        value = str(out.get(key) or "").strip()
        if not value or any(legacy in value for legacy in _LEGACY_MAP_URLS):
            out[key] = defaults[key]
    rating = str(out.get("rating") or "").strip()
    count = str(out.get("reviews_count") or "").strip()
    if not out.get("reviews_verified") and rating in _PLACEHOLDER_RATINGS and count in _PLACEHOLDER_REVIEW_COUNTS:
        out["rating"] = defaults["rating"]
        out["reviews_count"] = defaults["reviews_count"]
        out["reviews_verified"] = True
        out["reviews_checked_on"] = defaults["reviews_checked_on"]
    if not isinstance(out.get("google_reviews"), list) or not out["google_reviews"]:
        out["google_reviews"] = defaults["google_reviews"]
    for key in ("google_review_url", "google_place_cid", "show_map"):
        if out.get(key) in (None, ""):
            out[key] = defaults[key]
    return out


