import { Helmet } from "react-helmet-async";
import { getSiteConfig, canonicalBase } from "@/lib/siteConfig";

export default function Seo({ title, description, path = "/", image, jsonLd, noindex = false, type = "website" }) {
  const cfg = getSiteConfig();
  const base = canonicalBase();
  const canonical = `${base}${path}`;
  const seoTitle = title || cfg.seo.default_title;
  const seoDesc = description || cfg.seo.default_description;
  const ogImage = image || cfg.seo.og_image;
  const locales = Array.isArray(cfg.seo.locales) && cfg.seo.locales.length ? cfg.seo.locales : [cfg.seo.default_locale];
  const robots = noindex || cfg.seo.robots_index === false ? "noindex, nofollow" : "index, follow";
  const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <html lang={cfg.seo.default_locale} />
      <title>{seoTitle}</title>
      <meta name="description" content={seoDesc} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      {/* Geo / language targeting */}
      {locales.map((lc) => (
        <link key={lc} rel="alternate" hrefLang={lc} href={canonical} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Open Graph */}
      <meta property="og:site_name" content={cfg.seo.site_name} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={cfg.seo.default_locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDesc} />
      <meta name="twitter:image" content={ogImage} />
      {cfg.seo.twitter_handle ? <meta name="twitter:site" content={cfg.seo.twitter_handle} /> : null}

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(block)}</script>
      ))}
    </Helmet>
  );
}
