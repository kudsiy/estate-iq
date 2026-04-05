import React from "react";

export interface ListingFormData {
  title: string;
  price: string;
  location: string;
  subLocation: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  description: string;
  ctaText: string;
  image: string | null;
}

export interface BrandData {
  logo: string | null;
  companyName: string;
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
  agentPortrait: string | null;
  tagline: string;
  targetAreas: string[];
  languagePreference: "amharic" | "english" | "both";
}

interface TemplateProps {
  data: ListingFormData;
  brand: BrandData;
}

const hasBrand = (brand: BrandData) =>
  brand.primaryColor &&
  brand.secondaryColor &&
  brand.backgroundColor &&
  brand.textColor;

const brandOrFallback = (
  brand: BrandData,
  role: "primary" | "secondary" | "bg" | "text"
) => {
  if (!hasBrand(brand)) {
    return role === "primary"
      ? "#1e3a5f"
      : role === "secondary"
        ? "#f5f0eb"
        : role === "bg"
          ? "#0f172a"
          : "#ffffff";
  }
  if (role === "primary") return brand.primaryColor;
  if (role === "secondary") return brand.secondaryColor;
  if (role === "bg") return brand.backgroundColor;
  return brand.textColor;
};

const fontHeading = (brand: BrandData) =>
  hasBrand(brand)
    ? brand.fontHeading || "Poppins, sans-serif"
    : "Poppins, sans-serif";
const fontBody = (brand: BrandData) =>
  hasBrand(brand)
    ? brand.fontBody || "Poppins, sans-serif"
    : "Poppins, sans-serif";
const phone = (brand: BrandData) => brand.phoneNumber || "";
const whatsapp = (brand: BrandData) => brand.whatsappNumber || "";

// ─── TEMPLATE 1: CLASSIC ──────────────────────────────────────────────────────
// Full-bleed image, bold serif headline bottom-left, horizontal spec strip
export const ClassicTemplate: React.FC<TemplateProps> = ({ data, brand }) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: fontBody(brand) }}
    >
      <div className="absolute inset-0">
        {data.image ? (
          <img src={data.image} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${primary}40` }}
          >
            <span className="text-white/30 text-2xl font-serif">
              Add Property Photo
            </span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${bg}E6 0%, ${bg}40 50%, transparent 100%)`,
          }}
        />
      </div>

      <div className="absolute top-0 left-0 w-full p-12 flex justify-between items-start z-10">
        {brand.logo ? (
          <img src={brand.logo} className="h-24 object-contain" />
        ) : (
          <span
            className="font-bold text-3xl tracking-tight"
            style={{ color: text, fontFamily: fontHeading(brand) }}
          >
            {brand.companyName}
          </span>
        )}
        <div
          className="px-8 py-3 rounded-full font-bold text-2xl shadow-xl"
          style={{ backgroundColor: primary, color: bg }}
        >
          {data.price || "ETB —"}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 w-full p-16 z-10"
        style={{ color: text }}
      >
        <h1
          className="text-8xl font-medium leading-[1.1] mb-6 drop-shadow-lg"
          style={{ fontFamily: fontHeading(brand) }}
        >
          {data.title || "Exclusive Property"}
        </h1>
        <div
          className="flex items-center gap-4 text-3xl mb-10"
          style={{ opacity: 0.9 }}
        >
          <span className="text-4xl">📍</span>
          {data.location || "Addis Ababa"}
          {data.subLocation && (
            <span className="text-xl opacity-60">— {data.subLocation}</span>
          )}
        </div>
        <div
          className="w-48 h-1.5 mb-12 shadow-sm"
          style={{ backgroundColor: primary }}
        />

        <div
          className="grid grid-cols-4 gap-12 p-8 rounded-3xl border border-white/10"
          style={{ backgroundColor: `${bg}30`, backdropFilter: "blur(12px)" }}
        >
          <div>
            <div
              className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60"
              style={{ color: primary }}
            >
              Beds
            </div>
            <div className="text-5xl font-serif">{data.bedrooms || "—"}</div>
          </div>
          <div>
            <div
              className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60"
              style={{ color: primary }}
            >
              Baths
            </div>
            <div className="text-5xl font-serif">{data.bathrooms || "—"}</div>
          </div>
          <div>
            <div
              className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60"
              style={{ color: primary }}
            >
              Area
            </div>
            <div className="text-5xl font-serif">
              {data.area || "—"} <span className="text-2xl opacity-60">m²</span>
            </div>
          </div>
          <div>
            <div
              className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60"
              style={{ color: primary }}
            >
              Call Agent
            </div>
            <div className="text-4xl font-serif font-bold whitespace-nowrap">
              {phone(brand) || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-10 border border-white/20 pointer-events-none rounded-[3rem]" />
    </div>
  );
};

// ─── TEMPLATE 2: MODERN ───────────────────────────────────────────────────────
// Split layout, image top 70%, clean info strip bottom with strong typography
export const ModernTemplate: React.FC<TemplateProps> = ({ data, brand }) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="h-[70%] relative overflow-hidden">
        {data.image ? (
          <img src={data.image} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-3xl font-bold italic"
            style={{ backgroundColor: secondary, color: `${primary}30` }}
          >
            PROPERTIES PHOTO
          </div>
        )}

        <div
          className="absolute bottom-10 left-10 p-6 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20"
          style={{ backgroundColor: `${text}E6` }}
        >
          <div
            className="text-sm font-bold uppercase tracking-widest mb-1"
            style={{ color: primary }}
          >
            Fixed Price
          </div>
          <div className="text-4xl font-black" style={{ color: text }}>
            {data.price || "ETB —"}
          </div>
        </div>

        <div
          className="absolute top-10 right-10 p-4 rounded-2xl shadow-lg border border-white/10"
          style={{ backgroundColor: `${text}E6`, backdropFilter: "blur(12px)" }}
        >
          {brand.logo ? (
            <img src={brand.logo} className="h-16 object-contain" />
          ) : (
            <span
              className="font-black text-xl tracking-tighter"
              style={{ color: primary }}
            >
              {brand.companyName}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex-1 flex flex-col justify-center px-12 relative"
        style={{ backgroundColor: bg }}
      >
        <div
          className="absolute top-0 left-0 w-full h-3 shadow-sm"
          style={{ backgroundColor: primary }}
        />
        <div className="flex justify-between items-end">
          <div className="max-w-[60%]">
            <h2
              className="text-5xl font-black leading-tight mb-2 uppercase italic tracking-tighter"
              style={{ color: text, fontFamily: fontHeading(brand) }}
            >
              {data.title || "Modern Residence"}
            </h2>
            <p className="text-2xl font-medium" style={{ color: `${text}60` }}>
              📍 {data.location || "Prime Location"}
              {data.subLocation && (
                <span className="text-lg"> — {data.subLocation}</span>
              )}
            </p>
          </div>
          <div className="flex gap-10">
            <div className="text-center">
              <p
                className="text-xs uppercase font-black tracking-widest mb-1"
                style={{ color: `${text}40` }}
              >
                Beds
              </p>
              <p className="text-4xl font-black" style={{ color: text }}>
                {data.bedrooms || "0"}
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-xs uppercase font-black tracking-widest mb-1"
                style={{ color: `${text}40` }}
              >
                Baths
              </p>
              <p className="text-4xl font-black" style={{ color: text }}>
                {data.bathrooms || "0"}
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-xs uppercase font-black tracking-widest mb-1"
                style={{ color: `${text}40` }}
              >
                Contact
              </p>
              <p className="text-3xl font-black" style={{ color: primary }}>
                {phone(brand) || "Call"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TEMPLATE 3: MINIMAL ──────────────────────────────────────────────────────
// Centered frosted card over image, everything center-aligned
export const MinimalTemplate: React.FC<TemplateProps> = ({ data, brand }) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div
      className="relative w-full h-full flex items-center justify-center p-16"
      style={{ backgroundColor: secondary, fontFamily: fontBody(brand) }}
    >
      <div className="absolute inset-0 z-0">
        {data.image && (
          <img
            src={data.image}
            className="w-full h-full object-cover opacity-15 grayscale"
          />
        )}
      </div>

      <div
        className="absolute inset-8 border-[20px] pointer-events-none"
        style={{ borderColor: primary }}
      />

      <div
        className="relative z-10 w-[75%] p-16 rounded-[4rem] border shadow-2xl text-center flex flex-col items-center"
        style={{
          backgroundColor: `${bg}CC`,
          backdropFilter: "blur(24px)",
          borderColor: `${text}10`,
        }}
      >
        {brand.logo ? (
          <img src={brand.logo} className="h-20 mb-10 object-contain" />
        ) : (
          <div
            className="text-2xl font-light tracking-[0.5em] mb-10 uppercase"
            style={{ color: `${text}40`, fontFamily: fontHeading(brand) }}
          >
            {brand.companyName}
          </div>
        )}

        <h1
          className="text-7xl font-light tracking-tight mb-4"
          style={{ color: text, fontFamily: fontHeading(brand) }}
        >
          {data.title || "Property Name"}
        </h1>
        <div
          className="w-16 h-0.5 mb-8"
          style={{ backgroundColor: `${text}10` }}
        />

        <p
          className="text-3xl font-medium mb-10 tracking-wide uppercase"
          style={{ color: `${text}60` }}
        >
          {data.location || "Addis Ababa"}
          {data.subLocation && (
            <span className="text-2xl"> — {data.subLocation}</span>
          )}
        </p>

        <div
          className="text-5xl font-light mb-12 tracking-tighter"
          style={{ color: primary }}
        >
          {data.price || "Price on Request"}
        </div>

        <div
          className="flex gap-12 text-sm uppercase tracking-[0.2em] font-bold mb-10"
          style={{ color: `${text}50` }}
        >
          <span>{data.bedrooms || "—"} Beds</span>
          <span>•</span>
          <span>{data.bathrooms || "—"} Baths</span>
          <span>•</span>
          <span>{data.area || "—"} m²</span>
        </div>

        <div
          className="px-12 py-5 rounded-full border text-2xl font-medium tracking-tight transition-colors"
          style={{ borderColor: `${text}15`, color: text }}
        >
          {phone(brand) || "Inquire Now"}
        </div>
      </div>
    </div>
  );
};

// ─── TEMPLATE 4: GOLD WAVE ────────────────────────────────────────────────────
// Diagonal wave separator between image and details section
export const GoldWaveTemplate: React.FC<TemplateProps> = ({ data, brand }) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ fontFamily: fontBody(brand) }}
    >
      <div className="h-[65%] relative">
        {data.image ? (
          <img src={data.image} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: secondary, color: `${primary}30` }}
          >
            Property Photo
          </div>
        )}

        <div
          className="absolute top-10 right-10 rotate-3 px-8 py-4 rounded-2xl shadow-2xl border border-white/20"
          style={{ backgroundColor: text, color: bg }}
        >
          <span className="font-black text-3xl">{data.price || "ETB —"}</span>
        </div>
      </div>

      <div
        className="absolute top-[65%] left-0 w-[110%] -mt-16 pointer-events-none"
        style={{ color: bg }}
      >
        <svg viewBox="0 0 1440 320" className="w-full h-40">
          <path
            fill="currentColor"
            fillOpacity="1"
            d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,181.3C960,213,1056,235,1152,213.3C1248,192,1344,128,1392,96L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      <div
        className="flex-1 p-12 pr-40 relative z-10"
        style={{ backgroundColor: bg }}
      >
        <div className="flex flex-col h-full justify-center">
          <h2
            className="text-6xl font-black leading-tight mb-4 tracking-tighter truncate"
            style={{ color: text, fontFamily: fontHeading(brand) }}
          >
            {data.title || "Luxury Listing"}
          </h2>
          <p
            className="text-2xl font-bold mb-10"
            style={{ color: `${text}50` }}
          >
            📍 {data.location || "Addis Ababa, ET"}
            {data.subLocation && (
              <span className="text-lg"> — {data.subLocation}</span>
            )}
          </p>

          <div className="flex gap-10 items-center">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${text}08` }}
              >
                🛏️
              </div>
              <span className="text-2xl font-bold" style={{ color: text }}>
                {data.bedrooms || "0"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${text}08` }}
              >
                🛁
              </div>
              <span className="text-2xl font-bold" style={{ color: text }}>
                {data.bathrooms || "0"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${text}08` }}
              >
                📐
              </div>
              <span className="text-2xl font-bold" style={{ color: text }}>
                {data.area || "0"} m²
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 right-0 w-32 h-64 flex flex-col items-center justify-end p-8 gap-4"
        style={{ backgroundColor: primary }}
      >
        <div
          className="text-xs font-black uppercase text-center rotate-180 [writing-mode:vertical-lr]"
          style={{ color: bg }}
        >
          Call Now for viewing
        </div>
        <div className="w-12 h-12 rounded-full border-2 bg-white/20 border-white/40 flex items-center justify-center text-xl">
          📞
        </div>
      </div>
    </div>
  );
};

// ─── TEMPLATE 5: LUXURY ───────────────────────────────────────────────────────
// Double border frame, "Exclusive Listing" badge, centered all-caps headline
export const LuxuryTemplate: React.FC<TemplateProps> = ({ data, brand }) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div
      className="relative w-full h-full flex items-center justify-center p-20"
      style={{ backgroundColor: bg, fontFamily: fontBody(brand) }}
    >
      <div className="absolute inset-0">
        {data.image && (
          <img src={data.image} className="w-full h-full object-cover" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${bg} 0%, ${bg}60 40%, transparent 100%)`,
          }}
        />
      </div>

      <div className="absolute inset-8 border border-white/20 pointer-events-none" />
      <div
        className="absolute inset-12 border-2 pointer-events-none"
        style={{ borderColor: primary }}
      />

      <div className="relative z-10 w-full flex flex-col items-center text-center px-12">
        <div className="mb-12 flex items-center gap-12 w-full justify-between">
          {brand.logo ? (
            <img src={brand.logo} className="h-16 object-contain" />
          ) : (
            <div
              className="text-xl font-bold tracking-[0.3em]"
              style={{ color: `${text}50`, fontFamily: fontHeading(brand) }}
            >
              {brand.companyName}
            </div>
          )}
          <div
            className="px-6 py-2 border border-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: text }}
          >
            Exclusive Listing
          </div>
        </div>

        <h1
          className="font-serif text-8xl font-bold mb-6 drop-shadow-2xl italic tracking-tighter leading-none"
          style={{ color: text, fontFamily: fontHeading(brand) }}
        >
          {data.title || "Palatial Estate"}
        </h1>
        <p
          className="text-3xl mb-10 tracking-[0.15em] font-light uppercase"
          style={{ color: `${text}60` }}
        >
          {data.location || "Bole residential district"}
          {data.subLocation && (
            <span className="text-2xl"> — {data.subLocation}</span>
          )}
        </p>

        <div
          className="w-32 h-1 mb-12 shadow-inner"
          style={{ backgroundColor: primary }}
        />

        <div
          className="flex gap-16 mb-16 border-y py-6"
          style={{ borderColor: `${text}10`, color: `${text}80` }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest opacity-40">
              Bedrooms
            </span>
            <span className="text-4xl font-serif" style={{ color: text }}>
              {data.bedrooms || "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest opacity-40">
              Bathrooms
            </span>
            <span className="text-4xl font-serif" style={{ color: text }}>
              {data.bathrooms || "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest opacity-40">
              Ground Area
            </span>
            <span className="text-4xl font-serif" style={{ color: text }}>
              {data.area || "—"} m²
            </span>
          </div>
        </div>

        <div
          className="text-7xl font-bold mb-16 leading-none tracking-tighter"
          style={{ color: primary }}
        >
          {data.price || "ETB —"}
        </div>

        <div className="flex items-center gap-6">
          <button
            className="px-16 py-5 rounded-md font-bold uppercase tracking-widest text-sm transition-transform active:scale-95"
            style={{ backgroundColor: primary, color: bg }}
          >
            {data.ctaText || "Private Viewing"}
          </button>
          <div className="px-8 py-4 border border-white/20 backdrop-blur-md rounded-md">
            <span
              className="font-mono text-2xl tracking-tighter"
              style={{ color: text }}
            >
              {phone(brand) || "Phone"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TEMPLATE 6: APARTMENT ────────────────────────────────────────────────────
// Rounded image with "Just Listed" badge, compact bottom strip
export const ApartmentTemplate: React.FC<TemplateProps> = ({ data, brand }) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div
      className="relative w-full h-full flex flex-col p-12 overflow-hidden"
      style={{ backgroundColor: bg, fontFamily: fontBody(brand) }}
    >
      <div
        className="absolute top-0 right-0 w-96 h-96 blur-[150px] -mr-48 -mt-48 rounded-full"
        style={{ backgroundColor: `${primary}20` }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 blur-[150px] -ml-48 -mb-48 rounded-full"
        style={{ backgroundColor: `${primary}10` }}
      />

      <div className="h-[72%] relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/5">
        {data.image ? (
          <img src={data.image} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: secondary }}
          />
        )}
        <div
          className="absolute top-10 left-10 px-8 py-3 font-black text-xl rounded-2xl shadow-xl drop-shadow-lg"
          style={{ backgroundColor: primary, color: text }}
        >
          JUST LISTED
        </div>
      </div>

      <div className="flex-1 flex items-center gap-10 mt-10">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-3">
            {brand.logo && (
              <img src={brand.logo} className="h-10 object-contain" />
            )}
            <h2
              className="text-4xl font-black uppercase italic tracking-tighter"
              style={{ color: text, fontFamily: fontHeading(brand) }}
            >
              {data.title || "Premium Suite"}
            </h2>
          </div>
          <p
            className="text-xl font-bold tracking-tight"
            style={{ color: `${text}50` }}
          >
            📍 {data.location || "Addis Ababa City Center"}
            {data.subLocation && (
              <span className="text-lg"> — {data.subLocation}</span>
            )}
          </p>
        </div>

        <div
          className="flex gap-8 p-8 rounded-[2.5rem] border shrink-0"
          style={{ backgroundColor: `${text}08`, borderColor: `${text}10` }}
        >
          <div className="text-center">
            <div
              className="text-[10px] uppercase font-black mb-1"
              style={{ color: `${primary}60` }}
            >
              Beds
            </div>
            <div className="text-3xl font-black" style={{ color: text }}>
              {data.bedrooms || "0"}
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-[10px] uppercase font-black mb-1"
              style={{ color: `${primary}60` }}
            >
              Baths
            </div>
            <div className="text-3xl font-black" style={{ color: text }}>
              {data.bathrooms || "0"}
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-[10px] uppercase font-black mb-1"
              style={{ color: `${primary}60` }}
            >
              Area
            </div>
            <div className="text-3xl font-black" style={{ color: text }}>
              {data.area || "0"}m²
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div
            className="text-5xl font-black italic tracking-tighter"
            style={{ color: primary }}
          >
            {data.price || "ETB —"}
          </div>
          <div
            className="px-8 py-3 font-black text-lg rounded-2xl shadow-lg border border-black/5 whitespace-nowrap"
            style={{ backgroundColor: text, color: bg }}
          >
            📞 {phone(brand) || "Contact"}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TEMPLATE 7: COMMERCIAL ───────────────────────────────────────────────────
// Left/right split layout — image left 60%, dark info panel right 40%
export const CommercialTemplate: React.FC<TemplateProps> = ({
  data,
  brand,
}) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div
      className="relative w-full h-full flex overflow-hidden"
      style={{ backgroundColor: bg, fontFamily: fontBody(brand) }}
    >
      <div className="relative w-[60%] h-full overflow-hidden shrink-0">
        <div
          className="w-full h-full relative"
          style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }}
        >
          {data.image ? (
            <img
              src={data.image}
              className="w-full h-full object-cover scale-110"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ backgroundColor: secondary }}
            />
          )}
          <div className="absolute inset-0 bg-black/10" />
        </div>
      </div>

      <div
        className="flex-1 flex flex-col p-20 justify-center relative z-10"
        style={{ color: text }}
      >
        <div className="w-full max-w-[500px]">
          <div
            className="inline-block px-6 py-2 border-2 mb-10 text-sm font-black uppercase tracking-[0.3em]"
            style={{ borderColor: primary, color: primary }}
          >
            Commercial Op
          </div>

          <h1
            className="text-7xl font-black mb-6 leading-[0.95] tracking-tighter uppercase italic"
            style={{ fontFamily: fontHeading(brand) }}
          >
            {data.title || "Corporate Complex"}
          </h1>
          <div
            className="w-32 h-2 mb-10"
            style={{ backgroundColor: primary }}
          />

          <p
            className="text-2xl mb-16 font-bold tracking-tight"
            style={{ color: `${text}50` }}
          >
            📍 {data.location || "Commercial District, Addis"}
            {data.subLocation && (
              <span className="text-lg"> — {data.subLocation}</span>
            )}
          </p>

          <div className="grid grid-cols-1 gap-6 mb-20">
            <div
              className="flex border-l-4 p-4 items-center justify-between"
              style={{ borderColor: primary, backgroundColor: `${text}08` }}
            >
              <span className="text-xs uppercase font-black opacity-40">
                Total Area
              </span>
              <span className="text-3xl font-black">
                {data.area || "—"} Square Meters
              </span>
            </div>
            <div
              className="flex border-l-4 p-4 items-center justify-between"
              style={{ borderColor: primary, backgroundColor: `${text}08` }}
            >
              <span className="text-xs uppercase font-black opacity-40">
                Investment
              </span>
              <span className="text-3xl font-black" style={{ color: primary }}>
                {data.price || "Contact for Price"}
              </span>
            </div>
            <div
              className="flex border-l-4 p-4 items-center justify-between"
              style={{ borderColor: primary, backgroundColor: `${text}08` }}
            >
              <span className="text-xs uppercase font-black opacity-40">
                Inquiries
              </span>
              <span className="text-3xl font-black">
                {phone(brand) || "Direct Line"}
              </span>
            </div>
          </div>

          {brand.logo && (
            <img
              src={brand.logo}
              className="h-20 object-contain self-start opacity-70"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── TEMPLATE 8: INSTA MODERN ───────────────────────────────────────────────
// Full-bleed image, glassmorphic bottom card with backdrop blur
export const InstaModernTemplate: React.FC<TemplateProps> = ({
  data,
  brand,
}) => {
  const bg = brandOrFallback(brand, "bg");
  const primary = brandOrFallback(brand, "primary");
  const secondary = brandOrFallback(brand, "secondary");
  const text = brandOrFallback(brand, "text");

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: bg, fontFamily: fontBody(brand) }}
    >
      {data.image ? (
        <img src={data.image} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full" style={{ backgroundColor: `${bg}E0` }} />
      )}

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${bg} 0%, ${bg}40 30%, transparent 100%)`,
        }}
      />

      <div className="absolute top-0 left-0 w-full p-10 flex justify-between items-center z-20">
        <div
          className="p-4 rounded-3xl border border-white/20"
          style={{ backgroundColor: `${text}15`, backdropFilter: "blur(16px)" }}
        >
          {brand.logo ? (
            <img src={brand.logo} className="h-10 object-contain" />
          ) : (
            <span
              className="font-black italic"
              style={{ color: text, fontFamily: fontHeading(brand) }}
            >
              {brand.companyName}
            </span>
          )}
        </div>
        <div
          className="font-black px-8 py-3 rounded-2xl shadow-2xl tracking-tighter"
          style={{ backgroundColor: text, color: bg }}
        >
          JUST LISTED
        </div>
      </div>

      <div className="absolute bottom-10 left-10 right-10 z-20">
        <div
          className="p-10 rounded-[3.5rem] border border-white/10 overflow-hidden relative shadow-2xl"
          style={{ backgroundColor: `${bg}90`, backdropFilter: "blur(32px)" }}
        >
          <div
            className="absolute top-0 left-0 w-full h-2 shadow-2xl"
            style={{ backgroundColor: primary }}
          />

          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-10">
              <h2
                className="text-5xl font-black uppercase italic tracking-tighter mb-2 leading-none"
                style={{ color: text, fontFamily: fontHeading(brand) }}
              >
                {data.title || "Modern Smart Home"}
              </h2>
              <p className="text-xl font-bold" style={{ color: `${text}50` }}>
                📍 {data.location || "Addis Ababa"}
                {data.subLocation && (
                  <span className="text-lg"> — {data.subLocation}</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div
                className="text-[10px] uppercase font-black tracking-widest mb-1"
                style={{ color: `${text}30` }}
              >
                Asking Price
              </div>
              <div className="text-4xl font-black" style={{ color: primary }}>
                {data.price || "ETB —"}
              </div>
            </div>
          </div>

          <div
            className="w-full h-[1px] mb-8"
            style={{ backgroundColor: `${text}10` }}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-10">
              <div className="text-center">
                <div
                  className="text-4xl font-black leading-none"
                  style={{ color: text }}
                >
                  {data.bedrooms || "0"}
                </div>
                <div
                  className="text-[10px] uppercase font-bold mt-1"
                  style={{ color: `${text}30` }}
                >
                  Beds
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-4xl font-black leading-none"
                  style={{ color: text }}
                >
                  {data.bathrooms || "0"}
                </div>
                <div
                  className="text-[10px] uppercase font-bold mt-1"
                  style={{ color: `${text}30` }}
                >
                  Baths
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-4xl font-black leading-none"
                  style={{ color: text }}
                >
                  {data.area || "0"}
                </div>
                <div
                  className="text-[10px] uppercase font-bold mt-1"
                  style={{ color: `${text}30` }}
                >
                  m²
                </div>
              </div>
            </div>

            <div
              className="px-10 py-5 font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 group overflow-hidden relative"
              style={{ backgroundColor: text, color: bg }}
            >
              <div
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                style={{ backgroundColor: primary }}
              />
              <span className="relative z-10">
                {phone(brand) || "CONTACT AGENT"}
              </span>
              <span className="relative z-10">📞</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LISTING_TEMPLATES = [
  { id: "classic", name: "Classic", component: ClassicTemplate },
  { id: "modern", name: "Modern", component: ModernTemplate },
  { id: "minimal", name: "Minimal", component: MinimalTemplate },
  { id: "gold-wave", name: "Gold Wave", component: GoldWaveTemplate },
  { id: "luxury", name: "Luxury", component: LuxuryTemplate },
  { id: "apartment", name: "Apartment", component: ApartmentTemplate },
  { id: "commercial", name: "Commercial", component: CommercialTemplate },
  {
    id: "instagram-modern",
    name: "Insta Modern",
    component: InstaModernTemplate,
  },
];
