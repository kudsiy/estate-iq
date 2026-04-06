/**
 * AI Studio Engine — Server-side generation pipeline.
 *
 * Replaces the static template system with AI-driven generation:
 * - generatePropertyAd: Creates a property ad image using brand kit
 * - rebrandCompetitorAd: Analyzes competitor ad → regenerates with user brand
 * - generateCaption: Produces Amharic + English captions with hashtags
 * - generateVideoFrames: Creates branded video overlay frames
 */

import { invokeLLM, type InvokeResult } from "./llm";
import { generateImage } from "./imageGeneration";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ListingDetails {
  title: string;
  price: string;
  city: string;
  subcity: string;
  subLocation: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  description: string;
  nearbyLandmarks: string;
  utilities: string;
  finishingLevel: string;
  negotiable: boolean;
  propertyUse: string;
  titleType: string;
  imageUrl?: string;
}

export interface BrandKitData {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontHeading: string;
  fontBody: string;
  phoneNumber: string;
  whatsappNumber: string;
  facebookUrl: string;
  instagramHandle: string;
  tiktokHandle: string;
  telegramChannel: string;
  agentPortrait?: string;
  tagline: string;
  targetAreas: string[];
  languagePreference: "amharic" | "english" | "both";
}

export interface GeneratedAd {
  imageUrl: string;
  caption: {
    amharic: string;
    english: string;
    combined: string;
  };
  hashtags: string[];
  amharicHashtags: string[];
}

export interface RebrandResult {
  imageUrl: string;
  analysis: {
    detectedColors: string[];
    detectedLayout: string;
    detectedText: string[];
    watermarkArea?: { x: number; y: number; w: number; h: number };
  };
}

// ─── BRAND KIT NORMALIZER ─────────────────────────────────────────────────────

export function normalizeBrandKit(raw: any): BrandKitData {
  const colors = Array.isArray(raw.colors) ? raw.colors : [];
  const fonts = Array.isArray(raw.fonts) ? raw.fonts : [];
  const targetAreas = Array.isArray(raw.targetAreas) ? raw.targetAreas : [];

  return {
    name: raw.name || "My Brand",
    logoUrl:
      (Array.isArray(raw.logos) ? raw.logos[0]?.src : undefined) || undefined,
    primaryColor: colors[0]?.hex || "#1e3a5f",
    secondaryColor: colors[1]?.hex || "#f5f0eb",
    textColor: "#ffffff",
    backgroundColor: colors[2]?.hex || "#0a0a0f",
    fontHeading: fonts[0]?.family || "Poppins, sans-serif",
    fontBody: fonts[1]?.family || fonts[0]?.family || "Poppins, sans-serif",
    phoneNumber: raw.phoneNumber || "",
    whatsappNumber: raw.whatsappNumber || "",
    facebookUrl: raw.facebookUrl || "",
    instagramHandle: raw.instagramHandle || "",
    tiktokHandle: raw.tiktokHandle || "",
    telegramChannel: raw.telegramChannel || "",
    agentPortrait: raw.agentPortrait || undefined,
    tagline: raw.tagline || "",
    targetAreas,
    languagePreference: raw.languagePreference || "both",
  };
}

// ─── AD IMAGE PROMPT BUILDER ──────────────────────────────────────────────────

function buildAdImagePrompt(
  listing: ListingDetails,
  brand: BrandKitData,
  style: string
): string {
  const location = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;

  const brandDesc = brand.logoUrl
    ? `Include the brand logo prominently. Brand colors: ${brand.primaryColor} (primary), ${brand.secondaryColor} (secondary), ${brand.backgroundColor} (background).`
    : `Use these brand colors throughout: ${brand.primaryColor} (primary/accent), ${brand.secondaryColor} (secondary), ${brand.backgroundColor} (background).`;

  const styleMap: Record<string, string> = {
    classic:
      "Full-bleed property photo with bold serif headline at bottom-left, horizontal spec strip with price badge top-right, elegant border frame.",
    modern:
      "Split layout — property image takes top 70%, clean info strip at bottom with strong bold typography, minimal design.",
    minimal:
      "Centered frosted glass card over a faded property image, everything center-aligned, thin border frame, elegant and understated.",
    luxury:
      "Double border frame, 'EXCLUSIVE LISTING' badge, centered all-caps headline in italic serif, gold accent line, premium feel.",
    commercial:
      "Left-right split — property image on left 60% with diagonal clip, dark info panel on right 40% with bold stats.",
    instagram:
      "Full-bleed image with glassmorphic bottom card, backdrop blur effect, 'JUST LISTED' badge top-right, phone CTA button.",
  };

  const styleDesc = styleMap[style] || styleMap["modern"];

  const specs = [
    listing.bedrooms &&
      `${listing.bedrooms} Bedroom${listing.bedrooms !== "1" ? "s" : ""}`,
    listing.bathrooms &&
      `${listing.bathrooms} Bathroom${listing.bathrooms !== "1" ? "s" : ""}`,
    listing.area && `${listing.area}m²`,
  ]
    .filter(Boolean)
    .join(" | ");

  return `Create a professional Ethiopian real estate advertisement image.

PROPERTY DETAILS:
- Title: ${listing.title || "Premium Property"}
- Price: ${listing.price || "Contact for Price"}
- Location: ${location || listing.city || "Addis Ababa"}
- Type: ${listing.propertyType || "Apartment"}
- Specs: ${specs || "Contact for details"}
${listing.description ? `- Description highlights: ${listing.description.slice(0, 200)}` : ""}

BRAND IDENTITY:
${brandDesc}
${brand.tagline ? `- Tagline: "${brand.tagline}"` : ""}
${brand.phoneNumber ? `- Phone number to display: ${brand.phoneNumber}` : ""}

DESIGN STYLE: ${styleDesc}

IMPORTANT:
- The image must look like a professional Ethiopian real estate social media post
- Include the price prominently
- Include the location (subcity/sub-location)
- Include bedroom/bathroom/area specs
- Use the brand colors specified above
- If a logo URL was provided, include it
- Text must be readable and well-positioned
- Make it suitable for Instagram/TikTok/Facebook posting
- Ethiopian real estate aesthetic: bold, clear, professional`;
}

// ─── REBRAND ANALYSIS PROMPT ──────────────────────────────────────────────────

function buildRebrandPrompt(brand: BrandKitData): string {
  return `Analyze this competitor real estate advertisement image and provide a structured analysis.

Return JSON with:
{
  "detectedColors": ["#hex1", "#hex2", "#hex3"],
  "detectedLayout": "description of layout style",
  "detectedText": ["text element 1", "text element 2"],
  "watermarkArea": { "x": 0-100, "y": 0-100, "w": 0-100, "h": 0-100 }
}

Focus on:
- Where is the competitor logo/watermark?
- What is the overall layout composition?
- What text elements are present?
- What are the dominant colors?

Then generate a NEW ad design concept that:
- Uses the SAME layout style but with the user's brand identity
- Replaces competitor colors with: primary=${brand.primaryColor}, secondary=${brand.secondaryColor}, background=${brand.backgroundColor}
- Replaces competitor logo with user's brand: "${brand.name}"
- Keeps the professional real estate aesthetic
${brand.logoUrl ? "- Includes the user's brand logo" : ""}
${brand.phoneNumber ? "- Includes phone: " + brand.phoneNumber : ""}`;
}

// ─── CAPTION GENERATION PROMPT ────────────────────────────────────────────────

function buildCaptionPrompt(
  listing: ListingDetails,
  brand: BrandKitData
): string {
  const location = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;

  return `You are an expert Ethiopian real estate social media copywriter. Generate captions for a property listing.

PROPERTY:
- Title: ${listing.title || "Premium Property"}
- Price: ${listing.price || "Contact for Price"}
- Location: ${location || listing.city || "Addis Ababa"}
- Type: ${listing.propertyType || "Apartment"}
- Bedrooms: ${listing.bedrooms || "—"}
- Bathrooms: ${listing.bathrooms || "—"}
- Area: ${listing.area || "—"}m²
${listing.description ? `- Details: ${listing.description}` : ""}
${listing.nearbyLandmarks ? `- Nearby: ${listing.nearbyLandmarks}` : ""}
${listing.utilities ? `- Utilities: ${listing.utilities}` : ""}
${listing.finishingLevel ? `- Finishing: ${listing.finishingLevel}` : ""}
${listing.negotiable ? "- Price is negotiable" : "- Fixed price"}

BRAND:
- Company: ${brand.name}
${brand.tagline ? `- Tagline: "${brand.tagline}"` : ""}
${brand.phoneNumber ? `- Phone: ${brand.phoneNumber}` : ""}
${brand.whatsappNumber ? `- WhatsApp: ${brand.whatsappNumber}` : ""}
${brand.telegramChannel ? `- Telegram: ${brand.telegramChannel}` : ""}
${brand.instagramHandle ? `- Instagram: @${brand.instagramHandle}` : ""}
${brand.tiktokHandle ? `- TikTok: @${brand.tiktokHandle}` : ""}

LANGUAGE: ${brand.languagePreference}

Generate captions in this exact JSON format:
{
  "amharic": "Amharic caption with emojis, price, location, CTA, phone",
  "english": "English caption with emojis, price, location, CTA, phone",
  "hashtags": ["#EthiopianRealEstate", "#AddisAbaba", ...],
  "amharicHashtags": ["#ቤትለሽያጭ", "#አዲስአበባ", ...],
  "tiktok": "Short TikTok-style caption (Amharic + English mixed, emoji-heavy, urgent)"
}

RULES:
- Amharic caption goes first and is the primary caption
- Use emojis heavily (🏠📍💰🛏️🚿📐📲💬)
- Price must be prominent
- Location must be specific (subcity + sub-location)
- Include CTA with phone/WhatsApp/Telegram
- Ethiopian real estate posting style: urgent, professional, emoji-rich
- Hashtags must include Ethiopian + location-specific tags
- TikTok caption should be short, punchy, mixed Amharic/English`;
}

// ─── MAIN GENERATION FUNCTIONS ────────────────────────────────────────────────

export async function generatePropertyAd(
  listing: ListingDetails,
  brand: BrandKitData,
  style: string = "modern"
): Promise<{ imageUrl: string }> {
  const prompt = buildAdImagePrompt(listing, brand, style);

  try {
    const result = await generateImage({ prompt });
    if (result.url) {
      return { imageUrl: result.url };
    }
  } catch (err) {
    console.error("Image generation failed, using fallback:", err);
  }

  // Fallback: return a data URL placeholder
  throw new Error("Image generation failed. Please try again.");
}

export async function rebrandCompetitorAd(
  competitorImageUrl: string,
  brand: BrandKitData
): Promise<RebrandResult> {
  // Step 1: Analyze competitor ad with LLM (vision)
  const analysisResult = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a real estate ad design analyst. Analyze the image and return ONLY valid JSON.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: buildRebrandPrompt(brand) },
          {
            type: "image_url",
            image_url: { url: competitorImageUrl, detail: "high" },
          },
        ],
      },
    ],
    responseFormat: { type: "json_object" },
  });

  const analysisText = analysisResult.choices[0]?.message?.content;
  let analysis: RebrandResult["analysis"];

  try {
    const parsed =
      typeof analysisText === "string" ? JSON.parse(analysisText) : {};
    analysis = {
      detectedColors: parsed.detectedColors || [],
      detectedLayout: parsed.detectedLayout || "Unknown",
      detectedText: parsed.detectedText || [],
      watermarkArea: parsed.watermarkArea || undefined,
    };
  } catch {
    analysis = {
      detectedColors: [],
      detectedLayout: "Unknown layout",
      detectedText: [],
    };
  }

  // Step 2: Generate new ad using the analyzed layout style but with user brand
  const layoutStyle = analysis.detectedLayout.toLowerCase().includes("split")
    ? "commercial"
    : analysis.detectedLayout.toLowerCase().includes("minimal")
      ? "minimal"
      : analysis.detectedLayout.toLowerCase().includes("luxury")
        ? "luxury"
        : "modern";

  const newAdPrompt = buildAdImagePrompt(
    {
      title: "Rebranded Property",
      price: "",
      city: "Addis Ababa",
      subcity: "",
      subLocation: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      area: "",
      description: `Rebranded from competitor ad. Layout style: ${analysis.detectedLayout}. Replace all competitor branding with user brand "${brand.name}".`,
      nearbyLandmarks: "",
      utilities: "",
      finishingLevel: "",
      negotiable: false,
      propertyUse: "",
      titleType: "",
      imageUrl: competitorImageUrl,
    },
    brand,
    layoutStyle
  );

  try {
    const result = await generateImage({
      prompt: newAdPrompt,
      originalImages: competitorImageUrl ? [{ url: competitorImageUrl }] : [],
    });

    if (result.url) {
      return { imageUrl: result.url, analysis };
    }
  } catch (err) {
    console.error("Rebrand generation failed:", err);
  }

  throw new Error("Rebrand generation failed. Please try again.");
}

export async function generateCaption(
  listing: ListingDetails,
  brand: BrandKitData
): Promise<{
  amharic: string;
  english: string;
  combined: string;
  hashtags: string[];
  amharicHashtags: string[];
  tiktok: string;
}> {
  const result = await invokeLLM({
    messages: [{ role: "user", content: buildCaptionPrompt(listing, brand) }],
    responseFormat: { type: "json_object" },
  });

  const text = result.choices[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("Caption generation returned empty response");
  }

  try {
    const parsed = JSON.parse(text);
    return {
      amharic: parsed.amharic || "",
      english: parsed.english || "",
      combined:
        brand.languagePreference === "amharic"
          ? parsed.amharic
          : brand.languagePreference === "english"
            ? parsed.english
            : `${parsed.amharic || ""}\n\n${parsed.english || ""}`,
      hashtags: parsed.hashtags || [],
      amharicHashtags: parsed.amharicHashtags || [],
      tiktok: parsed.tiktok || "",
    };
  } catch {
    throw new Error("Failed to parse caption response");
  }
}
