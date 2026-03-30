/**
 * Studio Frontend Utilities
 * Includes mock data for safe fallbacks
 */

export function getStudioMock(route: string): any {
  switch (route) {
    case "ai.generateMarketingPack":
      return {
        id: "mock-pack-" + Math.random().toString(36).substr(2, 9),
        name: "AI Generated Marketing Pack",
        elements: [
          {
            id: "elem-1",
            type: "text",
            x: 50, y: 150, width: 500, height: 60,
            text: "Premium Listing: Addis Ababa",
            fontSize: 28, fontWeight: "bold", color: "#1e3a5f", textAlign: "center",
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
