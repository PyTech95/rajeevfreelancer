import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import Seo from "@/components/Seo";
import { Reveal, MaskLines } from "@/components/Reveal";
import TiltCard from "@/components/TiltCard";
import { CASE_STUDIES, CS_CATEGORIES, fetchCaseStudies } from "@/data/caseStudies";
import { canonicalBase, breadcrumbSchema } from "@/lib/siteConfig";

export default function CaseStudies() {
  const base = canonicalBase();
  const [active, setActive] = useState("All");
  const [all, setAll] = useState(CASE_STUDIES);
  useEffect(() => { fetchCaseStudies().then(setAll); }, []);
  const filtered = active === "All" ? all : all.filter((c) => c.category === active);
  const jsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "" },
      { name: "Case Studies", path: "/case-studies" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Case Studies — Rajeev Freelancer",
      url: `${base}/case-studies`,
      hasPart: all.map((c) => ({
        "@type": "CreativeWork",
        name: c.title,
        url: `${base}/case-studies/${c.slug}`,
        about: c.industry,
      })),
    },
  ];

  return (
    <div>
      <Seo
        title="Case Studies — Real Results with Numbers | Rajeev Freelancer"
        description="See how Rajeev delivered 3× organic traffic, 80% faster support and +52% conversion. Real freelance web, SEO, AI and automation case studies with the numbers."
        path="/case-studies"
        jsonLd={jsonLd}
      />

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pt-32 md:pt-40 pb-14">
        <p className="overline flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-brand" /> / Case studies</p>
        <h1 className="mt-6 font-heading font-extrabold tracking-tighter text-5xl sm:text-6xl lg:text-[4.6rem] leading-[0.9]">
          <MaskLines lines={["Results,", "not adjectives."]} />
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-ink/70 leading-relaxed">
          A few engagements, told through the numbers that mattered to the client. Every figure below is a real outcome from real work.
        </p>
        <div className="mt-10 flex flex-wrap gap-2" data-testid="case-study-filters">
          {CS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              data-testid={`case-filter-${cat.toLowerCase()}`}
              aria-pressed={active === cat}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                active === cat ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/70 hover:border-ink hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pb-24 grid md:grid-cols-3 gap-4" data-testid="case-studies-grid">
        {filtered.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.08}>
            <TiltCard className="h-full">
              <Link
                to={`/case-studies/${c.slug}`}
                data-testid={`case-study-card-${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white hover:border-ink transition-[border-color] duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={c.cover} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink backdrop-blur">{c.tag}</span>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="font-heading text-5xl font-extrabold tracking-tighter text-brand">{c.metric}</p>
                  <p className="mt-1 text-sm text-ink/55">{c.metricLabel}</p>
                  <h2 className="mt-5 font-heading text-xl font-bold tracking-tight leading-snug">{c.title}</h2>
                  <p className="mt-3 flex-1 text-sm text-ink/60 leading-relaxed line-clamp-3">{c.excerpt}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:text-brand transition-colors">
                    Read the case study <ArrowUpRight className="h-4 w-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </TiltCard>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
