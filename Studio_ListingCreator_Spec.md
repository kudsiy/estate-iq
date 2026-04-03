# Studio Listing Creator — Precise Build Spec
**For:** Antigravity
**Task:** Replace the Listing Creator mode canvas with a form-driven live preview system
**Scope:** `DesignStudio.tsx` — Listing Creator mode only. All other modes (Rebrander, Advert Creator, Video Tour, Video Ad) keep the existing canvas engine.

---

## The Core Concept

When an agent selects **Listing Creator** mode, they should see:
- **Left panel (40%)** — property details form
- **Right panel (60%)** — live HTML/CSS preview that updates as they type

The preview is NOT a canvas. It is a styled `<div>` that renders the template as HTML/CSS. No drag and drop. No layers. No constraints. The agent fills in the form and the preview updates instantly.

Export = use `html-to-image` library (already in node_modules) to screenshot the preview div to PNG.

---

## Data Structure

The form collects this data:

```typescript
interface ListingFormData {
  title: string;           // "Luxury Villa" or custom headline
  price: string;           // Always ETB format e.g. "ETB 4,500,000"
  location: string;        // Subcity + details e.g. "Bole, Addis Ababa"
  bedrooms: string;        // "3"
  bathrooms: string;       // "2"
  area: string;            // "250" (m²)
  phone: string;           // Agent phone from Brand Kit
  description: string;     // Optional property description
  image: string | null;    // Base64 or URL of uploaded property photo
  ctaText: string;         // "View Listing" or custom CTA
}
```

Brand data comes from the saved Brand Kit:
```typescript
interface BrandData {
  logo: string | null;     // Base64 or URL
  color: string;           // Primary brand color e.g. "#d4af37"
  backgroundColor: string; // Secondary brand color e.g. "#0a0a0f"
  textColor: string;       // Text color e.g. "#ffffff"
}
```

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Mode tabs: Listing Creator | Rebrander | Advert | Video Tour | Video Ad]  │
├──────────────────────────┬──────────────────────────────┤
│                          │                              │
│   FORM PANEL (left 40%)  │   LIVE PREVIEW (right 60%)  │
│                          │                              │
│   Template chips row     │   [Scaled HTML template]     │
│   Format chips row       │                              │
│   ─────────────────────  │                              │
│   📷 Photo upload        │                              │
│   Title input            │                              │
│   ETB Price input        │                              │
│   Subcity dropdown       │                              │
│   Property type          │                              │
│   Beds / Baths / Area    │                              │
│   Phone                  │                              │
│   Description            │                              │
│   CTA text               │                              │
│                          │                              │
│   [Download PNG]         │                              │
│   [Publish to Socials]   │                              │
│                          │                              │
└──────────────────────────┴──────────────────────────────┘
```

---

## Template Chips (horizontal scrollable row)

8 templates shown as pill chips with a colored dot indicating the template's dominant color:

| Chip Label | Template ID | Color Dot |
|---|---|---|
| Classic | classic | #0E3A47 |
| Modern | modern | #1a1a2e |
| Minimal | minimal | #f5f2ed |
| Gold Wave | gold-wave | #E5B85D |
| Luxury | luxury | #0a0a0f |
| Apartment | apartment | #0E3A47 |
| Commercial | commercial | #0E3A47 |
| Insta Modern | instagram-modern | #0E3A47 |

Active chip = filled background with brand accent color. Inactive = border only.

---

## Format Chips (horizontal row below templates)

4 format options:

| Label | Dimensions | Aspect Ratio |
|---|---|---|
| Post | 1080×1080 | 1:1 |
| Story | 1080×1920 | 9:16 |
| Flyer | 1080×1350 | 4:5 |
| Wide | 1920×1080 | 16:9 |

---

## Live Preview — Scaling

The preview div renders at full resolution (e.g. 1080×1080) then is scaled down to fit the preview panel using CSS transform:

```typescript
const maxPreviewWidth = previewPanelWidth * 0.9;
const maxPreviewHeight = window.innerHeight * 0.75;
const scale = Math.min(
  maxPreviewWidth / currentDimensions.width,
  maxPreviewHeight / currentDimensions.height
);

// Apply to the preview div:
style={{
  width: currentDimensions.width,
  height: currentDimensions.height,
  transform: `scale(${scale})`,
  transformOrigin: 'top left'
}}
```

The outer container must be sized to match the scaled dimensions:
```typescript
style={{
  width: currentDimensions.width * scale,
  height: currentDimensions.height * scale,
  overflow: 'hidden'
}}
```

---

## The 8 Templates — Exact Implementation

Each template is a React component that receives `data: ListingFormData` and `brand: BrandData` as props and renders styled JSX. All dimensions use the full resolution (e.g. 1080px) — the scale transform handles the preview sizing.

### Template 1: Classic

```tsx
// Full background image with gradient overlay
// Top: logo left, price right
// Bottom: large serif title, location, gold divider, specs grid (beds/baths/area/phone)
// Decorative white border inset

<div className="absolute inset-0" style={{ backgroundColor: brand.backgroundColor }}>
  {/* Background Image */}
  {data.image ? (
    <img src={data.image} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-black/40">
      <span className="text-white/30 text-2xl">Upload a photo</span>
    </div>
  )}
  {/* Bottom gradient */}
  <div className="absolute inset-0" style={{
    background: `linear-gradient(to top, ${brand.backgroundColor}E6 0%, ${brand.backgroundColor}40 50%, transparent 100%)`
  }} />
</div>

{/* Top bar */}
<div className="absolute top-0 left-0 w-full p-12 flex justify-between items-start z-10">
  {brand.logo ? <img src={brand.logo} className="h-28 object-contain" /> : <span className="text-white font-serif text-2xl">{brand.companyName}</span>}
  <div className="px-6 py-3 rounded-full font-bold text-xl" style={{ backgroundColor: brand.color, color: brand.backgroundColor }}>
    {data.price || 'ETB —'}
  </div>
</div>

{/* Bottom content */}
<div className="absolute bottom-0 left-0 w-full p-12 z-10 text-white">
  <h1 className="font-serif text-7xl font-medium leading-tight mb-4">{data.title || 'Property Title'}</h1>
  <div className="flex items-center gap-3 text-2xl text-white/80 mb-6">📍 {data.location || 'Location'}</div>
  <div className="w-32 h-1 mb-8" style={{ backgroundColor: brand.color }} />
  <div className="grid grid-cols-4 gap-8">
    <div><div className="text-sm uppercase tracking-wider mb-1" style={{ color: brand.color }}>Beds</div><div className="text-4xl font-serif">{data.bedrooms || '—'}</div></div>
    <div><div className="text-sm uppercase tracking-wider mb-1" style={{ color: brand.color }}>Baths</div><div className="text-4xl font-serif">{data.bathrooms || '—'}</div></div>
    <div><div className="text-sm uppercase tracking-wider mb-1" style={{ color: brand.color }}>Area</div><div className="text-4xl font-serif">{data.area || '—'} m²</div></div>
    <div><div className="text-sm uppercase tracking-wider mb-1" style={{ color: brand.color }}>Contact</div><div className="text-3xl font-serif font-bold">{data.phone || '—'}</div></div>
  </div>
  {data.description && <p className="text-2xl mt-8 text-white/90">{data.description}</p>}
</div>

{/* Decorative border */}
<div className="absolute inset-8 border border-white/20 pointer-events-none rounded-3xl" />
```

---

### Template 2: Modern

```
Layout: Image takes top 75%, details strip bottom 25%
- Image: full width, floating price tag bottom-left, logo top-right
- Bottom strip: brand background color, title left, specs right (beds/baths/area/phone)
- Gold accent line at top of bottom strip
```

### Template 3: Minimal

```
Layout: Brand color background, thick gold border frame, centered frosted glass card over full-bleed image
- Card contains: logo, title, gold divider, location, price, specs row, phone
- Center-aligned everything
- Backdrop blur on the card
```

### Template 4: Gold Wave

```
Layout: Image top 65%, details bottom 35% with SVG wave divider in brand color
- Wave SVG separates the sections (use a simple SVG path)
- Bottom: title, location, specs icons (beds/baths/area), CTA button, phone
- Agent photo circle overlaps the wave if available
- Price tag in top-right of image, rounded pill, rotated 2deg
```

### Template 5: Luxury

```
Layout: Full bleed image, double border frame (outer white/20, inner brand color 3px)
- Top: logo left, "Exclusive Listing" badge right (border, glass effect)
- Bottom center: large serif title, location, gold divider, specs row, large price, gold CTA button, phone pill
- Vignette overlay on image
- Everything centered
```

### Template 6: Apartment

```
Layout: Brand background, decorative blur circles in corners
- Image top 75%: rounded-[2.5rem] with "Just Listed" badge top-left
- Bottom 25%: logo + title + location left, specs (beds/baths/area) center, price + CTA + phone right
- Horizontal layout in bottom strip
```

### Template 7: Commercial

```
Layout: Split left/right
- Left 60%: full image with diagonal cut right edge (CSS clip-path or skewed div)
- Right 40%: dark background, "Commercial Opportunity" badge, bold title, gold divider, location, 3 stat boxes (area/price/phone), logo at bottom
- Bold and corporate feel
```

### Template 8: Instagram Modern

```
Layout: Full bleed image with gradient bottom overlay
- Top bar: logo left, "Just Listed" pill right (white bg, dark text)
- Bottom: frosted glass card (backdrop-blur, dark bg, white border)
  - Card top accent line in brand color
  - Title, location, price (large)
  - Divider
  - Specs row (beds/baths/area) left, phone CTA button right
- Agent photo in card top-right if available (rounded-2xl)
```

---

## Live Sync Logic

Every form field onChange must immediately update the preview. No Magic Fill button needed. Use React state:

```typescript
const [formData, setFormData] = useState<ListingFormData>({
  title: activeContext?.title || '',
  price: activeContext?.price ? `ETB ${Number(activeContext.price).toLocaleString()}` : '',
  location: activeContext?.subcity || '',
  bedrooms: activeContext?.bedrooms || '',
  bathrooms: activeContext?.bathrooms || '',
  area: activeContext?.area || '',
  phone: brandKit?.phone || '',
  description: activeContext?.description || '',
  image: activeContext?.image || null,
  ctaText: 'View Listing'
});

// Every input:
<input
  value={formData.price}
  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
/>
// Preview re-renders automatically since it reads from formData
```

---

## Photo Upload

```tsx
<label className="cursor-pointer block">
  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-brand-color transition-colors">
    {formData.image ? (
      <img src={formData.image} className="w-full h-32 object-cover rounded-lg" />
    ) : (
      <div className="text-white/40">
        <div className="text-3xl mb-2">📷</div>
        <div className="text-sm">Upload property photo</div>
        <div className="text-xs mt-1 text-white/20">Drag & drop or click</div>
      </div>
    )}
  </div>
</label>
```

---

## Export as PNG

```typescript
import { toPng } from 'html-to-image'; // install if not present: pnpm add html-to-image

const previewRef = useRef<HTMLDivElement>(null);

const handleDownload = async () => {
  if (!previewRef.current) return;
  const dataUrl = await toPng(previewRef.current, {
    width: currentDimensions.width,
    height: currentDimensions.height,
    pixelRatio: 2 // 2x for high resolution export
  });
  const link = document.createElement('a');
  link.download = `estate-iq-${selectedTemplate}-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
};
```

The `previewRef` is attached to the inner preview div at FULL resolution (not the scaled container).

---

## Data Persistence Rules

1. **Switching templates** — formData persists. New template renders with same data.
2. **Switching formats** — formData persists. Preview resizes, data stays.
3. **Journey B (from Supply Feed)** — formData pre-populated from listing context passed via URL params.
4. **Brand Kit** — brand data (logo, color, backgroundColor, textColor) auto-loaded from saved Brand Kit on mount.

---

## Subcity Dropdown Options

```typescript
const SUBCITIES = [
  'Bole', 'Kirkos', 'Yeka', 'Arada', 'Lideta', 'Gulele',
  'Kolfe Keranio', 'Nifas Silk-Lafto', 'Akaky Kaliti',
  'Lemi Kura', 'CMC', 'Kazanchis', 'Piassa', 'Sarbet',
  'Summit', 'Ayat', 'Gerji', 'Megenagna', 'Other'
];
```

---

## After Publish

When agent clicks "Publish to Socials":
1. Export PNG using html-to-image
2. Open existing publish panel (platform selection, AI captions, schedule)
3. On publish success → auto-create a record in My Properties with the formData and the exported image
4. Generate tracking link → attach to the property record

---

## What NOT to Change

- All other Studio modes (Image Rebrander, Advert Creator, Video Tour, Video Ad) keep the existing canvas engine
- The existing tRPC endpoints, gating logic, and tracking link system stay untouched
- The publish panel and social media posting logic stays untouched
- Only `DesignStudio.tsx` Listing Creator mode rendering changes
