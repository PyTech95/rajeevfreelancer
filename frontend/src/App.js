import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import useLenis from "@/hooks/useLenis";
import { organizationSchema, websiteSchema, personSchema } from "@/lib/siteConfig";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import ScrollProgress from "@/components/ScrollProgress";
import ExitIntentOffer from "@/components/ExitIntentOffer";
import Home from "@/pages/Home";
import About from "@/pages/About";
import ServicesOverview from "@/pages/ServicesOverview";
import ServiceHub from "@/pages/ServiceHub";
import LocationPage from "@/pages/LocationPage";
import LocationsIndex from "@/pages/LocationsIndex";
import CountryPage from "@/pages/CountryPage";
import DelhiNCR from "@/pages/DelhiNCR";
import Contact from "@/pages/Contact";
import Pricing from "@/pages/Pricing";
import CaseStudies from "@/pages/CaseStudies";
import CaseStudyDetail from "@/pages/CaseStudyDetail";
import BlogIndex from "@/pages/BlogIndex";
import BlogPost from "@/pages/BlogPost";
import Landing from "@/pages/Landing";
import LangLanding from "@/pages/LangLanding";
import RegionLanding from "@/pages/RegionLanding";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Legacy /services/:slug URLs (from the old site) -> current service pages, else /services.
const LEGACY_SERVICE_MAP = {
  // Pre-rename slugs (freelance-* -> freelancer-*) — keep indexed URLs alive
  "freelance-seo-expert": "freelancer-seo-expert",
  "freelance-digital-marketing-consultant": "freelancer-digital-marketing-consultant",
  "freelance-website-developer": "freelancer-website-developer",
  "freelance-app-developer": "freelancer-app-developer",
  "freelance-software-developer": "freelancer-software-developer",
  "freelance-ai-consultant": "freelancer-ai-consultant",
  "seo": "freelancer-seo-expert",
  "search-engine-optimization": "freelancer-seo-expert",
  "meta-ads": "freelancer-digital-marketing-consultant",
  "google-ads": "freelancer-digital-marketing-consultant",
  "ppc": "freelancer-digital-marketing-consultant",
  "digital-marketing": "freelancer-digital-marketing-consultant",
  "marketing": "freelancer-digital-marketing-consultant",
  "web-development": "freelancer-website-developer",
  "website": "freelancer-website-developer",
  "web-design": "freelancer-website-developer",
  "wordpress": "freelancer-website-developer",
  "app-development": "freelancer-app-developer",
  "mobile-app": "freelancer-app-developer",
  "app": "freelancer-app-developer",
  "software": "freelancer-software-developer",
  "software-development": "freelancer-software-developer",
  "ai": "freelancer-ai-consultant",
  "ai-automation": "freelancer-ai-consultant",
  "artificial-intelligence": "freelancer-ai-consultant",
  "whatsapp": "whatsapp-marketing-freelancer",
  "whatsapp-marketing": "whatsapp-marketing-freelancer",
  "sms": "sms-marketing-freelancer",
  "sms-marketing": "sms-marketing-freelancer",
};

function LegacyServiceRedirect() {
  const { slug } = useParams();
  const target = LEGACY_SERVICE_MAP[(slug || "").toLowerCase()] || null;
  return <Navigate to={target ? `/${target}` : "/services"} replace />;
}

function Site() {
  useLenis();
  return (
    <div className="grain">
      <ScrollProgress />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<ServicesOverview />} />
          <Route path="/services/:slug" element={<LegacyServiceRedirect />} />
          <Route path="/home/*" element={<Navigate to="/" replace />} />
          <Route path="/clients/*" element={<Navigate to="/" replace />} />
          <Route path="/locations" element={<LocationsIndex />} />
          <Route path="/locations/:countrySlug" element={<CountryPage />} />
          <Route path="/delhi-ncr" element={<DelhiNCR />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/:serviceSlug" element={<ServiceHub />} />
          <Route path="/:serviceSlug/:locSlug" element={<LocationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <FloatingActions />
      <ExitIntentOffer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(organizationSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(personSchema())}</script>
      </Helmet>
      <ScrollTop />
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/free-quote" element={<Landing />} />
        <Route path="/hi" element={<LangLanding lang="hi" />} />
        <Route path="/ar" element={<LangLanding lang="ar" />} />
        <Route path="/es" element={<LangLanding lang="es" />} />
        <Route path="/fr" element={<LangLanding lang="fr" />} />
        <Route path="/us" element={<RegionLanding region="us" />} />
        <Route path="/uk" element={<RegionLanding region="uk" />} />
        <Route path="/de" element={<RegionLanding region="de" />} />
        <Route path="/*" element={<Site />} />
      </Routes>
    </BrowserRouter>
  );
}
