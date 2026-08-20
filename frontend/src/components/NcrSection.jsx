import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SERVICES } from "@/data/site";

const NCR = [
  { parent: "Gurgaon", areas: [["MG Road", "mg-road-gurgaon"], ["Sohna Road", "sohna-road-gurgaon"], ["Golf Course Road", "golf-course-road-gurgaon"], ["Cyber City", "cyber-city-gurgaon"], ["Udyog Vihar", "udyog-vihar-gurgaon"], ["Sushant Lok", "sushant-lok-gurgaon"], ["Sector 49", "sector-49-gurgaon"], ["DLF Phase 3", "dlf-phase-3-gurgaon"]] },
  { parent: "Delhi", areas: [["Connaught Place", "connaught-place-delhi"], ["Nehru Place", "nehru-place-delhi"], ["Saket", "saket-delhi"], ["Dwarka", "dwarka-delhi"], ["Karol Bagh", "karol-bagh-delhi"], ["Lajpat Nagar", "lajpat-nagar-delhi"], ["Hauz Khas", "hauz-khas-delhi"], ["Rohini", "rohini-delhi"]] },
  { parent: "Noida", areas: [["Sector 18", "sector-18-noida"], ["Sector 62", "sector-62-noida"], ["Sector 63", "sector-63-noida"], ["Sector 125", "sector-125-noida"], ["Noida Extension", "noida-extension"], ["Greater Noida", "greater-noida"]] },
  { parent: "Ghaziabad", areas: [["Indirapuram", "indirapuram-ghaziabad"], ["Vaishali", "vaishali-ghaziabad"], ["Kaushambi", "kaushambi-ghaziabad"], ["Raj Nagar Extension", "raj-nagar-extension-ghaziabad"], ["Mohan Nagar", "mohan-nagar-ghaziabad"]] },
  { parent: "Faridabad", areas: [["NIT Faridabad", "nit-faridabad"], ["Sector 15", "sector-15-faridabad"], ["Ballabgarh", "ballabgarh-faridabad"], ["Greenfield Colony", "greenfield-colony-faridabad"]] },
];

const svcFor = (gi, i) => SERVICES[(gi + i) % SERVICES.length].slug;

export const NcrSection = () => (
  <section className="bg-paper border-y border-line" data-testid="home-ncr-section">
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal><p className="overline flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand" /> / Serving Delhi NCR</p></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 max-w-3xl font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
              Local to Delhi NCR.<br />From <span className="text-brand">MG Road</span> to Noida Sector 62.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-ink/70 leading-relaxed">
              Based in Gurgaon, working face-to-face or remote across Gurgaon, Delhi, Noida, Ghaziabad and Faridabad — apps, websites, SEO and marketing tuned to your local market.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.12}>
          <Link to="/locations/india" data-testid="home-ncr-all-link" className="inline-flex items-center gap-2 text-sm font-medium link-underline">All India locations <ArrowRight className="h-4 w-4" /></Link>
        </Reveal>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {NCR.map((g, gi) => (
          <Reveal key={g.parent} delay={(gi % 3) * 0.06}>
            <div className="h-full rounded-2xl border border-line bg-white p-6" data-testid={`home-ncr-${g.parent.toLowerCase()}`}>
              <p className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"><MapPin className="h-4 w-4 text-brand" /> {g.parent}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {g.areas.map(([name, slug], i) => (
                  <Link key={slug} to={`/${svcFor(gi, i)}/${slug}`} className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm text-ink/70 hover:border-ink hover:text-ink transition-colors">
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
