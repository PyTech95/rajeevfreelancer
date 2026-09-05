import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowUpRight } from "lucide-react";
import Seo from "@/components/Seo";
import { Reveal, MaskLines } from "@/components/Reveal";
import NotFound from "@/pages/NotFound";
import { api } from "@/lib/api";
import { SERVICES, waLink } from "@/data/site";

export default function CountryPage() {
  const { countrySlug } = useParams();
  const [country, setCountry] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get("/locations").then(({ data }) => {
      const c = data.countries.find((x) => x.slug === countrySlug);
      if (!c) setError(true); else setCountry(c);
    }).catch(() => setError(true));
  }, [countrySlug]);

  if (error) return <NotFound />;
  if (!country) return <div className="pt-40 pb-32 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;

  return (
    <div>
      <Seo
        title={`Freelance Web, SEO, AI & Marketing Services in ${country.name} | Rajeev Freelancer`}
        description={`Hire Rajeev for freelance web development, SEO, AI automation and digital marketing across ${country.name}. Senior-only, remote, fast WhatsApp support.`}
        path={`/locations/${country.slug}`}
      />
      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pt-32 md:pt-40 pb-14">
        <Link to="/locations" className="overline link-underline">/ Locations</Link>
        <h1 className="mt-6 font-heading font-extrabold tracking-tighter text-5xl sm:text-6xl lg:text-[4.6rem] leading-[0.9]">
          <MaskLines lines={[`Serving ${country.name}`]} />
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-ink/70 leading-relaxed">Every service, in every major city across {country.name}. Pick a service and city to see localized details, pricing and FAQs.</p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 pb-24">
        {SERVICES.map((s, si) => (
          <Reveal key={s.slug} delay={(si % 3) * 0.05}>
            <div className="mb-10 border-b border-line pb-8">
              <div className="flex items-center justify-between">
                <Link to={`/${s.slug}`} className="font-heading text-xl md:text-2xl font-bold tracking-tight hover:text-brand transition-colors">{s.name}</Link>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                {country.cities.map((city) => (
                  <Link key={city.loc_slug} to={`/${s.slug}/${city.loc_slug}`} className="text-sm text-ink/65 hover:text-brand link-underline">{city.city}</Link>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
        <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-medium text-white hover:bg-ink transition-colors">Get a free quote <ArrowUpRight className="h-4 w-4" /></a>
      </section>
    </div>
  );
}
