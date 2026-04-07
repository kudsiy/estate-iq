/**
 * Client-side canvas ad generator.
 * Renders professional Ethiopian real estate ad images directly in the browser.
 * No external API needed — works offline.
 */

export interface AdBrandConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  phoneNumber?: string;
  companyName?: string;
  tagline?: string;
}

export interface AdListingData {
  title: string;
  price: string;
  subcity: string;
  subLocation: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  description: string;
  imageUrl?: string;
}

export type AdStyle =
  | "classic"
  | "modern"
  | "minimal"
  | "luxury"
  | "commercial"
  | "instagram";

const WIDTH = 1080;
const HEIGHT = 1080;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY - y;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function renderClassic(
  ctx: CanvasRenderingContext2D,
  listing: AdListingData,
  brand: AdBrandConfig,
  bgImage: HTMLImageElement | null
) {
  // Background
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Image
  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT * 0.65);
    // Gradient overlay
    const grad = ctx.createLinearGradient(0, HEIGHT * 0.4, 0, HEIGHT);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, hexToRgba(brand.backgroundColor, 0.7));
    grad.addColorStop(1, brand.backgroundColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, HEIGHT * 0.4, WIDTH, HEIGHT * 0.6);
  } else {
    ctx.fillStyle = hexToRgba(brand.primaryColor, 0.3);
    ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.65);
    ctx.fillStyle = brand.textColor;
    ctx.font = "bold 48px serif";
    ctx.textAlign = "center";
    ctx.fillText("PROPERTY PHOTO", WIDTH / 2, HEIGHT * 0.35);
  }

  // Top bar: logo + price badge
  if (brand.logoUrl) {
    try {
      const logo = await loadImage(brand.logoUrl);
      const logoH = 80;
      const logoW = (logo.width / logo.height) * logoH;
      ctx.drawImage(logo, 40, 30, logoW, logoH);
    } catch {
      /* skip */
    }
  } else if (brand.companyName) {
    ctx.fillStyle = brand.textColor;
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(brand.companyName.toUpperCase(), 40, 80);
  }

  // Price badge
  ctx.fillStyle = brand.primaryColor;
  drawRoundedRect(ctx, WIDTH - 340, 30, 300, 80, 20);
  ctx.fill();
  ctx.fillStyle = brand.backgroundColor;
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(listing.price || "CONTACT", WIDTH - 190, 80);

  // Bottom content area
  const bottomY = HEIGHT * 0.68;
  ctx.fillStyle = brand.textColor;
  ctx.textAlign = "left";

  // Title
  ctx.font = "bold 64px sans-serif";
  wrapText(
    ctx,
    listing.title || "Premium Property",
    50,
    bottomY + 60,
    WIDTH - 100,
    76
  );

  // Location
  ctx.font = "32px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.7);
  const loc = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;
  ctx.fillText(`📍 ${loc || "Addis Ababa"}`, 50, bottomY + 160);

  // Divider line
  ctx.fillStyle = brand.primaryColor;
  ctx.fillRect(50, bottomY + 190, 120, 6);

  // Specs bar
  const specY = bottomY + 240;
  ctx.fillStyle = hexToRgba(brand.textColor, 0.08);
  drawRoundedRect(ctx, 50, specY, WIDTH - 100, 140, 24);
  ctx.fill();

  ctx.fillStyle = brand.textColor;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  const specs = [
    { label: "BEDS", value: listing.bedrooms || "—" },
    { label: "BATHS", value: listing.bathrooms || "—" },
    { label: "AREA", value: listing.area ? `${listing.area}m²` : "—" },
    { label: "CALL", value: brand.phoneNumber || "—" },
  ];
  const specW = (WIDTH - 100) / 4;
  specs.forEach((s, i) => {
    const cx = 50 + specW * i + specW / 2;
    ctx.fillStyle = brand.primaryColor;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(s.label, cx, specY + 40);
    ctx.fillStyle = brand.textColor;
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(s.value, cx, specY + 95);
  });

  // Border frame
  ctx.strokeStyle = hexToRgba(brand.textColor, 0.15);
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 20, 20, WIDTH - 40, HEIGHT - 40, 40);
  ctx.stroke();
}

async function renderModern(
  ctx: CanvasRenderingContext2D,
  listing: AdListingData,
  brand: AdBrandConfig,
  bgImage: HTMLImageElement | null
) {
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const imgH = HEIGHT * 0.7;

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, WIDTH, imgH);
  } else {
    ctx.fillStyle = brand.secondaryColor;
    ctx.fillRect(0, 0, WIDTH, imgH);
    ctx.fillStyle = hexToRgba(brand.primaryColor, 0.3);
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PROPERTY PHOTO", WIDTH / 2, imgH / 2);
  }

  // Price overlay on image
  ctx.fillStyle = hexToRgba(brand.textColor, 0.9);
  drawRoundedRect(ctx, 40, imgH - 120, 320, 80, 20);
  ctx.fill();
  ctx.fillStyle = brand.primaryColor;
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(listing.price || "ETB —", 60, imgH - 68);

  // Info strip
  const infoY = imgH + 20;
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(0, imgH, WIDTH, HEIGHT - imgH);

  // Top accent line
  ctx.fillStyle = brand.primaryColor;
  ctx.fillRect(0, imgH, WIDTH, 8);

  ctx.fillStyle = brand.textColor;
  ctx.textAlign = "left";
  ctx.font = "bold 56px sans-serif";
  wrapText(
    ctx,
    (listing.title || "Modern Residence").toUpperCase(),
    50,
    infoY + 70,
    WIDTH - 100,
    66
  );

  const loc = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;
  ctx.font = "30px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.6);
  ctx.fillText(`📍 ${loc || "Addis Ababa"}`, 50, infoY + 130);

  // Specs row
  const specY = infoY + 200;
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.4);
  ctx.textAlign = "center";
  ctx.fillText("BEDS", WIDTH * 0.3, specY);
  ctx.fillText("BATHS", WIDTH * 0.5, specY);
  ctx.fillText("CONTACT", WIDTH * 0.7, specY);

  ctx.font = "bold 48px sans-serif";
  ctx.fillStyle = brand.textColor;
  ctx.fillText(listing.bedrooms || "0", WIDTH * 0.3, specY + 55);
  ctx.fillText(listing.bathrooms || "0", WIDTH * 0.5, specY + 55);
  ctx.fillStyle = brand.primaryColor;
  ctx.fillText(brand.phoneNumber || "—", WIDTH * 0.7, specY + 55);
}

async function renderMinimal(
  ctx: CanvasRenderingContext2D,
  listing: AdListingData,
  brand: AdBrandConfig,
  bgImage: HTMLImageElement | null
) {
  ctx.fillStyle = brand.secondaryColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (bgImage) {
    ctx.globalAlpha = 0.15;
    ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
  }

  // Border
  ctx.strokeStyle = brand.primaryColor;
  ctx.lineWidth = 16;
  ctx.strokeRect(30, 30, WIDTH - 60, HEIGHT - 60);

  // Center card
  const cardX = WIDTH * 0.12;
  const cardY = HEIGHT * 0.15;
  const cardW = WIDTH * 0.76;
  const cardH = HEIGHT * 0.7;

  ctx.fillStyle = hexToRgba(brand.backgroundColor, 0.92);
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 60);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = brand.textColor;

  if (brand.companyName) {
    ctx.font = "24px sans-serif";
    ctx.fillStyle = hexToRgba(brand.textColor, 0.4);
    ctx.fillText(brand.companyName.toUpperCase(), WIDTH / 2, cardY + 70);
  }

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = brand.textColor;
  wrapText(
    ctx,
    listing.title || "Property Name",
    WIDTH / 2,
    cardY + 140,
    cardW - 80,
    64
  );

  // Divider
  ctx.fillStyle = hexToRgba(brand.textColor, 0.1);
  ctx.fillRect(WIDTH / 2 - 40, cardY + 200, 80, 4);

  const loc = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;
  ctx.font = "30px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.6);
  ctx.fillText(loc || "Addis Ababa", WIDTH / 2, cardY + 260);

  ctx.font = "bold 44px sans-serif";
  ctx.fillStyle = brand.primaryColor;
  ctx.fillText(listing.price || "Price on Request", WIDTH / 2, cardY + 340);

  ctx.font = "24px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.5);
  ctx.fillText(
    `${listing.bedrooms || "—"} Beds  •  ${listing.bathrooms || "—"} Baths  •  ${listing.area || "—"}m²`,
    WIDTH / 2,
    cardY + 400
  );

  if (brand.phoneNumber) {
    ctx.strokeStyle = hexToRgba(brand.textColor, 0.15);
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, WIDTH / 2 - 140, cardY + 440, 280, 60, 30);
    ctx.stroke();
    ctx.fillStyle = brand.textColor;
    ctx.font = "26px sans-serif";
    ctx.fillText(brand.phoneNumber, WIDTH / 2, cardY + 478);
  }
}

async function renderLuxury(
  ctx: CanvasRenderingContext2D,
  listing: AdListingData,
  brand: AdBrandConfig,
  bgImage: HTMLImageElement | null
) {
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, hexToRgba(brand.backgroundColor, 0.3));
    grad.addColorStop(0.5, hexToRgba(brand.backgroundColor, 0.6));
    grad.addColorStop(1, brand.backgroundColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Double border
  ctx.strokeStyle = hexToRgba(brand.textColor, 0.2);
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, WIDTH - 60, HEIGHT - 60);
  ctx.strokeStyle = brand.primaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 50, WIDTH - 100, HEIGHT - 100);

  ctx.textAlign = "center";
  ctx.fillStyle = brand.textColor;

  // Exclusive badge
  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.5);
  ctx.fillText("EXCLUSIVE LISTING", WIDTH / 2, 120);

  // Divider
  ctx.fillStyle = brand.primaryColor;
  ctx.fillRect(WIDTH / 2 - 60, 140, 120, 4);

  // Title
  ctx.font = "bold italic 64px serif";
  ctx.fillStyle = brand.textColor;
  wrapText(
    ctx,
    listing.title || "Palatial Estate",
    WIDTH / 2,
    220,
    WIDTH - 160,
    76
  );

  const loc = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;
  ctx.font = "28px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.6);
  ctx.fillText(loc || "Bole, Addis Ababa", WIDTH / 2, 340);

  // Specs
  const specY = 420;
  ctx.strokeStyle = hexToRgba(brand.textColor, 0.1);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, specY);
  ctx.lineTo(WIDTH - 100, specY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(100, specY + 120);
  ctx.lineTo(WIDTH - 100, specY + 120);
  ctx.stroke();

  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.4);
  ctx.fillText("BEDROOMS", WIDTH / 2 - 200, specY + 35);
  ctx.fillText("BATHROOMS", WIDTH / 2, specY + 35);
  ctx.fillText("GROUND AREA", WIDTH / 2 + 200, specY + 35);

  ctx.font = "bold 48px serif";
  ctx.fillStyle = brand.textColor;
  ctx.fillText(listing.bedrooms || "—", WIDTH / 2 - 200, specY + 95);
  ctx.fillText(listing.bathrooms || "—", WIDTH / 2, specY + 95);
  ctx.fillText(
    listing.area ? `${listing.area}m²` : "—",
    WIDTH / 2 + 200,
    specY + 95
  );

  // Price
  ctx.font = "bold 64px sans-serif";
  ctx.fillStyle = brand.primaryColor;
  ctx.fillText(listing.price || "ETB —", WIDTH / 2, 640);

  // CTA
  ctx.fillStyle = brand.primaryColor;
  drawRoundedRect(ctx, WIDTH / 2 - 180, 700, 360, 70, 10);
  ctx.fill();
  ctx.fillStyle = brand.backgroundColor;
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("PRIVATE VIEWING", WIDTH / 2, 745);

  if (brand.phoneNumber) {
    ctx.fillStyle = hexToRgba(brand.textColor, 0.8);
    ctx.font = "28px monospace";
    ctx.fillText(brand.phoneNumber, WIDTH / 2, 830);
  }
}

async function renderCommercial(
  ctx: CanvasRenderingContext2D,
  listing: AdListingData,
  brand: AdBrandConfig,
  bgImage: HTMLImageElement | null
) {
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const imgW = WIDTH * 0.55;

  if (bgImage) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(imgW + 80, 0);
    ctx.lineTo(imgW - 80, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(bgImage, 0, 0, imgW + 80, HEIGHT);
    ctx.restore();
  } else {
    ctx.fillStyle = brand.secondaryColor;
    ctx.fillRect(0, 0, imgW, HEIGHT);
  }

  // Right panel
  const panelX = imgW - 40;
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(panelX, 0, WIDTH - panelX, HEIGHT);

  ctx.textAlign = "left";
  ctx.fillStyle = brand.textColor;

  // Badge
  ctx.strokeStyle = brand.primaryColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(panelX + 40, 60, 200, 40);
  ctx.fillStyle = brand.primaryColor;
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("COMMERCIAL", panelX + 55, 87);

  // Title
  ctx.fillStyle = brand.textColor;
  ctx.font = "bold 52px sans-serif";
  wrapText(
    ctx,
    (listing.title || "Corporate Complex").toUpperCase(),
    panelX + 40,
    160,
    WIDTH - panelX - 80,
    62
  );

  // Divider
  ctx.fillStyle = brand.primaryColor;
  ctx.fillRect(panelX + 40, 300, 100, 6);

  const loc = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;
  ctx.font = "26px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.5);
  ctx.fillText(`📍 ${loc || "Commercial District"}`, panelX + 40, 360);

  // Stats
  const stats = [
    { label: "TOTAL AREA", value: listing.area ? `${listing.area} SQM` : "—" },
    { label: "INVESTMENT", value: listing.price || "CONTACT" },
    { label: "INQUIRIES", value: brand.phoneNumber || "—" },
  ];

  stats.forEach((s, i) => {
    const y = 440 + i * 130;
    ctx.fillStyle = hexToRgba(brand.textColor, 0.06);
    ctx.fillRect(panelX + 40, y, WIDTH - panelX - 80, 100);
    ctx.fillStyle = brand.primaryColor;
    ctx.fillRect(panelX + 40, y, 6, 100);
    ctx.fillStyle = hexToRgba(brand.textColor, 0.4);
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(s.label, panelX + 70, y + 35);
    ctx.fillStyle = brand.textColor;
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(s.value, panelX + 70, y + 75);
  });
}

async function renderInstagram(
  ctx: CanvasRenderingContext2D,
  listing: AdListingData,
  brand: AdBrandConfig,
  bgImage: HTMLImageElement | null
) {
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = hexToRgba(brand.primaryColor, 0.2);
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(1, hexToRgba(brand.backgroundColor, 0.95));
  ctx.fillStyle = grad;
  ctx.fillRect(0, HEIGHT * 0.5, WIDTH, HEIGHT * 0.5);

  // Top bar
  if (brand.logoUrl) {
    try {
      const logo = await loadImage(brand.logoUrl);
      const logoH = 60;
      const logoW = (logo.width / logo.height) * logoH;
      ctx.drawImage(logo, 40, 30, logoW, logoH);
    } catch {
      /* skip */
    }
  }

  // Just Listed badge
  ctx.fillStyle = brand.textColor;
  drawRoundedRect(ctx, WIDTH - 260, 30, 220, 50, 25);
  ctx.fill();
  ctx.fillStyle = brand.backgroundColor;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JUST LISTED", WIDTH - 150, 63);

  // Bottom glass card
  const cardY = HEIGHT - 420;
  ctx.fillStyle = hexToRgba(brand.backgroundColor, 0.85);
  drawRoundedRect(ctx, 40, cardY, WIDTH - 80, 380, 50);
  ctx.fill();

  // Top accent
  ctx.fillStyle = brand.primaryColor;
  drawRoundedRect(ctx, 40, cardY, WIDTH - 80, 8, 4);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = brand.textColor;

  // Title + Price row
  ctx.font = "bold 44px sans-serif";
  wrapText(
    ctx,
    listing.title || "Modern Smart Home",
    70,
    cardY + 70,
    WIDTH - 380,
    54
  );

  ctx.textAlign = "right";
  ctx.fillStyle = brand.primaryColor;
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(listing.price || "ETB —", WIDTH - 70, cardY + 70);

  ctx.textAlign = "left";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.5);
  ctx.font = "26px sans-serif";
  const loc = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;
  ctx.fillText(`📍 ${loc || "Addis Ababa"}`, 70, cardY + 120);

  // Divider
  ctx.fillStyle = hexToRgba(brand.textColor, 0.1);
  ctx.fillRect(70, cardY + 145, WIDTH - 140, 2);

  // Specs
  ctx.textAlign = "center";
  ctx.fillStyle = brand.textColor;
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(listing.bedrooms || "0", 160, cardY + 210);
  ctx.fillText(listing.bathrooms || "0", WIDTH / 2, cardY + 210);
  ctx.fillText(listing.area || "0", WIDTH - 160, cardY + 210);

  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = hexToRgba(brand.textColor, 0.3);
  ctx.fillText("BEDS", 160, cardY + 240);
  ctx.fillText("BATHS", WIDTH / 2, cardY + 240);
  ctx.fillText("m²", WIDTH - 160, cardY + 240);

  // CTA button
  ctx.fillStyle = brand.textColor;
  drawRoundedRect(ctx, WIDTH / 2 - 140, cardY + 280, 280, 60, 30);
  ctx.fill();
  ctx.fillStyle = brand.backgroundColor;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`📞 ${brand.phoneNumber || "CONTACT"}`, WIDTH / 2, cardY + 318);
}

const renderers: Record<AdStyle, typeof renderClassic> = {
  classic: renderClassic,
  modern: renderModern,
  minimal: renderMinimal,
  luxury: renderLuxury,
  commercial: renderCommercial,
  instagram: renderInstagram,
};

export async function generateAdImage(
  listing: AdListingData,
  brand: AdBrandConfig,
  style: AdStyle = "modern"
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  let bgImage: HTMLImageElement | null = null;
  if (listing.imageUrl) {
    try {
      bgImage = await loadImage(listing.imageUrl);
    } catch {
      bgImage = null;
    }
  }

  const renderer = renderers[style] || renderModern;
  await renderer(ctx, listing, brand, bgImage);

  return canvas.toDataURL("image/png");
}
