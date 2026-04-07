/**
 * Client-side canvas ad + video generator.
 * Renders Ethiopian real estate ads and videos in browser — no API needed.
 * Strictly uses brand kit colors — no fallbacks, no hardcoded palettes.
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
  whatsappNumber?: string;
  telegramChannel?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  languagePreference?: "amharic" | "english" | "both";
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
  nearbyLandmarks?: string;
  utilities?: string;
  finishingLevel?: string;
  negotiable?: boolean;
  imageUrl?: string;
}

export type AdStyle =
  | "classic"
  | "modern"
  | "minimal"
  | "luxury"
  | "commercial"
  | "instagram";

const W = 1080;
const H = 1080;

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function rrect(
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

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
): number {
  let size = 64;
  while (size > 12) {
    ctx.font = `bold ${size}px sans-serif`;
    if (ctx.measureText(text).width <= maxW) return size;
    size -= 2;
  }
  return 12;
}

function fillWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number
): number {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line !== "") {
      ctx.fillText(line.trim(), x, cy);
      line = word + " ";
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy);
  return cy - y;
}

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("img"));
    img.src = src;
  });
}

/* ─── REBRAND RENDERER: covers competitor branding with solid brand block ─── */
async function renderRebrand(
  ctx: CanvasRenderingContext2D,
  listing: AdListingData,
  brand: AdBrandConfig,
  bgImage: HTMLImageElement | null
) {
  // Full brand background
  ctx.fillStyle = brand.backgroundColor;
  ctx.fillRect(0, 0, W, H);

  if (bgImage) {
    // Show competitor image but cover top/bottom with brand
    const margin = 120;
    ctx.drawImage(bgImage, 0, margin, W, H - margin * 2);

    // Top brand bar — covers competitor logo/watermark
    ctx.fillStyle = brand.primaryColor;
    ctx.fillRect(0, 0, W, margin);
    ctx.fillStyle = brand.textColor;
    ctx.textAlign = "center";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(brand.companyName || "", W / 2, 75);

    // Bottom brand bar — covers competitor contact info
    ctx.fillStyle = brand.primaryColor;
    ctx.fillRect(0, H - margin, W, margin);
    ctx.fillStyle = brand.textColor;
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(brand.phoneNumber || "Contact Us", W / 2, H - margin + 70);

    // Side brand strips to cover any side watermarks
    ctx.fillStyle = brand.primaryColor;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, margin, 60, H - margin * 2);
    ctx.fillRect(W - 60, margin, 60, H - margin * 2);
    ctx.globalAlpha = 1;

    // Logo overlay center
    if (brand.logoUrl) {
      try {
        const logo = await loadImg(brand.logoUrl);
        const lh = 100;
        const lw = (logo.width / logo.height) * lh;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = rgba(brand.backgroundColor, 0.8);
        rrect(
          ctx,
          W / 2 - lw / 2 - 20,
          H / 2 - lh / 2 - 20,
          lw + 40,
          lh + 40,
          20
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.drawImage(logo, W / 2 - lw / 2, H / 2 - lh / 2, lw, lh);
      } catch {
        /* skip */
      }
    }
  } else {
    ctx.fillStyle = rgba(brand.primaryColor, 0.4);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = brand.textColor;
    ctx.textAlign = "center";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("Upload a competitor ad to rebrand", W / 2, H / 2);
  }
}

/* ─── CLASSIC ─── */
async function renderClassic(
  ctx: CanvasRenderingContext2D,
  l: AdListingData,
  b: AdBrandConfig,
  img: HTMLImageElement | null
) {
  ctx.fillStyle = b.backgroundColor;
  ctx.fillRect(0, 0, W, H);

  if (img) {
    ctx.drawImage(img, 0, 0, W, H * 0.62);
    const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.6, rgba(b.backgroundColor, 0.85));
    g.addColorStop(1, b.backgroundColor);
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.35, W, H * 0.65);
  } else {
    ctx.fillStyle = rgba(b.primaryColor, 0.25);
    ctx.fillRect(0, 0, W, H * 0.62);
    ctx.fillStyle = b.textColor;
    ctx.textAlign = "center";
    ctx.font = "bold 44px serif";
    ctx.fillText("PROPERTY PHOTO", W / 2, H * 0.33);
  }

  // Top: logo + price
  if (b.logoUrl) {
    try {
      const logo = await loadImg(b.logoUrl);
      const lh = 70;
      ctx.drawImage(logo, 35, 25, (logo.width / logo.height) * lh, lh);
    } catch {}
  } else if (b.companyName) {
    ctx.fillStyle = b.textColor;
    ctx.textAlign = "left";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(b.companyName.toUpperCase(), 35, 70);
  }

  // Price badge
  ctx.fillStyle = b.primaryColor;
  rrect(ctx, W - 320, 25, 285, 72, 18);
  ctx.fill();
  ctx.fillStyle = b.backgroundColor;
  ctx.textAlign = "center";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(l.price || "CONTACT", W - 177, 72);

  // Content
  const by = H * 0.65;
  ctx.textAlign = "left";
  ctx.fillStyle = b.textColor;
  const ts = fitText(ctx, l.title || "Premium Property", W - 100);
  ctx.font = `bold ${ts}px sans-serif`;
  fillWrapped(ctx, l.title || "Premium Property", 45, by + 55, W - 90, ts + 12);

  const loc = l.subLocation ? `${l.subLocation}, ${l.subcity}` : l.subcity;
  ctx.font = "30px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.65);
  ctx.fillText(`📍 ${loc || "Addis Ababa"}`, 45, by + 150);

  // Accent line
  ctx.fillStyle = b.primaryColor;
  ctx.fillRect(45, by + 175, 100, 5);

  // Specs
  const sy = by + 225;
  ctx.fillStyle = rgba(b.textColor, 0.07);
  rrect(ctx, 45, sy, W - 90, 130, 22);
  ctx.fill();

  ctx.textAlign = "center";
  const items = [
    { l: "BEDS", v: l.bedrooms || "—" },
    { l: "BATHS", v: l.bathrooms || "—" },
    { l: "AREA", v: l.area ? `${l.area}m²` : "—" },
    { l: "CALL", v: b.phoneNumber || "—" },
  ];
  const iw = (W - 90) / 4;
  items.forEach((it, i) => {
    const cx = 45 + iw * i + iw / 2;
    ctx.fillStyle = b.primaryColor;
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(it.l, cx, sy + 38);
    ctx.fillStyle = b.textColor;
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(it.v, cx, sy + 90);
  });

  // Frame
  ctx.strokeStyle = rgba(b.textColor, 0.12);
  ctx.lineWidth = 3;
  rrect(ctx, 18, 18, W - 36, H - 36, 36);
  ctx.stroke();
}

/* ─── MODERN ─── */
async function renderModern(
  ctx: CanvasRenderingContext2D,
  l: AdListingData,
  b: AdBrandConfig,
  img: HTMLImageElement | null
) {
  ctx.fillStyle = b.backgroundColor;
  ctx.fillRect(0, 0, W, H);
  const ih = H * 0.68;

  if (img) ctx.drawImage(img, 0, 0, W, ih);
  else {
    ctx.fillStyle = b.secondaryColor;
    ctx.fillRect(0, 0, W, ih);
    ctx.fillStyle = rgba(b.primaryColor, 0.3);
    ctx.textAlign = "center";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("PROPERTY PHOTO", W / 2, ih / 2);
  }

  // Price overlay
  ctx.fillStyle = rgba(b.textColor, 0.88);
  rrect(ctx, 35, ih - 110, 300, 75, 18);
  ctx.fill();
  ctx.fillStyle = b.primaryColor;
  ctx.textAlign = "left";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(l.price || "ETB —", 55, ih - 60);

  // Info
  ctx.fillStyle = b.backgroundColor;
  ctx.fillRect(0, ih, W, H - ih);
  ctx.fillStyle = b.primaryColor;
  ctx.fillRect(0, ih, W, 7);

  ctx.fillStyle = b.textColor;
  ctx.textAlign = "left";
  const ts = fitText(
    ctx,
    (l.title || "Modern Residence").toUpperCase(),
    W - 100
  );
  ctx.font = `bold ${ts}px sans-serif`;
  fillWrapped(
    ctx,
    (l.title || "Modern Residence").toUpperCase(),
    45,
    ih + 65,
    W - 90,
    ts + 10
  );

  const loc = l.subLocation ? `${l.subLocation}, ${l.subcity}` : l.subcity;
  ctx.font = "28px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.55);
  ctx.fillText(`📍 ${loc || "Addis Ababa"}`, 45, ih + 125);

  // Specs
  const sy = ih + 195;
  ctx.textAlign = "center";
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.35);
  ["BEDS", "BATHS", "CONTACT"].forEach((t, i) =>
    ctx.fillText(t, W * (0.3 + i * 0.2), sy)
  );
  ctx.font = "bold 46px sans-serif";
  ctx.fillStyle = b.textColor;
  ctx.fillText(l.bedrooms || "0", W * 0.3, sy + 52);
  ctx.fillText(l.bathrooms || "0", W * 0.5, sy + 52);
  ctx.fillStyle = b.primaryColor;
  ctx.fillText(b.phoneNumber || "—", W * 0.7, sy + 52);
}

/* ─── MINIMAL ─── */
async function renderMinimal(
  ctx: CanvasRenderingContext2D,
  l: AdListingData,
  b: AdBrandConfig,
  img: HTMLImageElement | null
) {
  ctx.fillStyle = b.secondaryColor;
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.globalAlpha = 0.12;
    ctx.drawImage(img, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = b.primaryColor;
  ctx.lineWidth = 14;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  const cx = W * 0.12,
    cy = H * 0.14,
    cw = W * 0.76,
    ch = H * 0.72;
  ctx.fillStyle = rgba(b.backgroundColor, 0.92);
  rrect(ctx, cx, cy, cw, ch, 55);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = b.textColor;
  if (b.companyName) {
    ctx.font = "22px sans-serif";
    ctx.fillStyle = rgba(b.textColor, 0.35);
    ctx.fillText(b.companyName.toUpperCase(), W / 2, cy + 65);
  }

  ctx.font = `bold ${fitText(ctx, l.title || "Property", cw - 80)}px sans-serif`;
  ctx.fillStyle = b.textColor;
  fillWrapped(ctx, l.title || "Property", W / 2, cy + 130, cw - 80, 60);

  ctx.fillStyle = rgba(b.textColor, 0.08);
  ctx.fillRect(W / 2 - 35, cy + 195, 70, 3);

  const loc = l.subLocation ? `${l.subLocation}, ${l.subcity}` : l.subcity;
  ctx.font = "28px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.55);
  ctx.fillText(loc || "Addis Ababa", W / 2, cy + 250);

  ctx.font = "bold 42px sans-serif";
  ctx.fillStyle = b.primaryColor;
  ctx.fillText(l.price || "Price on Request", W / 2, cy + 325);

  ctx.font = "22px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.45);
  ctx.fillText(
    `${l.bedrooms || "—"} Beds  •  ${l.bathrooms || "—"} Baths  •  ${l.area || "—"}m²`,
    W / 2,
    cy + 380
  );

  if (b.phoneNumber) {
    ctx.strokeStyle = rgba(b.textColor, 0.12);
    ctx.lineWidth = 2;
    rrect(ctx, W / 2 - 130, cy + 425, 260, 55, 28);
    ctx.stroke();
    ctx.fillStyle = b.textColor;
    ctx.font = "24px sans-serif";
    ctx.fillText(b.phoneNumber, W / 2, cy + 460);
  }
}

/* ─── LUXURY ─── */
async function renderLuxury(
  ctx: CanvasRenderingContext2D,
  l: AdListingData,
  b: AdBrandConfig,
  img: HTMLImageElement | null
) {
  ctx.fillStyle = b.backgroundColor;
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.drawImage(img, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgba(b.backgroundColor, 0.25));
    g.addColorStop(0.5, rgba(b.backgroundColor, 0.65));
    g.addColorStop(1, b.backgroundColor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.strokeStyle = rgba(b.textColor, 0.18);
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = b.primaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.textAlign = "center";
  ctx.fillStyle = rgba(b.textColor, 0.45);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("EXCLUSIVE LISTING", W / 2, 115);
  ctx.fillStyle = b.primaryColor;
  ctx.fillRect(W / 2 - 55, 135, 110, 4);

  ctx.fillStyle = b.textColor;
  ctx.font = `bold italic ${fitText(ctx, l.title || "Palatial Estate", W - 150)}px serif`;
  fillWrapped(ctx, l.title || "Palatial Estate", W / 2, 210, W - 150, 72);

  const loc = l.subLocation ? `${l.subLocation}, ${l.subcity}` : l.subcity;
  ctx.font = "26px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.55);
  ctx.fillText(loc || "Bole, Addis Ababa", W / 2, 330);

  const sy = 410;
  ctx.strokeStyle = rgba(b.textColor, 0.08);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, sy);
  ctx.lineTo(W - 90, sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(90, sy + 115);
  ctx.lineTo(W - 90, sy + 115);
  ctx.stroke();

  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.35);
  ["BEDROOMS", "BATHROOMS", "AREA"].forEach((t, i) =>
    ctx.fillText(t, W / 2 + (i - 1) * 190, sy + 32)
  );
  ctx.font = "bold 44px serif";
  ctx.fillStyle = b.textColor;
  [l.bedrooms || "—", l.bathrooms || "—", l.area ? `${l.area}m²` : "—"].forEach(
    (v, i) => ctx.fillText(v, W / 2 + (i - 1) * 190, sy + 90)
  );

  ctx.font = "bold 60px sans-serif";
  ctx.fillStyle = b.primaryColor;
  ctx.fillText(l.price || "ETB —", W / 2, 630);

  ctx.fillStyle = b.primaryColor;
  rrect(ctx, W / 2 - 170, 690, 340, 65, 10);
  ctx.fill();
  ctx.fillStyle = b.backgroundColor;
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("PRIVATE VIEWING", W / 2, 732);

  if (b.phoneNumber) {
    ctx.fillStyle = rgba(b.textColor, 0.75);
    ctx.font = "26px monospace";
    ctx.fillText(b.phoneNumber, W / 2, 815);
  }
}

/* ─── COMMERCIAL ─── */
async function renderCommercial(
  ctx: CanvasRenderingContext2D,
  l: AdListingData,
  b: AdBrandConfig,
  img: HTMLImageElement | null
) {
  ctx.fillStyle = b.backgroundColor;
  ctx.fillRect(0, 0, W, H);
  const iw = W * 0.55;

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(iw + 70, 0);
    ctx.lineTo(iw - 70, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, iw + 70, H);
    ctx.restore();
  } else {
    ctx.fillStyle = b.secondaryColor;
    ctx.fillRect(0, 0, iw, H);
  }

  const px = iw - 35;
  ctx.fillStyle = b.backgroundColor;
  ctx.fillRect(px, 0, W - px, H);

  ctx.textAlign = "left";
  ctx.strokeStyle = b.primaryColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(px + 35, 55, 190, 38);
  ctx.fillStyle = b.primaryColor;
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("COMMERCIAL", px + 50, 82);

  ctx.fillStyle = b.textColor;
  ctx.font = `bold ${fitText(ctx, (l.title || "Corporate Complex").toUpperCase(), W - px - 70)}px sans-serif`;
  fillWrapped(
    ctx,
    (l.title || "Corporate Complex").toUpperCase(),
    px + 35,
    150,
    W - px - 70,
    58
  );

  ctx.fillStyle = b.primaryColor;
  ctx.fillRect(px + 35, 290, 90, 5);

  const loc = l.subLocation ? `${l.subLocation}, ${l.subcity}` : l.subcity;
  ctx.font = "24px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.45);
  ctx.fillText(`📍 ${loc || "Commercial District"}`, px + 35, 345);

  const stats = [
    { l: "TOTAL AREA", v: l.area ? `${l.area} SQM` : "—" },
    { l: "INVESTMENT", v: l.price || "CONTACT" },
    { l: "INQUIRIES", v: b.phoneNumber || "—" },
  ];
  stats.forEach((s, i) => {
    const y = 420 + i * 125;
    ctx.fillStyle = rgba(b.textColor, 0.05);
    ctx.fillRect(px + 35, y, W - px - 70, 95);
    ctx.fillStyle = b.primaryColor;
    ctx.fillRect(px + 35, y, 5, 95);
    ctx.fillStyle = rgba(b.textColor, 0.35);
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(s.l, px + 65, y + 32);
    ctx.fillStyle = b.textColor;
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(s.v, px + 65, y + 72);
  });
}

/* ─── INSTAGRAM ─── */
async function renderInstagram(
  ctx: CanvasRenderingContext2D,
  l: AdListingData,
  b: AdBrandConfig,
  img: HTMLImageElement | null
) {
  ctx.fillStyle = b.backgroundColor;
  ctx.fillRect(0, 0, W, H);
  if (img) ctx.drawImage(img, 0, 0, W, H);
  else {
    ctx.fillStyle = rgba(b.primaryColor, 0.15);
    ctx.fillRect(0, 0, W, H);
  }

  const g = ctx.createLinearGradient(0, H * 0.45, 0, H);
  g.addColorStop(0, "transparent");
  g.addColorStop(1, rgba(b.backgroundColor, 0.94));
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.45, W, H * 0.55);

  if (b.logoUrl) {
    try {
      const logo = await loadImg(b.logoUrl);
      const lh = 55;
      ctx.drawImage(logo, 35, 25, (logo.width / logo.height) * lh, lh);
    } catch {}
  }

  ctx.fillStyle = b.textColor;
  rrect(ctx, W - 250, 25, 215, 48, 24);
  ctx.fill();
  ctx.fillStyle = b.backgroundColor;
  ctx.textAlign = "center";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("JUST LISTED", W - 142, 57);

  const cy = H - 410;
  ctx.fillStyle = rgba(b.backgroundColor, 0.84);
  rrect(ctx, 35, cy, W - 70, 370, 45);
  ctx.fill();

  ctx.fillStyle = b.primaryColor;
  rrect(ctx, 35, cy, W - 70, 7, 3);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = b.textColor;
  ctx.font = `bold ${fitText(ctx, l.title || "Modern Smart Home", W - 360)}px sans-serif`;
  fillWrapped(ctx, l.title || "Modern Smart Home", 65, cy + 65, W - 360, 50);

  ctx.textAlign = "right";
  ctx.fillStyle = b.primaryColor;
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(l.price || "ETB —", W - 65, cy + 65);

  ctx.textAlign = "left";
  ctx.fillStyle = rgba(b.textColor, 0.45);
  ctx.font = "24px sans-serif";
  const loc = l.subLocation ? `${l.subLocation}, ${l.subcity}` : l.subcity;
  ctx.fillText(`📍 ${loc || "Addis Ababa"}`, 65, cy + 115);

  ctx.fillStyle = rgba(b.textColor, 0.08);
  ctx.fillRect(65, cy + 138, W - 130, 2);

  ctx.textAlign = "center";
  ctx.fillStyle = b.textColor;
  ctx.font = "bold 34px sans-serif";
  [l.bedrooms || "0", l.bathrooms || "0", l.area || "0"].forEach((v, i) =>
    ctx.fillText(v, 150 + i * 390, cy + 200)
  );
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = rgba(b.textColor, 0.28);
  ["BEDS", "BATHS", "m²"].forEach((t, i) =>
    ctx.fillText(t, 150 + i * 390, cy + 230)
  );

  ctx.fillStyle = b.textColor;
  rrect(ctx, W / 2 - 130, cy + 265, 260, 55, 28);
  ctx.fill();
  ctx.fillStyle = b.backgroundColor;
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`📞 ${b.phoneNumber || "CONTACT"}`, W / 2, cy + 300);
}

const renderers: Record<AdStyle, typeof renderClassic> = {
  classic: renderClassic,
  modern: renderModern,
  minimal: renderMinimal,
  luxury: renderLuxury,
  commercial: renderCommercial,
  instagram: renderInstagram,
};

/* ─── PUBLIC: Generate static ad image ─── */
export async function generateAdImage(
  listing: AdListingData,
  brand: AdBrandConfig,
  style: AdStyle = "modern"
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  let img: HTMLImageElement | null = null;
  if (listing.imageUrl) {
    try {
      img = await loadImg(listing.imageUrl);
    } catch {
      img = null;
    }
  }

  const fn = renderers[style] || renderModern;
  await fn(ctx, listing, brand, img);
  return canvas.toDataURL("image/png");
}

/* ─── PUBLIC: Generate rebranded image (covers competitor branding) ─── */
export async function generateRebrand(
  competitorImageUrl: string,
  brand: AdBrandConfig
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  let img: HTMLImageElement | null = null;
  try {
    img = await loadImg(competitorImageUrl);
  } catch {
    img = null;
  }

  await renderRebrand(
    ctx,
    {
      title: "Rebranded",
      price: "",
      subcity: "",
      subLocation: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      area: "",
      description: "",
    },
    brand,
    img
  );

  return canvas.toDataURL("image/png");
}

/* ─── PUBLIC: Generate video (WebM) with animated slides ─── */
export async function generateVideo(
  listing: AdListingData,
  brand: AdBrandConfig,
  style: AdStyle = "modern"
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  let img: HTMLImageElement | null = null;
  if (listing.imageUrl) {
    try {
      img = await loadImg(listing.imageUrl);
    } catch {
      img = null;
    }
  }

  const render = renderers[style] || renderModern;

  // Define slides with durations (frames at 30fps)
  const fps = 30;
  const slides = [
    { type: "intro" as const, frames: fps * 2 },
    { type: "main" as const, frames: fps * 5 },
    { type: "details" as const, frames: fps * 3 },
    { type: "cta" as const, frames: fps * 2 },
  ];
  const totalFrames = slides.reduce((s, sl) => s + sl.frames, 0);

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<string>(resolve => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(URL.createObjectURL(blob));
    };
    recorder.start();

    let frame = 0;
    function drawFrame() {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      // Determine which slide
      let acc = 0;
      let currentSlide = slides[0];
      let slideFrame = 0;
      for (const sl of slides) {
        if (frame < acc + sl.frames) {
          currentSlide = sl;
          slideFrame = frame - acc;
          break;
        }
        acc += sl.frames;
      }

      // Clear
      ctx.fillStyle = brand.backgroundColor;
      ctx.fillRect(0, 0, W, H);

      if (currentSlide.type === "intro") {
        // Animated brand intro
        const progress = slideFrame / currentSlide.frames;
        const scale = 0.5 + progress * 0.5;
        const alpha = progress;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = brand.primaryColor;
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "center";
        ctx.fillStyle = brand.textColor;
        ctx.font = `bold ${64 * scale}px sans-serif`;
        ctx.fillText(brand.companyName || "ESTATE IQ", W / 2, H / 2 - 30);

        if (brand.logoUrl) {
          loadImg(brand.logoUrl)
            .then(logo => {
              const lh = 120 * scale;
              ctx.drawImage(
                logo,
                W / 2 - ((logo.width / logo.height) * lh) / 2,
                H / 2 - lh - 20,
                (logo.width / logo.height) * lh,
                lh
              );
            })
            .catch(() => {});
        }

        if (brand.tagline) {
          ctx.font = `${28 * scale}px sans-serif`;
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillText(brand.tagline, W / 2, H / 2 + 40);
        }
        ctx.restore();
      } else if (currentSlide.type === "main") {
        render(ctx, listing, brand, img);
      } else if (currentSlide.type === "details") {
        // Details slide
        ctx.fillStyle = brand.backgroundColor;
        ctx.fillRect(0, 0, W, H);

        if (img) {
          ctx.globalAlpha = 0.15;
          ctx.drawImage(img, 0, 0, W, H);
          ctx.globalAlpha = 1;
        }

        ctx.textAlign = "center";
        ctx.fillStyle = brand.textColor;
        ctx.font = "bold 56px sans-serif";
        fillWrapped(
          ctx,
          listing.title || "Property Details",
          W / 2,
          120,
          W - 160,
          68
        );

        ctx.font = "36px sans-serif";
        ctx.fillStyle = rgba(brand.textColor, 0.7);
        const loc = listing.subLocation
          ? `${listing.subLocation}, ${listing.subcity}`
          : listing.subcity;
        ctx.fillText(`📍 ${loc || "Addis Ababa"}`, W / 2, 250);

        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = brand.primaryColor;
        ctx.fillText(listing.price || "Contact", W / 2, 350);

        // Specs
        const specs = [
          `${listing.bedrooms || "—"} Bedrooms`,
          `${listing.bathrooms || "—"} Bathrooms`,
          `${listing.area || "—"} m²`,
        ];
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = brand.textColor;
        specs.forEach((s, i) => ctx.fillText(s, W / 2, 460 + i * 60));

        if (listing.description) {
          ctx.font = "24px sans-serif";
          ctx.fillStyle = rgba(brand.textColor, 0.6);
          fillWrapped(
            ctx,
            listing.description.slice(0, 200),
            W / 2,
            680,
            W - 160,
            36
          );
        }
      } else if (currentSlide.type === "cta") {
        // CTA slide
        const progress = slideFrame / currentSlide.frames;
        ctx.fillStyle = brand.primaryColor;
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "center";
        ctx.fillStyle = brand.textColor;
        ctx.font = "bold 52px sans-serif";
        ctx.fillText("Contact Us Today", W / 2, H / 2 - 80);

        if (brand.phoneNumber) {
          ctx.font = "bold 44px monospace";
          ctx.fillText(brand.phoneNumber, W / 2, H / 2);
        }

        if (brand.whatsappNumber) {
          ctx.font = "30px sans-serif";
          ctx.globalAlpha = 0.8;
          ctx.fillText(`WhatsApp: ${brand.whatsappNumber}`, W / 2, H / 2 + 70);
          ctx.globalAlpha = 1;
        }

        if (brand.telegramChannel) {
          ctx.font = "30px sans-serif";
          ctx.globalAlpha = 0.8;
          ctx.fillText(
            `Telegram: ${brand.telegramChannel}`,
            W / 2,
            H / 2 + 120
          );
          ctx.globalAlpha = 1;
        }

        // Fade in
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = brand.backgroundColor;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      frame++;
      requestAnimationFrame(drawFrame);
    }

    drawFrame();
  });
}

/* ─── PUBLIC: Client-side caption generator (no API key needed) ─── */
export function generateCaption(listing: AdListingData, brand: AdBrandConfig) {
  const loc = listing.subLocation
    ? `${listing.subLocation}, ${listing.subcity}`
    : listing.subcity;
  const specs = [
    listing.bedrooms && `${listing.bedrooms} Bed`,
    listing.bathrooms && `${listing.bathrooms} Bath`,
    listing.area && `${listing.area}m²`,
  ]
    .filter(Boolean)
    .join(" | ");

  const amharic = `🏠 ለሽያጭ | FOR SALE
📍 ${loc || "Addis Ababa"}
💰 ${listing.price || "Contact"}
${specs ? `🛏️ ${specs}` : ""}
${listing.description ? `\n${listing.description}` : ""}
${listing.nearbyLandmarks ? `\n📌 Nearby: ${listing.nearbyLandmarks}` : ""}
${listing.utilities ? `\n⚡ Utilities: ${listing.utilities}` : ""}
${listing.finishingLevel ? `\n🔧 Finishing: ${listing.finishingLevel}` : ""}
${listing.negotiable ? "\n💬 Price is negotiable" : ""}
${brand.phoneNumber ? `\n📲 Call: ${brand.phoneNumber}` : ""}
${brand.whatsappNumber ? `💬 WhatsApp: ${brand.whatsappNumber}` : ""}
${brand.telegramChannel ? `✈️ Telegram: ${brand.telegramChannel}` : ""}`;

  const english = `🏠 FOR SALE
📍 ${loc || "Addis Ababa"}
💰 ${listing.price || "Contact"}
${specs ? `🛏️ ${specs}` : ""}
${listing.description ? `\n${listing.description}` : ""}
${listing.nearbyLandmarks ? `\n📌 Nearby: ${listing.nearbyLandmarks}` : ""}
${listing.utilities ? `\n⚡ Utilities: ${listing.utilities}` : ""}
${listing.finishingLevel ? `\n🔧 Finishing: ${listing.finishingLevel}` : ""}
${listing.negotiable ? "\n💬 Price is negotiable" : ""}
${brand.phoneNumber ? `\n📲 Call: ${brand.phoneNumber}` : ""}
${brand.whatsappNumber ? `💬 WhatsApp: ${brand.whatsappNumber}` : ""}
${brand.telegramChannel ? `✈️ Telegram: ${brand.telegramChannel}` : ""}`;

  const tiktok = `🏠 ${listing.title || "Property"} in ${loc || "Addis Ababa"}!
💰 ${listing.price || "DM for price"}
${specs || "DM for details"}
${listing.negotiable ? "💬 Negotiable!" : ""}
📲 ${brand.phoneNumber || "DM us!"}
${brand.whatsappNumber ? `💬 WA: ${brand.whatsappNumber}` : ""}`;

  const amHashtags = ["#ቤትለሽያጭ", "#አዲስአበባ", "#ኢትዮጵያ", "#የኢትዮጵያሪልኤስቴት"];
  const enHashtags = [
    "#EthiopianRealEstate",
    "#AddisAbaba",
    "#PropertyForSale",
    "#EstateIQ",
  ];
  if (listing.subcity) {
    amHashtags.push(`#${listing.subcity}`);
    enHashtags.push(`#${listing.subcity.replace(/\s/g, "")}`);
  }
  if (listing.propertyType) enHashtags.push(`#${listing.propertyType}ForSale`);

  return {
    amharic,
    english,
    tiktok,
    combined:
      brand.languagePreference === "amharic"
        ? amharic
        : brand.languagePreference === "english"
          ? english
          : `${amharic}\n\n---\n\n${english}`,
    amharicHashtags: amHashtags,
    hashtags: enHashtags,
  };
}
