/**
 * SEO Intelligence for the Estate IQ Design Studio.
 * Optimized for the Ethiopian real estate market (Addis Ababa, Bole, etc.).
 * Produces bilingual Amharic/English captions with localized hashtags.
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  altText: Record<string, string>;
}

export interface BilingualCaption {
  amharic: string;
  english: string;
  hashtags: string[];
  amharicHashtags: string[];
  combined: string;
}

const SUBCITY_AMHARIC: Record<string, string> = {
  bole: "ቦሌ",
  kirkos: "ቂርቆስ",
  yeka: "የካ",
  arada: "አራዳ",
  lideta: "ልደታ",
  gulele: "ጉለሌ",
  "kolfe keranio": "ኮልፌ ቀራኒዮ",
  "nifas silk-lafto": "ንፋስ ስልክ-ላፍቶ",
  "akaky kaliti": "አቃቂ ቃሊቲ",
  "lemi kura": "ለሚ ኩራ",
  cmc: "ሲ ኤም ሲ",
  kazanchis: "ካዛንቺስ",
  piassa: "ፒያሳ",
  sarbet: "ሳርቤት",
  summit: "ሰሚት",
  ayat: "አያት",
  gerji: "ገርጂ",
  megenagna: "መጋግና",
};

const AMHARIC_PROPERTY_TITLES: Record<string, string> = {
  villa: "የቅንጦት ቪላ ቤት ለሽያጭ",
  apartment: "ዘመናዊ አፓርትመንት ለሽያጭ",
  commercial: "ንግድ ቤት ለሽያጭ",
  land: "መሬት ለሽያጭ",
};

const AMHARIC_FEATURES: Record<string, string> = {
  bed: "መኝታ ክፍል",
  bath: "ባኞ",
  security: "24/7 ደህንነት",
  parking: "የመኪና ማቆሚያ",
  generator: "የኃይል ጀነሬተር",
  elevator: "ሊፍት",
  garden: "የአትክልት ስፍራ",
  furnished: "የተመቻቸ",
};

const AMHARIC_HASHTAGS = [
  "#ቤትለሽያጭ",
  "#ኢትዮጵያ",
  "#አዲስአበባ",
  "#የኢትዮጵያሪልኤስቴት",
  "#ቤት",
  "#አዲስአበባሪልኤስቴት",
];

const SUBCITY_HASHTAG_MAP: Record<string, string[]> = {
  bole: ["#ቦሌ", "#Bole", "#BoleAtlas", "#BoleRealEstate"],
  kirkos: ["#ቂርቆስ", "#Kirkos", "#KirkosRealEstate"],
  yeka: ["#የካ", "#Yeka", "#YekaRealEstate"],
  arada: ["#አራዳ", "#Arada", "#AradaRealEstate"],
  gerji: ["#ገርጂ", "#Gerji", "#GerjiMebratHail"],
  cmc: ["#ሲኤምሲ", "#CMC", "#CMCMichael"],
  kazanchis: ["#ካዛንቺስ", "#Kazanchis", "#KazanchisRealEstate"],
  piassa: ["#ፒያሳ", "#Piassa", "#PiassaRealEstate"],
};

const ENGLISH_HASHTAGS = [
  "#EthiopianRealEstate",
  "#AddisAbaba",
  "#Ethiopia",
  "#PropertyForSale",
  "#AddisHomes",
  "#EstateIQ",
];

const PROPERTY_TYPE_HASHTAGS: Record<string, string[]> = {
  villa: ["#Villa", "#LuxuryVilla", "#VillaForSale"],
  apartment: ["#Apartment", "#ApartmentForSale", "#CondoLife"],
  commercial: ["#CommercialProperty", "#OfficeSpace", "#InvestmentOpportunity"],
  land: ["#LandForSale", "#PlotForSale", "#RealEstateInvestment"],
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getAmharicSubcity(subcity: string): string {
  const key = subcity.toLowerCase();
  return SUBCITY_AMHARIC[key] || subcity;
}

function generateAmharicCaption(data: {
  title: string;
  price: string;
  location: string;
  subLocation: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  description: string;
  phone: string;
}): string {
  const type = data.propertyType.toLowerCase();
  const title = AMHARIC_PROPERTY_TITLES[type] || "ቤት ለሽያጭ";
  const subcityAm = getAmharicSubcity(data.location);
  const locationStr = data.subLocation
    ? `${subcityAm} ${data.subLocation}`
    : subcityAm;

  let caption = `🏠 ለሽያጭ | FOR SALE\n`;
  caption += `📍 ${locationStr} | ${data.location}, Addis Ababa\n`;
  caption += `💰 ${data.price}\n`;

  if (data.bedrooms || data.bathrooms || data.area) {
    const specs = [];
    if (data.bedrooms)
      specs.push(`🛏 ${data.bedrooms} ${AMHARIC_FEATURES.bed}`);
    if (data.bathrooms)
      specs.push(`🚿 ${data.bathrooms} ${AMHARIC_FEATURES.bath}`);
    if (data.area) specs.push(`📐 ${data.area}m²`);
    caption += `${specs.join(" | ")}\n`;
  }

  if (data.description) {
    caption += `\n${data.description}\n`;
  }

  if (data.phone) {
    caption += `\n📲 ይደውሉ: ${data.phone}\n`;
  }

  return caption;
}

function generateEnglishCaption(data: {
  title: string;
  price: string;
  location: string;
  subLocation: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  description: string;
  phone: string;
}): string {
  const locationStr = data.subLocation
    ? `${data.subLocation}, ${data.location}`
    : data.location;

  let caption = `🏠 FOR SALE\n`;
  caption += `📍 ${locationStr}, Addis Ababa\n`;
  caption += `💰 ${data.price}\n`;

  if (data.bedrooms || data.bathrooms || data.area) {
    const specs = [];
    if (data.bedrooms) specs.push(`🛏 ${data.bedrooms} Bed`);
    if (data.bathrooms) specs.push(`🚿 ${data.bathrooms} Bath`);
    if (data.area) specs.push(`📐 ${data.area}m²`);
    caption += `${specs.join(" | ")}\n`;
  }

  if (data.description) {
    caption += `\n${data.description}\n`;
  }

  if (data.phone) {
    caption += `\n📲 Contact: ${data.phone}\n`;
  }

  return caption;
}

function generateHashtags(data: { location: string; propertyType: string }): {
  english: string[];
  amharic: string[];
} {
  const english = [...ENGLISH_HASHTAGS];
  const amharic = [...AMHARIC_HASHTAGS];

  const subcityKey = data.location.toLowerCase();
  const subcityTags = SUBCITY_HASHTAG_MAP[subcityKey];
  if (subcityTags) {
    english.push(
      ...subcityTags.filter(t => t.startsWith("#") && /[A-Za-z]/.test(t))
    );
    amharic.push(...subcityTags.filter(t => /[^\x00-\x7F]/.test(t)));
  }

  const typeKey = data.propertyType.toLowerCase();
  const typeTags = PROPERTY_TYPE_HASHTAGS[typeKey];
  if (typeTags) {
    english.push(...typeTags);
  }

  return {
    english: Array.from(new Set(english)),
    amharic: Array.from(new Set(amharic)),
  };
}

/**
 * Generates a bilingual caption with Amharic first, English second, and combined hashtags.
 */
export function generateBilingualCaption(data: {
  title: string;
  price: string;
  location: string;
  subLocation: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  description: string;
  phone: string;
  languagePreference?: "amharic" | "english" | "both";
}): BilingualCaption {
  const lang = data.languagePreference || "both";

  const amharicCaption = generateAmharicCaption(data);
  const englishCaption = generateEnglishCaption(data);
  const hashtags = generateHashtags({
    location: data.location,
    propertyType: data.propertyType,
  });

  let amharic = "";
  let english = "";
  let combined = "";

  if (lang === "amharic") {
    amharic = `${amharicCaption}\n\n${hashtags.amharic.join(" ")}`;
    combined = amharic;
  } else if (lang === "english") {
    english = `${englishCaption}\n\n${hashtags.english.join(" ")}`;
    combined = english;
  } else {
    amharic = amharicCaption;
    english = englishCaption;
    combined = `${amharicCaption}\n\n${englishCaption}\n\n${hashtags.amharic.join(" ")} ${hashtags.english.join(" ")}`;
  }

  return {
    amharic,
    english,
    hashtags: hashtags.english,
    amharicHashtags: hashtags.amharic,
    combined,
  };
}

/**
 * Legacy function — kept for backward compatibility.
 * Wraps generateBilingualCaption and returns the combined string.
 */
export function optimizeCaption(
  baseCaption: string,
  subcity?: string,
  tags: string[] = []
): string {
  return generateBilingualCaption({
    title: baseCaption,
    price: "",
    location: subcity || "Addis Ababa",
    subLocation: "",
    propertyType: "apartment",
    bedrooms: "",
    bathrooms: "",
    area: "",
    description: baseCaption,
    phone: "",
    languagePreference: "both",
  }).combined;
}

/**
 * Infers alt-text for common design elements.
 */
export function inferAltText(element: {
  type: string;
  content: any;
  style: any;
}): string {
  if (element.type === "text") {
    return `Text overlay: "${element.content.text}"`;
  }
  if (element.type === "rect") {
    return `Graphic element with ${element.style.fill} background.`;
  }
  if (element.type === "image") {
    return "Property feature image.";
  }
  return "Marketing design element.";
}
