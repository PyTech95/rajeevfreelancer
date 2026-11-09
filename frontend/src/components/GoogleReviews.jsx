import { ArrowUpRight, PenLine, Star } from "lucide-react";
import { useSiteSettings } from "@/context/SettingsContext";
import { googleProfileUrl } from "@/data/site";

// Google Business Profile reviews, shown from the snapshot in site settings
// (business.google_reviews). Everything here is copied verbatim from the public
// listing and is only shown while business.reviews_verified is true.
//
// Deliberately no Review / AggregateRating JSON-LD: Google treats reviews of a
// business placed on that business's own site as "self-serving" and does not
// allow them in structured data. The visible block is fine; the markup is not.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AVATAR_COLOURS = ["bg-brand", "bg-[#0F9D58]", "bg-coral", "bg-[#7C3AED]", "bg-[#F4B400]", "bg-ink"];

export function formatReviewMonth(value) {
  const match = /^(\d{4})-(\d{2})/.exec(String(value || ""));
  if (!match) return "";
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : "";
}

export function clampText(text, limit) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return { text: clean, truncated: false };
  const cut = clean.slice(0, limit);
  const atWord = cut.lastIndexOf(" ");
  return { text: `${cut.slice(0, atWord > limit * 0.6 ? atWord : limit).trim()}…`, truncated: true };
}

export function textReviews(business, max = 6) {
  const list = Array.isArray(business?.google_reviews) ? business.google_reviews : [];
  return list.filter((r) => r && String(r.text || "").trim()).slice(0, max);
}

function Stars({ count = 5, size = "h-4 w-4" }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} out of 5 stars`} role="img">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${size} ${i < count ? "fill-[#FBBC05] text-[#FBBC05]" : "text-ink/20"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

function ReviewCard({ review, index, limit, dark }) {
  const { text, truncated } = clampText(review.text, limit);
  const initial = String(review.author || "?").trim().charAt(0).toUpperCase();
  const month = formatReviewMonth(review.date);
  return (
    <figure
      data-testid={`google-review-${index}`}
      className={`flex h-full flex-col rounded-2xl border p-5 ${dark ? "border-white/10 bg-white/[0.04]" : "border-line bg-white"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Stars count={Number(review.rating) || 5} />
        {month && <span className={`font-mono text-[11px] uppercase tracking-wide ${dark ? "text-white/50" : "text-ink/45"}`}>{month}</span>}
      </div>
      <blockquote className={`mt-3 flex-1 text-sm leading-relaxed ${dark ? "text-white/80" : "text-ink/75"}`}>
        “{text}”
        {truncated && <span className={`ml-1 text-xs ${dark ? "text-white/50" : "text-ink/45"}`}>(read the full review on Google)</span>}
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_COLOURS[index % AVATAR_COLOURS.length]}`} aria-hidden="true">
          {initial}
        </span>
        <span>
          <span className={`block text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>{review.author}</span>
          <span className={`block text-xs ${dark ? "text-white/50" : "text-ink/50"}`}>Google review</span>
        </span>
      </figcaption>
    </figure>
  );
}

function RatingSummary({ business, dark, size = "lg" }) {
  const rating = String(business.rating || "").trim();
  const count = String(business.reviews_count || "").trim();
  const checked = formatReviewMonth(business.reviews_checked_on);
  const big = size === "lg";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="google-rating-summary">
      <span className={`font-heading font-extrabold tracking-tighter ${big ? "text-5xl" : "text-3xl"} ${dark ? "text-white" : "text-ink"}`}>{rating}</span>
      <span className="flex flex-col gap-1">
        <Stars count={Math.round(Number(rating) || 5)} size={big ? "h-5 w-5" : "h-4 w-4"} />
        <span className={`text-sm ${dark ? "text-white/60" : "text-ink/60"}`}>
          {count ? `${count} Google reviews` : "Google reviews"}
          {checked && <span className={dark ? "text-white/40" : "text-ink/40"}> · checked {checked}</span>}
        </span>
      </span>
    </div>
  );
}

function ReviewLinks({ business, dark }) {
  const readUrl = business.google_maps_url || googleProfileUrl();
  const writeUrl = business.google_review_url || googleProfileUrl();
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={readUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="google-reviews-read"
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${dark ? "bg-white text-ink hover:bg-brand hover:text-white" : "bg-ink text-white hover:bg-brand"}`}
      >
        Read all reviews on Google <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
      <a
        href={writeUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="google-reviews-write"
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${dark ? "border-white/25 text-white hover:border-white" : "border-ink/20 text-ink hover:border-ink"}`}
      >
        <PenLine className="h-4 w-4" aria-hidden="true" /> Write a review
      </a>
    </div>
  );
}

/**
 * variant="section": full-width block for the home page (heading + up to 5 cards).
 * variant="compact": card for the contact page sidebar (rating + 2 short reviews).
 */
export default function GoogleReviews({ variant = "section", max, label = "/ Google reviews", dark = false }) {
  const settings = useSiteSettings();
  const business = settings?.business || {};
  if (!business.reviews_verified) return null;
  const reviews = textReviews(business, max || (variant === "compact" ? 2 : 5));
  if (!reviews.length && !business.rating) return null;

  if (variant === "compact") {
    return (
      <div data-testid="google-reviews-compact" className={`rounded-2xl border p-5 ${dark ? "border-white/10 bg-white/[0.04]" : "border-line bg-white"}`}>
        <RatingSummary business={business} dark={dark} size="sm" />
        {reviews.length > 0 && (
          <ul className="mt-4 space-y-3">
            {reviews.map((r, i) => {
              const { text } = clampText(r.text, 150);
              return (
                <li key={`${r.author}-${i}`} className={`text-sm leading-relaxed ${dark ? "text-white/75" : "text-ink/70"}`}>
                  “{text}” <span className={`font-semibold ${dark ? "text-white" : "text-ink"}`}>— {r.author}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-5">
          <ReviewLinks business={business} dark={dark} />
        </div>
      </div>
    );
  }

  return (
    <section
      data-testid="google-reviews"
      aria-labelledby="google-reviews-heading"
      className={dark ? "bg-ink text-white" : "border-y border-ink/10 bg-[#f7f9fc]"}
    >
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">{label}</p>
            <h2 id="google-reviews-heading" className="mt-4 font-heading text-4xl font-bold tracking-[-0.04em] md:text-5xl">
              What clients say<br />on Google.
            </h2>
            <div className="mt-8">
              <RatingSummary business={business} dark={dark} />
            </div>
            <p className={`mt-5 max-w-sm text-sm leading-relaxed ${dark ? "text-white/60" : "text-ink/60"}`}>
              Reviews are copied word for word from the public Google Business Profile for Rajeev Freelancer, Delhi NCR. Worked with me? A short review helps other businesses find this page.
            </p>
            <div className="mt-8">
              <ReviewLinks business={business} dark={dark} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8 xl:grid-cols-3">
            {reviews.map((r, i) => (
              <ReviewCard key={`${r.author}-${i}`} review={r} index={i} limit={i === 0 ? 420 : 240} dark={dark} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
