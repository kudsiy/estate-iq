import { invokeLLM } from "./llm";
import { TRPCError } from "@trpc/server";

export interface TikTokMarketingPack {
  hook: string;
  description: string;
  hashtags: string[];
  vibe: string;
  musicSuggestion: string;
  amharicHook: string;
  amharicDescription: string;
}

export async function generateTikTokMarketingPack(property: {
  title: string;
  price: string | number | null;
  city: string;
  subcity?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  description?: string | null;
}): Promise<TikTokMarketingPack> {
  const priceFormatted = property.price 
    ? new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(Number(property.price))
    : "Contact for price";

  const prompt = `Act as a viral Real Estate TikTok Content Creator in Ethiopia. 
Create a scroll-stopping Marketing Pack for the following property:
Property: ${property.title}
Location: ${property.subcity ? `${property.subcity}, ` : ""}${property.city}
Price: ${priceFormatted}
Specs: ${property.bedrooms ?? "N/A"} Beds, ${property.bathrooms ?? "N/A"} Baths
Context: ${property.description || "Luxury finishing, premium location."}

Your goal is to make people stop scrolling. 

Requirements:
1. "Hook": A high-energy curiosity hook in English (max 10 words).
2. "Description": A TikTok-style description with emojis (max 40 words).
3. "Hashtags": 5-8 trending tags for Ethiopia Real Estate and TikTok.
4. "Vibe": Describe the aesthetic/vibe of the video (e.g. "Minimalist Luxury", "Sun-drenched Morning").
5. "Music Suggestion": Type of trending music or specific vibe (e.g. "Modern Afro-Jazz", "Upbeat Lo-Fi").
6. "Amharic Hook": The hook translated into elite, catchy "Pure Amharic".
7. "Amharic Description": The description in professional yet engaging Amharic.

Return ONLY a JSON object.`;

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a viral TikTok Marketing Strategist specializing in the Ethiopian Luxury Real Estate market.",
      },
      { role: "user", content: prompt },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "tiktok_marketing_pack",
        schema: {
          type: "object",
          properties: {
            hook: { type: "string" },
            description: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            vibe: { type: "string" },
            musicSuggestion: { type: "string" },
            amharicHook: { type: "string" },
            amharicDescription: { type: "string" },
          },
          required: ["hook", "description", "hashtags", "vibe", "musicSuggestion", "amharicHook", "amharicDescription"],
        },
      },
    },
  });

  try {
    const raw = result.choices[0].message.content;
    if (typeof raw !== "string") throw new Error("Invalid response content");
    return JSON.parse(raw);
  } catch (error) {
    console.error("AI Generation Error:", error);
    // Fallback Mock (High Fidelity)
    return {
      hook: "Wait until you see the kitchen in this " + (property.subcity || "Bole") + " mansion! 😱",
      description: "Luxury living redefined in the heart of Addis. 🏛️✨ Unbeatable views and elite finishing. Who's moving in? #EstateIQ",
      hashtags: ["#AddisAbaba", "#EthiopiaRealEstate", "#Bole", "#LuxuryLiving", "#EstateIQ"],
      vibe: "High-end Cinematic",
      musicSuggestion: "Sophisticated Deep House",
      amharicHook: "በቦሌ እምብርት የሚገኝ አስደናቂ ቤት! 😱",
      amharicDescription: "የቅንጦት ኑሮ በአዲስ አበባ። 🏛️✨ ምርጥ እይታ እና ዘመናዊ አጨራረስ። ማን ይገባበታል? #EstateIQ",
    };
  }
}
