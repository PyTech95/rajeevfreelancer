"""Static data: services and worldwide location dataset for programmatic SEO pages."""

SERVICES = [
    {
        "slug": "freelance-ai-consultant",
        "name": "Freelance AI Consultant",
        "short": "AI Consulting",
        "tagline": "AI automation, bots, agents & workflow integrations",
        "keyword": "freelance AI consultant",
        "icon": "Bot",
    },
    {
        "slug": "freelance-digital-marketing-consultant",
        "name": "Freelance Digital Marketing Consultant",
        "short": "Digital Marketing",
        "tagline": "Paid, organic & lifecycle growth engineered around revenue",
        "keyword": "freelance digital marketing consultant",
        "icon": "TrendingUp",
    },
    {
        "slug": "freelance-seo-expert",
        "name": "Freelance SEO Expert",
        "short": "SEO Consulting",
        "tagline": "Technical + content SEO that compounds into rankings",
        "keyword": "freelance SEO expert",
        "icon": "Search",
    },
    {
        "slug": "freelance-website-developer",
        "name": "Freelance Website Developer",
        "short": "Website Development",
        "tagline": "WordPress & custom web apps built for speed and conversion",
        "keyword": "freelance website developer",
        "icon": "Code",
    },
    {
        "slug": "freelance-app-developer",
        "name": "Freelance App Developer",
        "short": "App Development",
        "tagline": "iOS, Android & cross-platform mobile apps built to scale",
        "keyword": "freelance app developer",
        "icon": "Smartphone",
    },
    {
        "slug": "freelance-software-developer",
        "name": "Freelance Software Developer",
        "short": "Software Development",
        "tagline": "Custom applications & production-grade software engineering",
        "keyword": "freelance software developer",
        "icon": "Terminal",
    },
    {
        "slug": "whatsapp-marketing-freelancer",
        "name": "WhatsApp Marketing Freelancer",
        "short": "WhatsApp Marketing",
        "tagline": "Campaigns, auto-replies, chatbots & lead nurturing",
        "keyword": "WhatsApp marketing freelancer",
        "icon": "MessageCircle",
    },
    {
        "slug": "sms-marketing-freelancer",
        "name": "SMS Marketing Freelancer",
        "short": "SMS Marketing",
        "tagline": "Bulk SMS campaigns, OTP flows & automated journeys",
        "keyword": "SMS marketing freelancer",
        "icon": "Smartphone",
    },
]

# country_slug -> {name, region, cities:[...]}
COUNTRIES = {
    "india": {"name": "India", "region": "Asia-Pacific", "cities": ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Gurgaon", "Noida", "Ghaziabad", "Faridabad", "Ahmedabad"]},
    "usa": {"name": "USA", "region": "North America", "cities": ["New York", "San Francisco", "Los Angeles", "Chicago", "Austin", "Seattle", "Boston", "Miami", "Dallas", "Atlanta"]},
    "uk": {"name": "UK", "region": "Europe", "cities": ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Edinburgh", "Glasgow"]},
    "canada": {"name": "Canada", "region": "North America", "cities": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"]},
    "australia": {"name": "Australia", "region": "Asia-Pacific", "cities": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"]},
    "uae": {"name": "UAE", "region": "Middle East", "cities": ["Dubai", "Abu Dhabi", "Sharjah"]},
    "singapore": {"name": "Singapore", "region": "Asia-Pacific", "cities": ["Singapore"]},
    "germany": {"name": "Germany", "region": "Europe", "cities": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"]},
    "france": {"name": "France", "region": "Europe", "cities": ["Paris", "Lyon", "Marseille", "Toulouse"]},
    "netherlands": {"name": "Netherlands", "region": "Europe", "cities": ["Amsterdam", "Rotterdam", "The Hague", "Eindhoven"]},
    "spain": {"name": "Spain", "region": "Europe", "cities": ["Madrid", "Barcelona", "Valencia", "Seville"]},
    "italy": {"name": "Italy", "region": "Europe", "cities": ["Milan", "Rome", "Turin", "Naples"]},
    "ireland": {"name": "Ireland", "region": "Europe", "cities": ["Dublin", "Cork", "Galway"]},
    "saudi-arabia": {"name": "Saudi Arabia", "region": "Middle East", "cities": ["Riyadh", "Jeddah", "Dammam"]},
    "qatar": {"name": "Qatar", "region": "Middle East", "cities": ["Doha"]},
    "south-africa": {"name": "South Africa", "region": "Africa", "cities": ["Johannesburg", "Cape Town", "Durban"]},
    "nigeria": {"name": "Nigeria", "region": "Africa", "cities": ["Lagos", "Abuja", "Port Harcourt"]},
    "kenya": {"name": "Kenya", "region": "Africa", "cities": ["Nairobi", "Mombasa"]},
    "egypt": {"name": "Egypt", "region": "Africa", "cities": ["Cairo", "Alexandria"]},
    "brazil": {"name": "Brazil", "region": "Latin America", "cities": ["Sao Paulo", "Rio de Janeiro", "Brasilia"]},
    "mexico": {"name": "Mexico", "region": "Latin America", "cities": ["Mexico City", "Guadalajara", "Monterrey"]},
    "argentina": {"name": "Argentina", "region": "Latin America", "cities": ["Buenos Aires", "Cordoba"]},
    "japan": {"name": "Japan", "region": "Asia-Pacific", "cities": ["Tokyo", "Osaka", "Yokohama"]},
    "china": {"name": "China", "region": "Asia-Pacific", "cities": ["Shanghai", "Beijing", "Shenzhen", "Guangzhou"]},
    "hong-kong": {"name": "Hong Kong", "region": "Asia-Pacific", "cities": ["Hong Kong"]},
    "malaysia": {"name": "Malaysia", "region": "Asia-Pacific", "cities": ["Kuala Lumpur", "Penang", "Johor Bahru"]},
    "indonesia": {"name": "Indonesia", "region": "Asia-Pacific", "cities": ["Jakarta", "Surabaya", "Bandung"]},
    "philippines": {"name": "Philippines", "region": "Asia-Pacific", "cities": ["Manila", "Cebu", "Davao"]},
    "thailand": {"name": "Thailand", "region": "Asia-Pacific", "cities": ["Bangkok", "Chiang Mai", "Phuket"]},
    "vietnam": {"name": "Vietnam", "region": "Asia-Pacific", "cities": ["Ho Chi Minh City", "Hanoi", "Da Nang"]},
    "pakistan": {"name": "Pakistan", "region": "Asia-Pacific", "cities": ["Karachi", "Lahore", "Islamabad"]},
    "bangladesh": {"name": "Bangladesh", "region": "Asia-Pacific", "cities": ["Dhaka", "Chittagong"]},
    "sri-lanka": {"name": "Sri Lanka", "region": "Asia-Pacific", "cities": ["Colombo"]},
    "new-zealand": {"name": "New Zealand", "region": "Asia-Pacific", "cities": ["Auckland", "Wellington", "Christchurch"]},
    "sweden": {"name": "Sweden", "region": "Europe", "cities": ["Stockholm", "Gothenburg", "Malmo"]},
    "switzerland": {"name": "Switzerland", "region": "Europe", "cities": ["Zurich", "Geneva", "Basel"]},
    "poland": {"name": "Poland", "region": "Europe", "cities": ["Warsaw", "Krakow", "Wroclaw"]},
    "turkey": {"name": "Turkey", "region": "Europe", "cities": ["Istanbul", "Ankara", "Izmir"]},
    "portugal": {"name": "Portugal", "region": "Europe", "cities": ["Lisbon", "Porto"]},
    "belgium": {"name": "Belgium", "region": "Europe", "cities": ["Brussels", "Antwerp"]},
}


def _slug(text: str) -> str:
    return (
        text.lower()
        .replace("&", "and")
        .replace(".", "")
        .replace("'", "")
        .replace(",", "")
        .replace(" ", "-")
    )


# Delhi NCR hyperlocal areas -> programmatic pages under each parent city.
NCR_LOCALITIES = {
    "Gurgaon": [
        "MG Road", "Sohna Road", "Golf Course Road", "Golf Course Extension Road", "Cyber City",
        "Udyog Vihar", "Sushant Lok", "Palam Vihar", "South City", "Sector 14", "Sector 29",
        "Sector 49", "Sector 56", "Sector 82", "New Gurgaon", "IMT Manesar", "DLF Phase 3", "DLF Phase 5",
    ],
    "Delhi": [
        "Connaught Place", "Nehru Place", "Saket", "Dwarka", "Rohini", "Janakpuri", "Karol Bagh",
        "Lajpat Nagar", "South Extension", "Greater Kailash", "Hauz Khas", "Vasant Kunj", "Okhla",
        "Rajouri Garden", "Punjabi Bagh", "Pitampura", "Laxmi Nagar", "Preet Vihar", "Mayur Vihar", "Chandni Chowk",
    ],
    "Noida": [
        "Sector 18", "Sector 62", "Sector 63", "Sector 16", "Sector 125", "Sector 135", "Sector 137",
        "Sector 150", "Noida Extension", "Greater Noida", "Greater Noida West", "Knowledge Park",
    ],
    "Ghaziabad": [
        "Indirapuram", "Vaishali", "Kaushambi", "Raj Nagar Extension", "Crossings Republik", "Mohan Nagar", "Vasundhara",
    ],
    "Faridabad": [
        "NIT Faridabad", "Sector 15", "Sector 21", "Ballabgarh", "Greenfield Colony", "Greater Faridabad",
    ],
}


def _area_entry(parent: str, area: str) -> dict:
    contains_parent = parent.lower() in area.lower()
    name = area if contains_parent else f"{area}, {parent}"
    loc_slug = _slug(area) if contains_parent else f"{_slug(area)}-{_slug(parent)}"
    return {"name": name, "loc_slug": loc_slug, "parent": parent}


NCR_AREAS = [_area_entry(parent, area) for parent, areas in NCR_LOCALITIES.items() for area in areas]


def india_city_entries():
    """City list for India incl. NCR localities (used by /api/locations & service hubs)."""
    entries = [{"city": c, "loc_slug": f"{_slug(c)}-india"} for c in COUNTRIES["india"]["cities"]]
    entries += [{"city": a["name"], "loc_slug": a["loc_slug"]} for a in NCR_AREAS]
    return entries


def build_city_map():
    """Return {loc_slug: {city, country, country_slug, region}} where loc_slug = 'delhi-india'."""
    city_map = {}
    for c_slug, c in COUNTRIES.items():
        for city in c["cities"]:
            loc_slug = f"{_slug(city)}-{c_slug}"
            city_map[loc_slug] = {
                "city": city,
                "country": c["name"],
                "country_slug": c_slug,
                "region": c["region"],
                "loc_slug": loc_slug,
            }
    for a in NCR_AREAS:
        city_map[a["loc_slug"]] = {
            "city": a["name"],
            "country": "India",
            "country_slug": "india",
            "region": "Asia-Pacific",
            "loc_slug": a["loc_slug"],
            "parent_city": a["parent"],
        }
    return city_map


SERVICE_MAP = {s["slug"]: s for s in SERVICES}
CITY_MAP = build_city_map()

# Highest-value markets to pre-generate (warm the AI cache so they load instantly).
TOP_CITY_SLUGS = [
    "delhi-india", "mumbai-india", "bangalore-india", "gurgaon-india", "hyderabad-india",
    "noida-india", "ghaziabad-india", "faridabad-india",
    "mg-road-gurgaon", "sohna-road-gurgaon", "cyber-city-gurgaon", "golf-course-road-gurgaon",
    "connaught-place-delhi", "nehru-place-delhi", "saket-delhi", "dwarka-delhi",
    "sector-18-noida", "sector-62-noida", "indirapuram-ghaziabad", "nit-faridabad",
    "new-york-usa", "san-francisco-usa", "los-angeles-usa", "austin-usa",
    "london-uk", "manchester-uk",
    "toronto-canada", "vancouver-canada",
    "sydney-australia", "melbourne-australia",
    "dubai-uae", "abu-dhabi-uae",
    "singapore-singapore",
]
