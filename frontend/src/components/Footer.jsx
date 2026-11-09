import Link from "@/components/CanonicalLink";

import { ArrowUpRight, Linkedin, Github, Twitter, Youtube, Instagram, Facebook, MapPin, Star } from "lucide-react";
import { SERVICES, FEATURED_CITIES, CONTACT, waLink, googleProfileUrl } from "@/data/site";
import { useSiteSettings } from "@/context/SettingsContext";

const SOCIAL_ICONS = { linkedin: Linkedin, github: Github, twitter: Twitter, youtube: Youtube, instagram: Instagram, facebook: Facebook };

export default function Footer() {
  const settings = useSiteSettings();
  const social = settings?.social || {};
  const business = settings?.business || {};
  const socialLinks = Object.entries(social).filter(([, url]) => url);
  // The map shows the Google Business Profile listing itself (a service-area
  // business), so it does not depend on a walk-in office being verified.
  const showMap = business.show_map !== false && !!business.map_embed_url;
  const reviewsLine = business.reviews_verified && business.rating
    ? `${business.rating}/5${business.reviews_count ? ` from ${business.reviews_count} reviews` : ""}`
    : "";

  return (
    <footer data-testid="site-footer" className="bg-ink text-white">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-20 md:pt-28 pb-10">
        <div className="grid lg:grid-cols-2 gap-12 pb-16 border-b border-white/10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65">/ Ready when you are</p>
            <h2 className="mt-5 font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
              Let's build<br />something that<br /><span className="text-brand">actually ranks.</span>
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" data-testid="footer-contact-cta" className="inline-flex items-center gap-2 rounded-full bg-white text-ink px-6 py-3 font-medium hover:bg-brand hover:text-white transition-colors duration-300">
                Book a free consultation <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp-cta" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-medium hover:border-white transition-colors duration-300">
                Chat on WhatsApp
              </a>
            </div>
            {socialLinks.length > 0 && (
              <div className="mt-8 flex items-center gap-3" data-testid="footer-social">
                {socialLinks.map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key] || ArrowUpRight;
                  return (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={key} data-testid={`social-${key}`}
                       className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 hover:border-white hover:text-white transition-colors">
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65 mb-4">Services</p>
              <ul className="space-y-2.5">
                {SERVICES.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/${s.slug}`} className="text-white/70 hover:text-white transition-colors">{s.short}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65 mb-4">Working areas</p>
              <ul className="space-y-2.5">
                {FEATURED_CITIES.slice(0, 6).map((c) => (
                  <li key={c.loc_slug}>
                    <Link to={`/freelance-seo-expert/${c.loc_slug}`} className="text-white/70 hover:text-white transition-colors">{c.city}</Link>
                  </li>
                ))}
                <li><Link to="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing & Packages</Link></li>
                <li><Link to="/free-quote" data-testid="footer-free-quote" className="text-white/70 hover:text-white transition-colors">Get a free quote</Link></li>
                <li><Link to="/work" className="text-white/70 hover:text-white transition-colors">Our work</Link></li>
                <li><Link to="/case-studies" className="text-white/70 hover:text-white transition-colors">Case studies</Link></li>
                <li><Link to="/locations" className="text-[#8fb3ff] hover:text-white transition-colors">All locations →</Link></li>
                <li><Link to="/us" className="text-white/70 hover:text-white transition-colors">USA clients</Link></li>
                <li><Link to="/uk" className="text-white/70 hover:text-white transition-colors">UK clients</Link></li>
                <li><Link to="/de" className="text-white/70 hover:text-white transition-colors">Deutschland</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65 mb-4">Contact</p>
              <ul className="space-y-2.5 text-white/70">
                <li><a href={waLink()} target="_blank" rel="noopener noreferrer" className="hover:text-white">{CONTACT.whatsappDisplay}</a></li>
                <li><a href={`mailto:${CONTACT.email}`} className="hover:text-white break-all">{CONTACT.email}</a></li>
                <li><a href={googleProfileUrl()} target="_blank" rel="noopener noreferrer" data-testid="footer-google-link" className="inline-flex items-center gap-1.5 hover:text-white"><Star className="h-3.5 w-3.5 fill-[#FBBC05] text-[#FBBC05]" /> {reviewsLine ? `${business.rating}/5 on Google` : "Find us on Google"}</a></li>
                {business.customer_facing_office_verified && business.google_maps_url && (
                  <li><a href={business.google_maps_url} target="_blank" rel="noopener noreferrer" data-testid="footer-map-link" className="inline-flex items-center gap-1 hover:text-white"><MapPin className="h-3.5 w-3.5 text-brand" /> {business.address || "View on map"}</a></li>
                )}
                <li><Link to="/about" className="hover:text-white">About Rajeev</Link></li>
                <li><Link to="/admin" className="hover:text-white text-white/60">Admin</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {showMap && (
          <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:items-center" data-testid="footer-map">
            <div className="lg:col-span-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65">/ On Google Maps</p>
              <h3 className="mt-4 font-heading text-2xl font-bold tracking-tight">Rajeev Freelancer · Delhi NCR</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                A service-area business based in {business.address || "Gurgaon, India"}: I work with clients across Delhi, Gurugram, Noida, Faridabad and Ghaziabad, and remotely worldwide.
                {reviewsLine && <> Rated <strong className="text-white">{reviewsLine}</strong> on Google.</>}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <a href={business.google_maps_url || googleProfileUrl()} target="_blank" rel="noopener noreferrer" data-testid="footer-map-open" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 hover:border-white transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-brand" /> Open in Google Maps
                </a>
                {business.google_review_url && (
                  <a href={business.google_review_url} target="_blank" rel="noopener noreferrer" data-testid="footer-write-review" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 hover:border-white transition-colors">
                    <Star className="h-3.5 w-3.5 fill-[#FBBC05] text-[#FBBC05]" /> Write a review
                  </a>
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 lg:col-span-8">
              <iframe
                title="Rajeev Freelancer on Google Maps — Delhi NCR service area"
                src={business.map_embed_url}
                className="block h-64 w-full md:h-80"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/60 font-mono">
          <span>© {new Date().getFullYear()} {settings?.seo?.site_name || "Rajeev Freelancer"} — Senior Freelance Engineer & AI/Digital Marketing Consultant.</span>
          <span>Available worldwide · Based in {business.address || "Gurgaon, India"}</span>
        </div>
      </div>
    </footer>
  );
}
