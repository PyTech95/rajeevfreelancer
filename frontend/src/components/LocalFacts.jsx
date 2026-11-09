import Link from "@/components/CanonicalLink";
import { ArrowUpRight, Clock, Globe, MapPin } from "lucide-react";

// Renders the `local_facts` object attached by the backend to every
// service/location page (see backend/location_facts.py). The server HTML shows
// the same facts, so crawlers and visitors see one consistent page.
export default function LocalFacts({ facts, serviceName }) {
  if (!facts || !facts.place) return null;
  const p = facts.place;
  const t = facts.time;
  const where = p.locality_of ? `${p.city}, ${p.locality_of}` : p.city;
  const rows = [];
  if (p.locality_of) rows.push(["Area", `${p.city} is a locality of ${p.locality_of}, ${p.country}`]);
  if (p.admin1 && p.admin1 !== p.city) rows.push(["Region", `${p.admin1}, ${p.country}`]);
  else rows.push(["Country", p.country]);
  if (p.population_text) rows.push(["Population", `about ${p.population_text} (GeoNames)`]);
  if (p.timezone) rows.push(["Time zone", `${p.timezone}${t ? ` (${t.local_offset})` : ""}`]);
  if (p.currency) rows.push(["Local currency", p.currency]);
  if (p.languages?.length) rows.push(["Languages commonly used", p.languages.join(", ")]);
  if (p.km_from_gurugram != null) rows.push(["Distance from Gurugram, India", `about ${Number(p.km_from_gurugram).toLocaleString("en-IN")} km`]);
  const service = serviceName || facts.service?.name || "this service";
  const siblings = facts.sibling_services || [];
  const nearby = facts.nearby || [];

  return (
    <section className="mx-auto max-w-[1400px] px-5 md:px-10 py-20" data-testid="local-facts" aria-labelledby="local-facts-heading">
      <p className="overline flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand" /> / {where} at a glance</p>
      <h2 id="local-facts-heading" className="mt-5 font-heading font-extrabold tracking-tighter text-3xl sm:text-4xl leading-[0.95]">{service} for {where}: local facts</h2>
      <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5">
            <dt className="text-xs uppercase tracking-wider text-ink/50">{label}</dt>
            <dd className="mt-2 font-medium leading-snug">{value}</dd>
          </div>
        ))}
      </dl>
      {t && (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-paper p-7">
            <p className="overline flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-brand" /> Working hours across time zones</p>
            <p className="mt-4 text-ink/75 leading-relaxed">
              {p.city} is {t.difference}.{" "}
              {t.overlap
                ? <>If your team works {t.local_hours} local time, the shared window with Rajeev&apos;s review hours ({t.ist_hours} IST) is <strong>{t.overlap.local} in {p.city}</strong>, which is {t.overlap.ist} in India.</>
                : <>There is no overlap between {t.local_hours} local time and {t.ist_hours} IST, so reviews are scheduled at agreed early-morning or evening slots and progress is shared asynchronously on WhatsApp and email.</>}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-7">
            <p className="overline flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-brand" /> Budget and currency</p>
            <p className="mt-4 text-ink/75 leading-relaxed">
              Proposals are quoted in USD, EUR, GBP or INR{p.currency_code ? <>; {p.currency_code} can be used as the reference currency for a {where} budget</> : null}. Every project starts with a free consultation and a fixed-scope proposal.
            </p>
          </div>
        </div>
      )}
      {(siblings.length > 0 || nearby.length > 0) && (
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          {siblings.length > 0 && (
            <div>
              <h3 className="font-heading text-xl font-bold tracking-tight">Other services for {where}</h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {siblings.map((s) => (
                  <li key={s.path}><Link to={s.path} className="group inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-brand">{s.name} in {p.city} <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></Link></li>
                ))}
              </ul>
            </div>
          )}
          {nearby.length > 0 && (
            <div>
              <h3 className="font-heading text-xl font-bold tracking-tight">{p.locality_of ? "Nearby areas" : "Nearby places"} also served</h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {nearby.map((n) => (
                  <li key={n.path}><Link to={n.path} className="text-sm text-ink/70 hover:text-brand">{n.city}{n.country !== p.country ? `, ${n.country}` : ""}{n.km ? <span className="text-ink/40"> · {n.km} km</span> : null}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <p className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        {facts.country_path && <Link to={facts.country_path} className="link-underline">All places in {p.country}</Link>}
        <Link to="/service-areas" className="link-underline">Worldwide service areas</Link>
      </p>
      <p className="mt-6 text-xs text-ink/45">Geographic data: GeoNames, CC BY 4.0. Services are delivered remotely from Gurugram, India; this page does not describe a local office.</p>
    </section>
  );
}
