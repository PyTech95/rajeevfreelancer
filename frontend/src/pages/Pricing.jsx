import { Link } from "react-router-dom";
import { ArrowUpRight, MessageCircle, Check, ShieldCheck, PenLine, Rocket } from "lucide-react";
import Seo from "@/components/Seo";
import { Reveal, MaskLines } from "@/components/Reveal";
import { waLink } from "@/data/site";

const PATH = "/pricing";

const MODELS = [
  {
    icon: Rocket,
    title: "One-time build",
    desc: "Websites, apps and custom software — scoped once, quoted once, delivered on time.",
    points: ["Fixed-scope written quote before work starts", "Milestone-based payments", "You own everything: code, content, accounts"],
  },
  {
    icon: ShieldCheck,
    title: "Monthly growth",
    desc: "SEO, GEO and Google Ads management that compounds month after month.",
    points: ["Clear monthly scope, no retainers-without-work", "Reported in numbers: traffic, leads, revenue", "Pause or scale any month"],
  },
  {
    icon: PenLine,
    title: "AI automation",
    desc: "Workflow automation scoped around the hours it saves you — quoted per workflow or as a package.",
    points: ["Starts with a free process audit", "Payback period estimated in the proposal", "Documentation and handover included"],
  },
];

const FAQS = [
  { q: "How much does a project cost?", a: "It depends on scope — that's the honest answer. Share what you're building and you'll receive a fixed, written quote after a free consultation, before any work begins. No ranges published, no surprises later." },
  { q: "Why is there no price list on this site?", a: "Because a serious price depends on what you're actually building: pages, features, integrations, content, languages. A public price list either overcharges simple projects or underquotes complex ones. A fixed written quote is fairer to both sides." },
  { q: "Is the consultation really free?", a: "Yes — a 20-minute call to understand your goals and recommend the fastest path to results, followed by a written proposal. No sales pressure, no obligation." },
  { q: "Which currency do you bill in?", a: "Yours. Quotes are issued in INR, USD, GBP or EUR and fixed in writing, so exchange rates never move your price mid-project." },
  { q: "What if my project doesn't fit a standard scope?", a: "Most projects are bespoke. Send your brief on WhatsApp or the contact form and you'll get a tailored, fixed-price proposal — usually within the hour." },
];

export default function Pricing() {
  return (
    <div data-testid="pricing-page">
      <Seo
        title="Pricing & Engagement Models | Rajeev Freelancer"
        description="No public price lists — every project gets a fixed, written quote in your currency after a free consultation. Web, app, SEO and AI automation, worldwide."
        path={PATH}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pt-20 pb-16">
        <Reveal><p className="overline flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand" /> Pricing, the honest way</p></Reveal>
        <MaskLines as="h1" className="mt-6 max-w-4xl font-heading font-extrabold tracking-tighter text-5xl sm:text-6xl lg:text-7xl leading-[0.95]" lines={["No price lists.", "Fixed written quotes."]} />
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg text-ink/70 leading-relaxed">
            Every project is scoped individually and quoted in writing — in your currency — after a free consultation. You always know the exact cost before any work begins.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/free-quote" data-testid="pricing-quote-cta" className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-medium text-white hover:bg-ink transition-colors">Get my free quote <ArrowUpRight className="h-4 w-4" /></Link>
            <a href={waLink("Hi Rajeev, I'd like a quote for my project.")} target="_blank" rel="noopener noreferrer" data-testid="pricing-whatsapp-cta" className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 font-medium hover:border-ink transition-colors"><MessageCircle className="h-4 w-4" /> WhatsApp your brief</a>
          </div>
        </Reveal>
      </section>

      <section className="bg-white border-y border-line">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-16 md:py-24">
          <Reveal><h2 className="font-heading font-extrabold tracking-tighter text-3xl sm:text-4xl">Three ways to work together</h2></Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {MODELS.map((m, i) => (
              <Reveal key={m.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-line bg-paper p-7 hover:border-ink transition-colors">
                  <m.icon className="h-6 w-6 text-brand" />
                  <p className="mt-4 font-heading text-2xl font-bold tracking-tight">{m.title}</p>
                  <p className="mt-2 text-sm text-ink/60 leading-relaxed">{m.desc}</p>
                  <ul className="mt-5 space-y-2.5">
                    {m.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-sm text-ink/75"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{pt}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}><p className="mt-6 text-center text-sm text-muted-foreground">Every engagement starts with a free consultation and ends with a fixed, written quote — the number is agreed before the work starts, never after.</p></Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 md:px-10 py-16 md:py-24" data-testid="pricing-faq">
        <Reveal><h2 className="font-heading font-extrabold tracking-tighter text-3xl sm:text-4xl">Pricing questions, answered</h2></Reveal>
        <div className="mt-8 space-y-6">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className="border-b border-line pb-6">
                <p className="font-heading text-lg font-bold">{f.q}</p>
                <p className="mt-2 text-ink/70 leading-relaxed">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pb-20">
        <Reveal>
          <div className="rounded-2xl bg-ink text-white p-8 md:p-12 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tighter">Tell me what you're building.</h2>
              <p className="mt-3 text-white/70 leading-relaxed">Two minutes to brief, a fixed written quote within the hour — in your currency.</p>
            </div>
            <div className="flex flex-wrap lg:justify-end gap-3">
              <Link to="/free-quote" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-ink hover:bg-brand hover:text-white transition-colors">Get my free quote <ArrowUpRight className="h-4 w-4" /></Link>
              <a href={waLink("Hi Rajeev, I'd like a quote for my project.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-medium hover:bg-white/10 transition-colors"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
