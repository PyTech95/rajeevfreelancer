import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import useLenis from "@/hooks/useLenis";
import { organizationSchema, websiteSchema, personSchema } from "@/lib/siteConfig";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import ScrollProgress from "@/components/ScrollProgress";
import Home from "@/pages/Home";
import About from "@/pages/About";
import ServicesOverview from "@/pages/ServicesOverview";
import ServiceHub from "@/pages/ServiceHub";
import LocationPage from "@/pages/LocationPage";
import LocationsIndex from "@/pages/LocationsIndex";
import CountryPage from "@/pages/CountryPage";
import Contact from "@/pages/Contact";
import Pricing from "@/pages/Pricing";
import CaseStudies from "@/pages/CaseStudies";
import CaseStudyDetail from "@/pages/CaseStudyDetail";
import BlogIndex from "@/pages/BlogIndex";
import BlogPost from "@/pages/BlogPost";
import LangLanding from "@/pages/LangLanding";
import ThankYou from "@/pages/ThankYou";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import { firePageView } from "@/lib/siteConfig";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { firePageView(pathname); }, [pathname]);
  return null;
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
          <Route path="/locations" element={<LocationsIndex />} />
          <Route path="/locations/:countrySlug" element={<CountryPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
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
        <Route path="/hi" element={<LangLanding lang="hi" />} />
        <Route path="/ar" element={<LangLanding lang="ar" />} />
        <Route path="/es" element={<LangLanding lang="es" />} />
        <Route path="/fr" element={<LangLanding lang="fr" />} />
        <Route path="/*" element={<Site />} />
      </Routes>
    </BrowserRouter>
  );
}
