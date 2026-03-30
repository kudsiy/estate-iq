import { nanoid } from "nanoid";

/**
 * Defensive Registry for Studio Routes
 * Prevents 404s and streaming crashes by providing mock fallbacks
 * for unimplemented handlers.
 */

const registeredHandlers = new Set<string>();

export function registerRoute(route: string) {
  registeredHandlers.add(route);
}

export function isRegistered(route: string): boolean {
  return registeredHandlers.has(route);
}

export function getMock(route: string): any {
  switch (route) {
    case "ai.generateMarketingPack":
      return {
        id: nanoid(),
        name: "AI Generated Marketing Pack",
        elements: [
          {
            id: nanoid(),
            type: "text",
            x: 50, y: 100, width: 500, height: 60,
            text: "AI Generated: Luxury Villa",
            fontSize: 32, fontWeight: "bold", color: "#1e3a5f", textAlign: "center",
          },
          {
            id: nanoid(),
            type: "rect",
            x: 0, y: 0, width: 600, height: 800,
            fill: "#f5f0eb",
          }
        ],
      };

    case "extractor.parseListing":
      return {
        title: "Modern Apartment in Bole",
        price: "12,500,000",
        currency: "ETB",
        bedrooms: 3,
        bathrooms: 2,
        address: "Bole District, Addis Ababa",
        description: "A beautiful modern apartment located in the heart of Bole, featuring high-end finishes and 24/7 security.",
      };

    case "videoEngine.render":
      return {
        status: "completed",
        videoUrl: "https://storage.googleapis.com/estate-iq-mock/rendering-placeholder.mp4",
        thumbnailUrl: "https://storage.googleapis.com/estate-iq-mock/thumb-placeholder.jpg",
        duration: 15,
      };

    default:
      return { error: "Unknown route", mock: true };
  }
}
