import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowUpRight, ArrowLeft, Loader2, CalendarDays } from "lucide-react";
import Seo from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import NotFound from "@/pages/NotFound";
import { api } from "@/lib/api";
import { canonicalBase, getSiteConfig, breadcrumbSchema } from "@/lib/siteConfig";

export default function BlogPost() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null); setError(false); window.scrollTo(0, 0);
    api.get(`/blog/${slug}`).then(({ data }) => setData(data)).catch(() => setError(true));
  }, [slug]);

  if (error) return <NotFound />;
  if (!data) return <div className="pt-40 pb-32 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;

  const { post, related } = data;
  const cfg = getSiteConfig();
  const base = canonicalBase();
  const wordCount = (post.body || []).join(" ").split(/\s+/).filter(Boolean).length;
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return ""; }
  };
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.cover_image,
      articleSection: post.category,
      keywords: (post.tags || []).join(", "),
      wordCount,
      inLanguage: cfg.seo.default_locale || "en",
      datePublished: post.created_at,
      dateModified: post.updated_at,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/blog/${post.slug}` },
      author: { "@type": "Person", "@id": `${base}/#rajeev`, name: cfg.business.founder_name, url: base },
      publisher: { "@id": `${base}/#organization`, name: cfg.seo.site_name },
    },
    breadcrumbSchema([
      { name: "Home", path: "" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];

  return (
    <div>
      <Seo title={`${post.title} | ${cfg.seo.site_name}`} description={post.excerpt} path={`/blog/${post.slug}`} image={post.cover_image} type="article" jsonLd={jsonLd} />

      <article className="mx-auto max-w-3xl px-5 md:px-10 pt-32 md:pt-40 pb-20">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium link-underline"><ArrowLeft className="h-4 w-4" /> All insights</Link>
        <span className="mt-8 block font-mono text-xs uppercase tracking-wide text-brand">{post.category}</span>
        <h1 className="mt-3 font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl leading-[0.95]">{post.title}</h1>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink/60" data-testid="blog-byline">
          <span className="flex items-center gap-2">
            <img src={cfg.business.logo} alt={cfg.business.founder_name} className="h-8 w-8 rounded-full object-cover border border-line" />
            <span>By <strong className="text-ink font-semibold">{cfg.business.founder_name}</strong></span>
          </span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {fmtDate(post.created_at)}</span>
          {wordCount > 0 && <span className="font-mono text-xs">· {Math.max(1, Math.round(wordCount / 200))} min read</span>}
        </div>
        <p className="mt-5 text-lg text-ink/70 leading-relaxed">{post.excerpt}</p>
        <img src={post.cover_image} alt={post.title} className="mt-8 w-full rounded-2xl border border-line object-cover aspect-[16/9]" />
        <div className="mt-10 space-y-5 text-lg text-ink/80 leading-relaxed" data-testid="blog-body">
          {(post.body || []).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        {(post.tags || []).length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((t) => <span key={t} className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted-foreground">#{t}</span>)}
          </div>
        )}
        <div className="mt-12 rounded-2xl border border-line bg-paper p-8 text-center">
          <p className="font-heading text-2xl font-bold tracking-tight">Have a project like this?</p>
          <Link to="/contact" className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-medium text-white hover:bg-ink transition-colors">Get a free quote <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </article>

      {related?.length > 0 && (
        <section className="bg-white border-t border-line">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-16">
            <p className="overline">/ Keep reading</p>
            <div className="mt-8 grid sm:grid-cols-3 gap-5">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.06}>
                  <Link to={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper hover:border-ink transition-colors">
                    <div className="aspect-[16/10] overflow-hidden"><img src={p.cover_image} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                    <div className="p-5"><span className="font-mono text-[11px] uppercase text-brand">{p.category}</span><h3 className="mt-2 font-heading text-lg font-bold leading-snug">{p.title}</h3></div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
