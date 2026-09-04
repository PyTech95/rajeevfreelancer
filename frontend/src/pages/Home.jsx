import { useRef, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowRight, Bot, TrendingUp, Search, Code, Terminal, MessageCircle, Smartphone, Sparkles, Star, MapPin } from "lucide-react";
import Seo from "@/components/Seo";
import { Reveal, MaskLines } from "@/components/Reveal";
import Counter from "@/components/Counter";
import SkillMarquee from "@/components/Marquee";
import ProofStrip from "@/components/ProofStrip";
import OffersStrip from "@/components/OffersStrip";
import Marquee from "react-fast-marquee";
import ImageMarquee from "@/components/ImageMarquee";
import ContactForm from "@/components/ContactForm";
import Magnetic from "@/components/Magnetic";
import TiltCard from "@/components/TiltCard";
import { api } from "@/lib/api";
import { SERVICES, STATS, FEATURED_CITIES, NCR_AREAS, waLink, CONTACT, GOOGLE_PROFILE } from "@/data/site";
import { faqSchema, localBusinessSchema, REVIEWS } from "@/lib/siteConfig";
import { CASE_STUDIES, fetchCaseStudies } from "@/data/caseStudies";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/3327718a-0568-430d-b33e-b56e7bf18cf5/images/ae2327f0d36b153d0e93995e46712d36f89e61ccbf64b1b29bb83ddfa02c5165.jpeg";
const ABOUT_IMG = "https://customer-assets-gfyr7b9c.emergentagent.net/job_rajeev-seo-hub/artifacts/whqtfhxo_image.png";
const WORK_1 = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";
const WORK_2 = "https://images.unsplash.com/photo-1674027444485-cec3da58eef4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwyfHxhaSUyMGF1dG9tYXRpb24lMjBhYnN0cmFjdCUyMG5vZGV8ZW58MHx8fHwxNzg2OTk0MDQ0fDA&ixlib=rb-4.1.0&q=85";
const WORK_3 = "https://images.unsplash.com/photo-1553877522-43269d4ea984?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2UlMjBkZXZlbG9wZXIlMjBjb25zdWx0YW50JTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc4Njk5NDA0NHww&ixlib=rb-4.1.0&q=85";

const ICONS = { Bot, TrendingUp, Search, Code, Terminal, MessageCircle, Smartphone };

const BAND_IMG = "https://images.unsplash.com/photo-1681949287382-052ea3954a51?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600";

const PILLARS = [
  { icon: Search, tag: "SEO", title: "Rank on Google", text: "Technical SEO, content and location pages engineered for Core Web Vitals, schema and links — so you climb to page one and stay there." },
  { icon: Sparkles, tag: "GEO", title: "Get cited by AI", text: "Generative Engine Optimization: entity-rich, structured content and FAQs so ChatGPT, Gemini and Google's AI Overviews recommend your business by name." },
  { icon: Bot, tag: "AI", title: "Automate the busywork", text: "Chatbots, AI agents and workflow automation that qualify leads, reply to customers and save hours of manual work every week." },
];

const MANIFESTO = [
  { n: "01", title: "Discover", text: "A free consultation and a deep audit. We find where growth is leaking — technically, and in the market — before writing a line of code or copy." },
  { n: "02", title: "Build", text: "Senior, hands-on execution. Websites, software, SEO and AI automation shipped deliberately, with the invisible parts made as good as the visible ones." },
  { n: "03", title: "Scale", text: "Instrumentation, reporting over WhatsApp, and relentless optimisation. Distribution treated as a system that compounds — not a one-off campaign." },
];

const TESTIMONIALS = REVIEWS;

// Answer-first Q&A — engineered for Google rich results AND AI-answer citation (GEO/AEO).
const HOME_FAQS = [
  { q: "Who is Rajeev Freelancer?", a: "Rajeev is a senior freelance engineer and AI/digital-marketing consultant with 12+ years of experience (ex-IOG, Accenture, Google). He builds websites and custom software and runs SEO, GEO, AI automation and WhatsApp/SMS marketing for businesses in 27+ countries." },
  { q: "What services does Rajeev offer?", a: "Web development, custom software and mobile apps, SEO and GEO (AI-search optimization), digital marketing, AI automation and chatbots, plus WhatsApp and SMS marketing — all delivered personally, senior-only." },
  { q: "How much does it cost to hire Rajeev?", a: "Every project starts with a free consultation and a fixed-scope proposal, so there are no surprises. Pricing depends on scope; most engagements begin between $1k and $10k, with larger builds quoted individually. See the pricing page for currency-localised ranges." },
  { q: "Where is Rajeev based and does he work remotely?", a: "Rajeev is based in Gurgaon, India and works remotely with founders and teams worldwide, having served clients across 27+ countries. Communication is fast and time-zone aware, primarily over WhatsApp." },
  { q: "What is GEO and how is it different from SEO?", a: "SEO helps you rank in classic search results. GEO (Generative Engine Optimization) makes your business get cited and recommended inside AI answers from ChatGPT, Gemini, Perplexity and Google's AI Overviews, using entity-rich, structured, question-and-answer content." },
  { q: "How quickly will I see results?", a: "You get a clear roadmap in week one and typically early wins within the first month. SEO and GEO compound over 3–6 months, while automation and website improvements often deliver immediate efficiency and conversion gains." },
  { q: "How fast does Rajeev respond?", a: "Usually within the hour during business hours. WhatsApp is the fastest channel, and you deal with Rajeev directly — no account managers or offshore relays." },
  { q: "How do we get started?", a: "Book a free consultation or message on WhatsApp with a short project brief. You'll get a fixed-scope proposal, typically within a day, and can start once you're happy with the plan." },
];

const CLIENTS = [
  { name: "SkinLuxe", industry: "D2C Beauty", cls: "font-heading font-extrabold tracking-tight" },
  { name: "Nimbus", industry: "B2B SaaS", cls: "font-heading font-semibold tracking-[0.2em] uppercase text-sm" },
  { name: "Souk & Co.", industry: "Retail", cls: "font-heading font-bold italic tracking-tight" },
  { name: "SpiceRoute", industry: "F&B", cls: "font-heading font-black tracking-tighter" },
  { name: "FitPulse", industry: "Fitness", cls: "font-heading font-bold tracking-tight lowercase" },
  { name: "Meridian", industry: "B2B Services", cls: "font-heading font-medium tracking-[0.15em] uppercase text-sm" },
];

export default function Home() {
  const [insights, setInsights] = useState([]);
  useEffect(() => {
    api.get("/blog").then(({ data }) => setInsights((data.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  // Rotate which 3 case studies show, advancing by one each visit so repeat visitors see fresh proof.
  const [caseList, setCaseList] = useState(CASE_STUDIES);
  useEffect(() => { fetchCaseStudies().then(setCaseList); }, []);
  const [swOffset] = useState(() => {
    let o = 0;
    try { o = parseInt(localStorage.getItem("sw_rot") || "0", 10) || 0; localStorage.setItem("sw_rot", String((o + 1) % 6)); } catch { /* privacy mode */ }
    return o;
  });
  const selectedWork = useMemo(
    () => Array.from({ length: 3 }, (_, k) => caseList[(swOffset + k) % caseList.length]).filter(Boolean),
    [caseList, swOffset]
  );

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  const portRef = useRef(null);
  const { scrollYProgress: pp } = useScroll({ target: portRef, offset: ["start end", "end start"] });
  const py1 = useTransform(pp, [0, 1], [50, -50]);
  const py2 = useTransform(pp, [0, 1], [80, -60]);
  const py3 = useTransform(pp, [0, 1], [30, -80]);

  return (
    <div>
      <Seo
        title="Rajeev Freelancer — Freelance Web, App, SEO & AI Marketing Expert | Delhi NCR & Worldwide"
        description="Hire Rajeev — a senior freelance web & app developer, SEO expert and AI/digital-marketing consultant with 12+ years' experience. Based in Gurgaon, serving Delhi NCR, Noida, Faridabad & clients worldwide. Websites from ₹4,999, same-day delivery. Free quote."
        path="/"
        alternates={[
          { lang: "en", path: "/" },
          { lang: "hi", path: "/hi" },
          { lang: "ar", path: "/ar" },
          { lang: "es", path: "/es" },
          { lang: "fr", path: "/fr" },
        ]}
        jsonLd={[
          faqSchema(HOME_FAQS),
          localBusinessSchema({
            city: "Gurgaon",
            country: "India",
            path: "/",
            name: "Freelance web & app development, SEO, GEO and digital marketing based in Gurgaon, serving all of Delhi NCR and clients worldwide.",
            areaServed: ["Delhi", "Gurgaon", "Noida", "Greater Noida", "Faridabad", "Ghaziabad"],
            reviews: REVIEWS.slice(0, 3),
          }),
        ]}
      />

      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24">
        <div className="aurora" />
        <div className="orb w-[460px] h-[460px] bg-brand/25 -top-24 -left-16" style={{ animation: "float-a 15s ease-in-out infinite" }} />
        <div className="orb w-[380px] h-[380px] bg-coral/15 top-1/2 right-[26%]" style={{ animation: "float-b 18s ease-in-out infinite" }} />
        <div className="orb w-[300px] h-[300px] bg-[#7c5cff]/15 -bottom-24 left-1/3" style={{ animation: "float-a 20s ease-in-out infinite" }} />
        <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="overline flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" /> Available · 2026 · Based in Gurgaon, open worldwide
            </motion.p>
            <h1 className="mt-6 font-heading font-extrabold tracking-tighter text-[13vw] leading-[0.86] sm:text-6xl lg:text-[5.4rem]">
              <MaskLines lines={["Design. Build.", <>Market. <span className="text-shimmer">Scale.</span></>]} delay={0.15} />
            </h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }} className="mt-7 max-w-xl text-base md:text-lg text-ink/70 leading-relaxed">
              I'm a senior freelance engineer & consultant with 12+ years turning websites, software, SEO, digital marketing and AI automation into revenue — for businesses in {FEATURED_CITIES.length}+ cities worldwide.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.7 }} className="mt-9 flex flex-wrap gap-3">
              <Magnetic>
                <Link to="/contact" data-testid="hero-quote-btn" className="btn-shine inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-medium text-white hover:bg-ink transition-colors duration-300">
                  Get your free quote <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Magnetic>
                <a href={waLink()} target="_blank" rel="noopener noreferrer" data-testid="hero-whatsapp-btn" className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-7 py-3.5 font-medium hover:border-ink transition-colors duration-300">
                  WhatsApp now
                </a>
              </Magnetic>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-coral text-coral" /> 4.9/5 · 96 reviews</span>
              <span className="font-mono text-xs">Ex-IOG · Accenture · Google</span>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="mt-12 hidden md:flex items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span className="relative flex h-8 w-5 items-start justify-center rounded-full border border-ink/25 pt-1.5">
                <span className="scroll-cue-dot h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              Scroll to explore
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-white">
              <motion.img
                src={HERO_IMG}
                alt="Abstract network illustrating AI-powered engineering and marketing"
                style={{ y: imgY, scale: imgScale }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Avg. response</p>
                    <p className="font-heading text-2xl font-bold">under 30 min</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Projects</p>
                    <p className="font-heading text-2xl font-bold">180+</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <SkillMarquee />
      <OffersStrip />
      <ProofStrip />

      {/* LOCAL — Delhi NCR internal-link band (local SEO signal + link equity to the /delhi-ncr hub) */}
      <section className="bg-white border-y border-line" data-testid="home-local-ncr">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-16 md:py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <Reveal><p className="overline flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand" /> / Local to Delhi NCR</p></Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 max-w-2xl font-heading font-extrabold tracking-tighter text-3xl sm:text-4xl lg:text-5xl leading-[0.95]">
                  A freelance web developer, SEO expert & marketer in <span className="text-shimmer">Delhi NCR</span>.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-ink/70 leading-relaxed">
                  Based in Gurgaon and working across Delhi, Noida, Greater Noida, Faridabad and Ghaziabad — websites, mobile apps, SEO, Google Ads and AI automation for local businesses. Same-day websites from <strong>₹4,999</strong>, direct and senior-only.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <Link to="/delhi-ncr" data-testid="home-ncr-hub-link" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-medium text-white hover:bg-ink transition-colors duration-300">
                  Explore Delhi NCR services <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>
            <div className="lg:col-span-6">
              <Reveal delay={0.1}>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40">Popular local searches</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {[
                    { label: "Web developer in Gurgaon", to: "/freelance-website-developer/gurgaon-india" },
                    { label: "SEO expert in Noida", to: "/freelance-seo-expert/noida-india" },
                    { label: "App developer in Delhi", to: "/freelance-app-developer/delhi-india" },
                    { label: "Digital marketing in Faridabad", to: "/freelance-digital-marketing-consultant/faridabad-india" },
                    { label: "AI consultant in Ghaziabad", to: "/freelance-ai-consultant/ghaziabad-india" },
                    { label: "WhatsApp marketing in Gurgaon", to: "/whatsapp-marketing-freelancer/gurgaon-india" },
                    { label: "Website developer in Greater Noida", to: "/freelance-website-developer/greater-noida-india" },
                    { label: "SEO expert in Delhi", to: "/freelance-seo-expert/delhi-india" },
                  ].map((l) => (
                    <Link key={l.to} to={l.to} data-testid={`home-ncr-search-${l.to.split("/").pop()}`} className="inline-flex items-center rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink/70 hover:border-ink hover:text-ink transition-colors">
                      {l.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5">
                  {NCR_AREAS.slice(0, 12).map((a) => (
                    <Link key={a.slug} to={`/freelance-website-developer/${a.slug}`} className="text-xs text-ink/45 hover:text-brand link-underline">{a.city}</Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-32">
        <Reveal><p className="overline">/ 001 — How I work</p></Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-3xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
            A senior craftsman who happens to freelance.
          </h2>
        </Reveal>
        <div className="mt-16 grid md:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden">
          {MANIFESTO.map((m, i) => (
            <Reveal key={m.n} delay={i * 0.1} className="bg-paper">
              <div className="h-full p-8 md:p-10 group hover:bg-white transition-colors duration-500">
                <span className="font-mono text-sm text-brand">{m.n}</span>
                <h3 className="mt-6 font-heading text-2xl md:text-3xl font-bold tracking-tight">{m.title}</h3>
                <p className="mt-4 text-ink/70 leading-relaxed">{m.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <ImageMarquee />

      {/* SEO · GEO · AI */}
      <section className="bg-brand/[0.04] border-y border-line">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-32">
          <Reveal><p className="overline">/ 002 — Built for how people search in 2026</p></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 max-w-3xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
              SEO, <span className="text-shimmer">GEO</span> & AI —<br />the new growth stack.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-ink/70 leading-relaxed">
              People don't just Google anymore — they ask AI. I make sure your business shows up in classic search, gets recommended inside AI answers, and runs on automation that never sleeps.
            </p>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {PILLARS.map((p, i) => (
              <Reveal key={p.tag} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-line bg-white p-8 hover:-translate-y-1 hover:border-ink transition-[transform,border-color] duration-300">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand"><p.icon className="h-6 w-6" /></span>
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{p.tag}</span>
                  </div>
                  <h3 className="mt-7 font-heading text-2xl font-bold tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-ink/65 leading-relaxed">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES BENTO */}
      <section className="bg-white border-y border-line">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal><p className="overline">/ 002 — Services</p></Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 max-w-2xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
                  Six disciplines.<br />One studio.
                </h2>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <Link to="/services" className="inline-flex items-center gap-2 text-sm font-medium link-underline">
                All services <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s, i) => {
              const Icon = ICONS[s.icon] || Code;
              const wide = i === 0 || i === 5;
              return (
                <Reveal key={s.slug} delay={(i % 3) * 0.08} className={wide ? "lg:col-span-1" : ""}>
                  <TiltCard className="h-full">
                  <Link
                    to={`/${s.slug}`}
                    data-testid={`service-card-${s.slug}`}
                    onMouseMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                      e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                    }}
                    className="spotlight-card group flex h-full flex-col justify-between rounded-2xl border border-line bg-paper p-7 hover:border-ink transition-[border-color] duration-300"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white group-hover:rotate-6 transition-[transform,background-color,color] duration-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-brand group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-[transform,color]" />
                    </div>
                    <div className="relative z-10 mt-10">
                      <h3 className="font-heading text-xl md:text-2xl font-bold tracking-tight">{s.name}</h3>
                      <p className="mt-2 text-sm text-ink/60 leading-relaxed">{s.tagline}</p>
                    </div>
                  </Link>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PORTFOLIO SPOTLIGHT */}
      <section ref={portRef} className="relative mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-32">
        <Reveal><p className="overline">/ 003 — Selected work</p></Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-3xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
            Twelve years, condensed.
          </h2>
        </Reveal>
        <div className="mt-14 grid lg:grid-cols-12 gap-4">
          <Reveal className="lg:col-span-7">
            <figure className="group relative overflow-hidden rounded-2xl border border-line aspect-[16/10]">
              <motion.img style={{ y: py1 }} src={WORK_1} alt="Analytics dashboard SEO growth case study" className="absolute inset-0 h-[124%] w-full object-cover" />
              <figcaption className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-ink/85 to-transparent text-white z-10">
                <p className="font-mono text-xs uppercase tracking-widest opacity-80">SEO · Analytics</p>
                <p className="font-heading text-xl font-bold">3× organic traffic in 5 months</p>
              </figcaption>
            </figure>
          </Reveal>
          <div className="lg:col-span-5 grid gap-4">
            <Reveal delay={0.08}>
              <figure className="group relative overflow-hidden rounded-2xl border border-line aspect-[16/9]">
                <motion.img style={{ y: py2 }} src={WORK_2} alt="AI automation node network project" className="absolute inset-0 h-[130%] w-full object-cover" />
                <figcaption className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-ink/85 to-transparent text-white z-10">
                  <p className="font-mono text-xs uppercase tracking-widest opacity-80">AI Automation</p>
                  <p className="font-heading text-lg font-bold">Support bot cut response time 80%</p>
                </figcaption>
              </figure>
            </Reveal>
            <Reveal delay={0.16}>
              <figure className="group relative overflow-hidden rounded-2xl border border-line aspect-[16/9]">
                <motion.img style={{ y: py3 }} src={WORK_3} alt="Custom web application development project" className="absolute inset-0 h-[130%] w-full object-cover" />
                <figcaption className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-ink/85 to-transparent text-white z-10">
                  <p className="font-mono text-xs uppercase tracking-widest opacity-80">Web · Software</p>
                  <p className="font-heading text-lg font-bold">Custom platform, sub-second loads</p>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-28 grid grid-cols-2 lg:grid-cols-4 gap-10">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <p className="font-heading text-5xl md:text-7xl font-extrabold tracking-tighter">
                <Counter value={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
              </p>
              <p className="mt-3 text-sm text-white/50 uppercase tracking-wide font-mono">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SELECTED WORK — case study teaser */}
      <section className="bg-paper border-y border-line" data-testid="home-selected-work">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal><p className="overline">/ Selected work</p></Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 max-w-3xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
                  Proof, with numbers.
                </h2>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <Link to="/case-studies" data-testid="selected-work-all" className="inline-flex items-center gap-1.5 text-sm font-medium link-underline">All case studies <ArrowUpRight className="h-4 w-4" /></Link>
            </Reveal>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {selectedWork.map((cs, i) => (
              <Reveal key={cs.slug} delay={i * 0.08}>
                <TiltCard className="h-full">
                  <Link to={`/case-studies/${cs.slug}`} data-testid={`selected-work-${cs.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white hover:border-ink transition-colors duration-300">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={cs.cover} alt={cs.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink backdrop-blur">{cs.tag}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="font-heading text-5xl font-extrabold tracking-tighter text-brand">{cs.metric}</p>
                      <p className="mt-1 text-sm text-ink/55">{cs.metricLabel}</p>
                      <h3 className="mt-4 font-heading text-lg font-bold tracking-tight leading-snug">{cs.title}</h3>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:text-brand transition-colors">Read the case study <ArrowUpRight className="h-4 w-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /></span>
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT / INDUSTRY LOGOS */}
      <section className="border-b border-line bg-white" data-testid="home-clients">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-12">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-ink/40">
            Teams &amp; brands I've delivered for
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16">
            {CLIENTS.map((c) => (
              <div key={c.name} className="group flex flex-col items-center" title={c.industry}>
                <span className={`text-ink/35 group-hover:text-ink transition-colors duration-300 text-2xl ${c.cls}`}>{c.name}</span>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/25 group-hover:text-brand transition-colors">{c.industry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — auto-scrolling social proof */}
      <section className="py-20 md:py-32 overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal><p className="overline">/ 004 — What people say</p></Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal delay={0.05}>
              <h2 className="mt-5 max-w-3xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
                The quiet part, out loud.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <a href={GOOGLE_PROFILE} target="_blank" rel="noopener noreferrer" data-testid="home-google-reviews" className="inline-flex items-center gap-2 text-sm font-medium link-underline">
                <Star className="h-4 w-4 fill-coral text-coral" /> 4.9/5 · 96 reviews on Google
              </a>
            </Reveal>
          </div>
        </div>
        <div className="mt-14" data-testid="testimonials-marquee">
          <Marquee speed={38} gradient gradientColor="#F7F6F2" gradientWidth={120} pauseOnHover autoFill>
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="mx-3 flex h-full w-[380px] flex-col justify-between rounded-2xl border border-line bg-white p-7">
                <div>
                  <div className="flex gap-0.5">{[...Array(t.rating || 5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-coral text-coral" />)}</div>
                  <blockquote className="mt-5 font-heading text-lg font-medium leading-snug tracking-tight">"{t.quote}"</blockquote>
                </div>
                <figcaption className="mt-7 flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}{t.location ? ` · ${t.location}` : ""}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </Marquee>
        </div>
      </section>

      {/* LATEST INSIGHTS */}
      {insights.length > 0 && (
        <section className="bg-paper border-y border-line" data-testid="home-insights">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Reveal><p className="overline flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-brand" /> / Latest insights</p></Reveal>
                <Reveal delay={0.05}>
                  <h2 className="mt-5 max-w-2xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">Ideas that rank.</h2>
                </Reveal>
              </div>
              <Reveal delay={0.1}>
                <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium link-underline">Read the blog <ArrowRight className="h-4 w-4" /></Link>
              </Reveal>
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {insights.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.06}>
                  <Link to={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white hover:border-ink hover:-translate-y-1 transition-[transform,border-color] duration-300">
                    <div className="aspect-[16/10] overflow-hidden bg-paper"><img src={p.cover_image} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                    <div className="flex flex-1 flex-col p-6">
                      <span className="font-mono text-xs uppercase tracking-wide text-brand">{p.category}{p.featured ? " · ★" : ""}</span>
                      <h3 className="mt-3 font-heading text-xl font-bold tracking-tight leading-snug">{p.title}</h3>
                      <p className="mt-2 text-sm text-ink/60 leading-relaxed line-clamp-2">{p.excerpt}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ — answer-first, GEO/AEO optimised */}
      <section className="bg-white border-y border-line" data-testid="home-faq">
        <div className="mx-auto max-w-[900px] px-5 md:px-10 py-20 md:py-28">
          <Reveal><p className="overline">/ 005 — Questions, answered</p></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
              Frequently asked.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-ink/70 leading-relaxed">
              Short, straight answers — the same ones people ask on WhatsApp before we start.
            </p>
          </Reveal>
          <div className="mt-12 divide-y divide-line">
            {HOME_FAQS.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i * 0.04, 0.2)}>
                <details className="group py-5" data-testid={`home-faq-item-${i}`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-lg md:text-xl font-semibold tracking-tight">
                    {f.q}
                    <span className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-brand transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-ink/65 leading-relaxed">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-32 grid lg:grid-cols-2 gap-14 items-start">
        <div>
          <Reveal><p className="overline">/ 006 — Start the conversation</p></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.92]">
              Skip the<br />manifesto.<br /><span className="text-brand">Let's talk.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-md text-ink/70 leading-relaxed">
              Ping on WhatsApp or send your project brief — Rajeev usually replies within the hour. No account managers, no offshore relays.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col gap-3">
              <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-heading text-2xl font-bold link-underline w-fit">
                {CONTACT.whatsappDisplay}
              </a>
              <a href={`mailto:${CONTACT.email}`} className="text-muted-foreground link-underline w-fit">{CONTACT.email}</a>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <img src={ABOUT_IMG} alt="Rajeev, senior freelance engineer and consultant" loading="lazy" decoding="async" className="mt-10 rounded-2xl border border-line w-full max-w-sm object-cover aspect-[4/3]" />
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </section>
    </div>
  );
}
