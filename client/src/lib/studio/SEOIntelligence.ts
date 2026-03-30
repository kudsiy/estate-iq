/**
 * SEO Intelligence for the Estate IQ Design Studio.
 * Optimized for the Ethiopian real estate market (Addis Ababa, Bole, etc.).
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  altText: Record<string, string>; // elId -> altText
}

const LOCALIZED_KEYWORDS: Record<string, string[]> = {
  general: ["Real Estate Ethiopia", "Addis Ababa Homes", "Property for Sale Ethiopia", "Rent in Addis"],
  luxury: ["Luxury Villas Addis", "Premium Apartments Bole", "Exclusive Real Estate Ethiopia"],
  bole: ["Bole Real Estate", "Homes in Bole", "Apartments near Bole Road"],
  yeka: ["Yeka Real Estate", "Houses for Sale in Yeka"],
  kazanchis: ["Kazanchis Apartments", "Office Space Kazanchis"],
};

/**
 * Generates an SEO-optimized caption from a design state.
 */
export function optimizeCaption(baseCaption: string, subcity?: string, tags: string[] = []): string {
  let optimized = baseCaption;
  
  // 1. Inject localized keywords based on subcity
  const key = subcity?.toLowerCase() || "general";
  const extraKeywords = LOCALIZED_KEYWORDS[key] || LOCALIZED_KEYWORDS.general;
  
  // Take top 2 unique keywords
  const toAdd = extraKeywords.slice(0, 2).map(k => `#${k.replace(/\s+/g, '')}`);
  
  if (!optimized.includes(toAdd[0])) {
    optimized += `\n\n${toAdd.join(' ')}`;
  }

  // 2. Add standard industry hashtags
  const defaultHashtags = ["#EstateIQ", "#EthiopiaRealEstate", "#AddisAbaba"].filter(h => !optimized.includes(h));
  if (defaultHashtags.length > 0) {
    optimized += ` ${defaultHashtags.join(' ')}`;
  }

  return optimized;
}

/**
 * Infers alt-text for common design elements.
 */
export function inferAltText(element: { type: string; content: any; style: any }): string {
  if (element.type === 'text') {
    return `Text overlay: "${element.content.text}"`;
  }
  if (element.type === 'rect') {
    return `Graphic element with ${element.style.fill} background.`;
  }
  if (element.type === 'image') {
    return "Property feature image."; // AI would expand this in the actual LLM call
  }
  return "Marketing design element.";
}
