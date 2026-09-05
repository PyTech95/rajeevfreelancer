import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowUpRight, Globe } from "lucide-react";
import { waLink, CONTACT, SERVICES } from "@/data/site";
import { REGIONS, REGION_LIST } from "@/data/regions";
import { canonicalBase, faqSchema, breadcrumbSchema } from "@/lib/siteConfig";

export default function RegionLanding({ region: propRegion }) {
  const { region: paramRegion } = useParams();
  const code = propRegion || paramRegion;
  const t = REGIONS[code];
  const base = canonicalBase();

  useEffect(() => {
    if (t) document.documentElement.lang = t.htmlLang;
    return () => { document.documentElement.lang = "en"; };
  }, [t]);

  if (!t) return <Navigate to="/" replace />;

  return (
    <div data-testid={`region-page-${code}`} className="min-h-screen bg-paper">
      <Helmet>
        <html lang={t.htmlLang} />
        <title>{t.seo_title}</title>
        <meta name="description" content={t.seo_desc} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={`${base}/${code}`} />
        <link rel="alternate" hrefLang="en" href={`${base}/`} />
        <link rel="alternate" hrefLang="en-US" href={`${base}/us`} />
        <link rel="alternate" hrefLang="en-GB" href={`${base}/uk`} />
        <link rel="alternate" hrefLang="de" href={`${base}/de`} />
        <link rel="alternate" hrefLang="x-default" href={`${base}/`} />
        <meta property="og:site_name" content="Rajeev Freelancer" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${base}/${code}`} />
        <meta property="og:title" content={t.seo_title} />
        <meta property="og:description" content={t.seo_desc} />
        <meta property="og:locale" content={t.htmlLang.replace("-", "_")} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t.seo_title} />
        <meta name="twitter:description" content={t.seo_desc} />
        <script type="application/ld+json">{JSON.stringify(faqSchema(t.faqs))}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema([{ name: "Home", path: "/" }, { name: t.label, path: `/${code}` }]))}</script>
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="font-heading font-extrabold tracking-tight text-lg">Rajeev<span className="text-brand">.</span></Link>
          <div className="flex items-center gap-1 text-sm">
            <Globe className="h-4 w-4 text-brand" />
            <Link to="/" data-testid="region-switch-global" className="px-2 py-1 rounded text-ink/50 hover:text-ink">Global</Link>
            {REGION_LIST.map((r) => (
              <Link key={r.code} to={`/${r.code}`} data-testid={`region-switch-${r.code}`} className={`px-2 py-1 rounded ${r.code === code ? "text-ink font-semibold" : "text-ink/50 hover:text-ink"}`}>{r.label}</Link>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pt-20 pb-16">
        <p className="overline flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand" /> {t.hero_tag}</p>
        <h1 className="mt-6 max-w-4xl font-heading font-extrabold tracking-tighter text-5xl sm:text-6xl lg:text-7xl leading-[0.95]">{t.hero_title}</h1>
        <p className="mt-6 max-w-2xl text-lg text-ink/70 leading-relaxed">{t.hero_sub}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/contact" data-testid="region-cta-primary" className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-medium text-white hover:bg-ink transition-colors">{t.cta_primary} <ArrowUpRight className="h-4 w-4" /></Link>
          {t.show_whatsapp ? (
            <a href={waLink()} target="_blank" rel="noopener noreferrer" data-testid="region-cta-whatsapp" className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 font-medium hover:border-ink transition-colors">WhatsApp</a>
          ) : (
            <Link to="/contact" data-testid="region-cta-secondary" className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 font-medium hover:border-ink transition-colors">{t.cta_secondary}</Link>
          )}
        </div>
        <p className="mt-4 text-sm text-ink/50">{t.currency_note}</p>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-14 grid sm:grid-cols-3 gap-8">
          {t.proof.map((p) => (
            <div key={p.metric}>
              <p className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tighter text-brand">{p.metric}</p>
              <p className="mt-2 text-white/70 text-sm leading-relaxed">{p.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 py-16 md:py-24">
        <h2 className="font-heading font-extrabold tracking-tighter text-3xl sm:text-4xl">{t.approach_title}</h2>
        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          {t.approach.map((a) => (
            <div key={a.title} className="rounded-2xl border border-line bg-white p-6 hover:border-ink transition-colors">
              <p className="font-heading text-xl font-bold">{a.title}</p>
              <p className="mt-2 text-sm text-ink/60 leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-line">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-16 md:py-24">
          <h2 className="font-heading font-extrabold tracking-tighter text-3xl sm:text-4xl">{t.services_title}</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => (
              <Link key={s.slug} to={`/${s.slug}`} data-testid={`region-service-${s.slug}`} className="rounded-2xl border border-line p-6 hover:border-ink transition-colors group">
                <p className="font-heading text-xl font-bold group-hover:text-brand transition-colors">{s.name}</p>
                <p className="mt-2 text-sm text-ink/60 leading-relaxed">{s.tagline}</p>
              </Link>
            ))}
          </div>
          <h3 className="mt-16 font-heading font-extrabold tracking-tighter text-2xl">{t.cities_title}</h3>
          <div className="mt-6 flex flex-wrap gap-2">
            {t.cities.map((c) => (
              <Link key={c.loc} to={`/freelancer-seo-expert/${c.loc}`} data-testid={`region-city-${c.loc}`} className="rounded-full border border-line px-4 py-2 text-sm text-ink/70 hover:border-ink hover:text-ink transition-colors">{c.city}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 md:px-10 py-16 md:py-24" data-testid="region-faq">
        <h2 className="font-heading font-extrabold tracking-tighter text-3xl sm:text-4xl">FAQ</h2>
        <div className="mt-8 space-y-6">
          {t.faqs.map((f) => (
            <div key={f.q} className="border-b border-line pb-6">
              <p className="font-heading text-lg font-bold">{f.q}</p>
              <p className="mt-2 text-ink/70 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pb-20">
        <div className="rounded-2xl border border-line bg-white p-8 md:p-12 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tighter">{t.contact_title}</h2>
            <p className="mt-3 text-ink/60 leading-relaxed">{t.contact_sub}</p>
            {t.impressum_note ? <p className="mt-3 text-sm text-ink/50">{t.impressum_note}</p> : null}
          </div>
          <div className="flex flex-wrap lg:justify-end gap-3">
            <Link to="/contact" data-testid="region-contact-cta" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-ink transition-colors">{t.cta_primary} <ArrowUpRight className="h-4 w-4" /></Link>
            {t.show_whatsapp ? (
              <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-medium hover:border-ink transition-colors">WhatsApp · {CONTACT.whatsappDisplay}</a>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-10 text-center text-sm text-ink/50">
        © {new Date().getFullYear()} Rajeev Freelancer · <Link to="/" className="link-underline">Global site (English)</Link>
      </footer>
    </div>
  );
}
