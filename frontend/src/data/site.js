// Site-wide constants. Services kept in sync with backend/data.py
export const CONTACT = {
  whatsapp: "919711623561",
  whatsappDisplay: "+91 97116 23561",
  email: "hello@rajeevfreelancer.com",
  phone: "+919711623561",
  name: "Rajeev Freelancer",
};

export const waLink = (text) =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text || "Hi Rajeev, I'd like to discuss a project. Are you available for a quick chat?")}`;

// Google Business Profile (share link -> "Rajeev Freelancer - Website and App Development")
export const GOOGLE_PROFILE = "https://share.google/ddhGdf8R7JkjaWji3";

export const SERVICES = [
  { slug: "freelance-ai-consultant", name: "Freelance AI Consultant", short: "AI Consulting", tagline: "AI automation, bots, agents & workflow integrations", icon: "Bot" },
  { slug: "freelance-digital-marketing-consultant", name: "Freelance Digital Marketing Consultant", short: "Digital Marketing", tagline: "Paid, organic & lifecycle growth engineered around revenue", icon: "TrendingUp" },
  { slug: "freelance-seo-expert", name: "Freelance SEO Expert", short: "SEO Consulting", tagline: "Technical + content SEO that compounds into rankings", icon: "Search" },
  { slug: "freelance-website-developer", name: "Freelance Website Developer", short: "Website Development", tagline: "WordPress & custom web apps built for speed and conversion", icon: "Code" },
  { slug: "freelance-app-developer", name: "Freelance App Developer", short: "App Development", tagline: "iOS, Android & cross-platform mobile apps built to scale", icon: "Smartphone" },
  { slug: "freelance-software-developer", name: "Freelance Software Developer", short: "Software Development", tagline: "Custom applications & production-grade software engineering", icon: "Terminal" },
  { slug: "whatsapp-marketing-freelancer", name: "WhatsApp Marketing Freelancer", short: "WhatsApp Marketing", tagline: "Campaigns, auto-replies, chatbots & lead nurturing", icon: "MessageCircle" },
  { slug: "sms-marketing-freelancer", name: "SMS Marketing Freelancer", short: "SMS Marketing", tagline: "Bulk SMS campaigns, OTP flows & automated journeys", icon: "Smartphone" },
];

export const FEATURED_CITIES = [
  { city: "Delhi", loc_slug: "delhi-india", country: "India" },
  { city: "Dubai", loc_slug: "dubai-uae", country: "UAE" },
  { city: "London", loc_slug: "london-uk", country: "UK" },
  { city: "New York", loc_slug: "new-york-usa", country: "USA" },
  { city: "Singapore", loc_slug: "singapore-singapore", country: "Singapore" },
  { city: "Sydney", loc_slug: "sydney-australia", country: "Australia" },
  { city: "Toronto", loc_slug: "toronto-canada", country: "Canada" },
  { city: "Bangalore", loc_slug: "bangalore-india", country: "India" },
];

export const STATS = [
  { value: 12, suffix: "+", label: "Years in production" },
  { value: 180, suffix: "+", label: "Projects delivered" },
  { value: 27, suffix: "", label: "Countries served" },
  { value: 4.9, suffix: "/5", label: "Client rating", decimals: 1 },
];

// Currency-aware budget presets (localized by visitor / page location)
export const CURRENCIES = {
  USD: { symbol: "$", budgets: ["$1k – $3k", "$3k – $10k", "$10k – $25k", "$25k+"] },
  INR: { symbol: "₹", budgets: ["₹25K – ₹1L", "₹1L – ₹3L", "₹3L – ₹8L", "₹8L+"] },
  GBP: { symbol: "£", budgets: ["£800 – £2.5k", "£2.5k – £8k", "£8k – £20k", "£20k+"] },
  EUR: { symbol: "€", budgets: ["€1k – €3k", "€3k – €9k", "€9k – €22k", "€22k+"] },
  AED: { symbol: "AED", budgets: ["AED 4k – 12k", "AED 12k – 40k", "AED 40k – 90k", "AED 90k+"] },
  SGD: { symbol: "S$", budgets: ["S$1.5k – 4k", "S$4k – 13k", "S$13k – 32k", "S$32k+"] },
  AUD: { symbol: "A$", budgets: ["A$1.5k – 4k", "A$4k – 15k", "A$15k – 35k", "A$35k+"] },
  CAD: { symbol: "C$", budgets: ["C$1.5k – 4k", "C$4k – 13k", "C$13k – 32k", "C$32k+"] },
};

// Map our country slug -> currency (for location pages)
export const COUNTRY_CURRENCY = {
  india: "INR", usa: "USD", uk: "GBP", canada: "CAD", australia: "AUD", uae: "AED",
  singapore: "SGD", germany: "EUR", france: "EUR", netherlands: "EUR", spain: "EUR",
  italy: "EUR", ireland: "EUR", portugal: "EUR", belgium: "EUR", "new-zealand": "AUD",
};

// ISO2 country code -> currency (for IP geo detection)
export const ISO_CURRENCY = {
  IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", AE: "AED", SG: "SGD", NZ: "AUD",
  DE: "EUR", FR: "EUR", NL: "EUR", ES: "EUR", IT: "EUR", IE: "EUR", PT: "EUR", BE: "EUR",
  AT: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
};
