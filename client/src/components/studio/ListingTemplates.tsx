import React from "react";

export interface ListingFormData {
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  phone: string;
  description: string;
  image: string | null;
  ctaText: string;
}

export interface BrandData {
  logo: string | null;
  companyName: string;
  color: string;
  backgroundColor: string;
  textColor: string;
}

interface TemplateProps {
  data: ListingFormData;
  brand: BrandData;
}

// ─── TEMPLATE 1: CLASSIC ──────────────────────────────────────────────────────
export const ClassicTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: brand.backgroundColor, color: '#fff' }}>
    <div className="absolute inset-0">
      {data.image ? (
        <img src={data.image} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/40">
           <span className="text-white/30 text-2xl font-serif">Add Property Photo</span>
        </div>
      )}
      <div className="absolute inset-0" style={{ 
        background: `linear-gradient(to top, ${brand.backgroundColor}E6 0%, ${brand.backgroundColor}40 50%, transparent 100%)` 
      }} />
    </div>

    {/* Top bar */}
    <div className="absolute top-0 left-0 w-full p-12 flex justify-between items-start z-10">
      {brand.logo ? (
        <img src={brand.logo} className="h-24 object-contain" />
      ) : (
        <span className="text-white font-serif text-3xl font-bold tracking-tight">{brand.companyName}</span>
      )}
      <div className="px-8 py-3 rounded-full font-bold text-2xl shadow-xl" style={{ backgroundColor: brand.color, color: brand.backgroundColor }}>
        {data.price || 'ETB —'}
      </div>
    </div>

    {/* Bottom content */}
    <div className="absolute bottom-0 left-0 w-full p-16 z-10 text-white">
      <h1 className="font-serif text-8xl font-medium leading-[1.1] mb-6 drop-shadow-lg">{data.title || 'Exclusive Property'}</h1>
      <div className="flex items-center gap-4 text-3xl text-white/90 mb-10">
        <span className="text-4xl opacity-80">📍</span> {data.location || 'Addis Ababa'}
      </div>
      <div className="w-48 h-1.5 mb-12 shadow-sm" style={{ backgroundColor: brand.color }} />
      
      <div className="grid grid-cols-4 gap-12 bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/10">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60" style={{ color: brand.color }}>Beds</div>
          <div className="text-5xl font-serif">{data.bedrooms || '—'}</div>
        </div>
        <div>
          <div className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60" style={{ color: brand.color }}>Baths</div>
          <div className="text-5xl font-serif">{data.bathrooms || '—'}</div>
        </div>
        <div>
          <div className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60" style={{ color: brand.color }}>Area</div>
          <div className="text-5xl font-serif">{data.area || '—'} <span className="text-2xl opacity-60">m²</span></div>
        </div>
        <div>
          <div className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-60" style={{ color: brand.color }}>Call Agent</div>
          <div className="text-4xl font-serif font-bold whitespace-nowrap">{data.phone || '—'}</div>
        </div>
      </div>
    </div>

    {/* Decorative inset border */}
    <div className="absolute inset-10 border border-white/20 pointer-events-none rounded-[3rem]" />
  </div>
);

// ─── TEMPLATE 2: MODERN ───────────────────────────────────────────────────────
export const ModernTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full flex flex-col bg-white">
    <div className="h-[75%] relative overflow-hidden">
      {data.image ? (
        <img src={data.image} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/30 text-3xl font-bold italic">PROPERTIES PHOTO</div>
      )}
      
      {/* Floating Price */}
      <div className="absolute bottom-10 left-10 p-6 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 bg-white/90">
         <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Fixed Price</div>
         <div className="text-4xl font-black text-[#1a1a2e]">{data.price || 'ETB —'}</div>
      </div>

      {/* Corporate Logo */}
      <div className="absolute top-10 right-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/10">
        {brand.logo ? (
          <img src={brand.logo} className="h-16 object-contain" />
        ) : (
          <span className="font-black text-xl tracking-tighter" style={{ color: brand.color }}>{brand.companyName}</span>
        )}
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-center px-12 relative" style={{ backgroundColor: brand.backgroundColor }}>
      <div className="absolute top-0 left-0 w-full h-3 shadow-sm" style={{ backgroundColor: brand.color }} />
      <div className="flex justify-between items-end">
        <div className="max-w-[60%]">
          <h2 className="text-5xl font-black text-white leading-tight mb-2 uppercase italic tracking-tighter">{data.title || 'Modern Residence'}</h2>
          <p className="text-2xl text-white/60 font-medium">📍 {data.location || 'Prime Location'}</p>
        </div>
        <div className="flex gap-10">
           <div className="text-center">
              <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Beds</p>
              <p className="text-4xl font-black text-white">{data.bedrooms || '0'}</p>
           </div>
           <div className="text-center">
              <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Baths</p>
              <p className="text-4xl font-black text-white">{data.bathrooms || '0'}</p>
           </div>
           <div className="text-center">
              <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Contact</p>
              <p className="text-3xl font-black" style={{ color: brand.color }}>{data.phone || 'Call'}</p>
           </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── TEMPLATE 3: MINIMAL ──────────────────────────────────────────────────────
export const MinimalTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full flex items-center justify-center p-16" style={{ backgroundColor: '#f9f9f9' }}>
    {/* Full bleed background image area */}
    <div className="absolute inset-0 z-0">
      {data.image && <img src={data.image} className="w-full h-full object-cover opacity-15 grayscale" />}
    </div>

    {/* The Frame */}
    <div className="absolute inset-8 border-[20px] pointer-events-none" style={{ borderColor: brand.color }} />

    {/* The Card */}
    <div className="relative z-10 w-[75%] bg-white/80 backdrop-blur-2xl p-16 rounded-[4rem] border shadow-2xl border-white/50 text-center flex flex-col items-center">
      {brand.logo ? <img src={brand.logo} className="h-20 mb-10 object-contain" /> : <div className="text-2xl font-light tracking-[0.5em] mb-10 opacity-40 uppercase">{brand.companyName}</div>}
      
      <h1 className="text-7xl font-light tracking-tight mb-4 text-[#111]">{data.title || 'Property Name'}</h1>
      <div className="w-16 h-0.5 bg-black/10 mb-8" />
      
      <p className="text-3xl font-medium text-muted-foreground mb-10 tracking-wide uppercase">{data.location || 'Addis Ababa'}</p>
      
      <div className="text-5xl font-light mb-12 tracking-tighter" style={{ color: brand.color }}>{data.price || 'Price on Request'}</div>
      
      <div className="flex gap-12 text-sm uppercase tracking-[0.2em] font-bold text-muted-foreground mb-10">
        <span>{data.bedrooms || '—'} Beds</span>
        <span>•</span>
        <span>{data.bathrooms || '—'} Baths</span>
        <span>•</span>
        <span>{data.area || '—'} m²</span>
      </div>

      <div className="px-12 py-5 rounded-full border border-black/10 text-2xl font-medium tracking-tight text-foreground hover:bg-black/5 transition-colors">
        {data.phone || 'Inquire Now'}
      </div>
    </div>
  </div>
);

// ─── TEMPLATE 4: GOLD WAVE ────────────────────────────────────────────────────
export const GoldWaveTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full flex flex-col bg-white overflow-hidden">
    <div className="h-[65%] relative">
      {data.image ? (
        <img src={data.image} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">Property Photo</div>
      )}
      
      {/* Price Badge */}
      <div className="absolute top-10 right-10 rotate-3 bg-white text-[#111] font-black text-3xl px-8 py-4 rounded-2xl shadow-2xl border border-white/20">
        {data.price || 'ETB —'}
      </div>
    </div>

    {/* Wave Divider */}
    <div className="absolute top-[65%] left-0 w-[110%] -mt-16 pointer-events-none" style={{ color: brand.backgroundColor }}>
      <svg viewBox="0 0 1440 320" className="w-full h-40">
        <path fill="currentColor" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,181.3C960,213,1056,235,1152,213.3C1248,192,1344,128,1392,96L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>

    <div className="flex-1 p-12 pr-40 relative z-10" style={{ backgroundColor: brand.backgroundColor }}>
      <div className="flex flex-col h-full justify-center">
        <h2 className="text-6xl font-black text-white leading-tight mb-4 tracking-tighter truncate">{data.title || 'Luxury Listing'}</h2>
        <p className="text-2xl text-white/50 font-bold mb-10">📍 {data.location || 'Addis Ababa, ET'}</p>
        
        <div className="flex gap-10 items-center">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">🛏️</div>
             <span className="text-2xl text-white font-bold">{data.bedrooms || '0'}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">🛁</div>
             <span className="text-2xl text-white font-bold">{data.bathrooms || '0'}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">📐</div>
             <span className="text-2xl text-white font-bold">{data.area || '0'} m²</span>
          </div>
        </div>
      </div>
    </div>

    {/* Agent Side Tag */}
    <div className="absolute bottom-0 right-0 w-32 h-64 flex flex-col items-center justify-end p-8 gap-4" style={{ backgroundColor: brand.color }}>
       <div className="text-xs font-black uppercase text-center rotate-180 [writing-mode:vertical-lr]" style={{ color: brand.backgroundColor }}>Call Now for viewing</div>
       <div className="w-12 h-12 rounded-full border-2 bg-white/20 border-white/40 flex items-center justify-center text-xl">📞</div>
    </div>
  </div>
);

// ─── TEMPLATE 5: LUXURY ───────────────────────────────────────────────────────
export const LuxuryTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full flex items-center justify-center p-20" style={{ backgroundColor: '#0a0a0f' }}>
    <div className="absolute inset-0">
      {data.image && <img src={data.image} className="w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
    </div>

    {/* Double Frame */}
    <div className="absolute inset-8 border border-white/20 pointer-events-none" />
    <div className="absolute inset-12 border-2 pointer-events-none" style={{ borderColor: brand.color }} />

    <div className="relative z-10 w-full flex flex-col items-center text-center px-12">
      <div className="mb-12 flex items-center gap-12 w-full justify-between">
         {brand.logo ? <img src={brand.logo} className="h-16 object-contain" /> : <div className="text-xl font-bold tracking-[0.3em] text-white/50">{brand.companyName}</div>}
         <div className="px-6 py-2 border border-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-[0.2em] text-white">Exclusive Listing</div>
      </div>

      <h1 className="font-serif text-8xl font-bold text-white mb-6 drop-shadow-2xl italic tracking-tighter leading-none">{data.title || 'Palatial Estate'}</h1>
      <p className="text-3xl text-white/60 mb-10 tracking-[0.15em] font-light uppercase">{data.location || 'Bole residential district'}</p>
      
      <div className="w-32 h-1 mb-12 shadow-inner" style={{ backgroundColor: brand.color }} />
      
      <div className="flex gap-16 text-white/80 mb-16 border-y border-white/10 py-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest opacity-40">Bedrooms</span>
          <span className="text-4xl font-serif text-white">{data.bedrooms || '—'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest opacity-40">Bathrooms</span>
          <span className="text-4xl font-serif text-white">{data.bathrooms || '—'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest opacity-40">Ground Area</span>
          <span className="text-4xl font-serif text-white">{data.area || '—'} m²</span>
        </div>
      </div>

      <div className="text-7xl font-bold mb-16 leading-none tracking-tighter" style={{ color: brand.color }}>{data.price || 'ETB —'}</div>

      <div className="flex items-center gap-6">
        <button className="px-16 py-5 rounded-md font-bold uppercase tracking-widest text-sm text-[#0a0a0f] transition-transform active:scale-95" style={{ backgroundColor: brand.color }}>
          {data.ctaText || 'Private Viewing'}
        </button>
        <div className="px-8 py-4 border border-white/20 backdrop-blur-md rounded-md">
           <span className="text-white font-mono text-2xl tracking-tighter">{data.phone || 'Phone'}</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── TEMPLATE 6: APARTMENT ────────────────────────────────────────────────────
export const ApartmentTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full flex flex-col p-12 overflow-hidden" style={{ backgroundColor: brand.backgroundColor }}>
    {/* Decorative blurs */}
    <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[150px] -mr-48 -mt-48 rounded-full" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 blur-[150px] -ml-48 -mb-48 rounded-full" />

    <div className="h-[72%] relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/5">
      {data.image ? (
        <img src={data.image} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-200" />
      )}
      <div className="absolute top-10 left-10 px-8 py-3 bg-accent text-white font-black text-xl rounded-2xl shadow-xl drop-shadow-lg">JUST LISTED</div>
    </div>

    <div className="flex-1 flex items-center gap-10 mt-10">
       <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-3">
             {brand.logo && <img src={brand.logo} className="h-10 object-contain" />}
             <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{data.title || 'Premium Suite'}</h2>
          </div>
          <p className="text-xl text-white/50 font-bold tracking-tight">📍 {data.location || 'Addis Ababa City Center'}</p>
       </div>

       <div className="flex gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shrink-0">
          <div className="text-center">
             <div className="text-[10px] uppercase font-black text-accent/60 mb-1">Beds</div>
             <div className="text-3xl font-black text-white">{data.bedrooms || '0'}</div>
          </div>
          <div className="text-center">
             <div className="text-[10px] uppercase font-black text-accent/60 mb-1">Baths</div>
             <div className="text-3xl font-black text-white">{data.bathrooms || '0'}</div>
          </div>
          <div className="text-center">
             <div className="text-[10px] uppercase font-black text-accent/60 mb-1">Area</div>
             <div className="text-3xl font-black text-white">{data.area || '0'}m²</div>
          </div>
       </div>

       <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="text-5xl font-black italic tracking-tighter" style={{ color: brand.color }}>{data.price || 'ETB —'}</div>
          <div className="px-8 py-3 bg-white text-black font-black text-lg rounded-2xl shadow-lg border border-black/5 whitespace-nowrap">📞 {data.phone || 'Contact'}</div>
       </div>
    </div>
  </div>
);

// ─── TEMPLATE 7: COMMERCIAL ───────────────────────────────────────────────────
export const CommercialTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full flex bg-[#111]" style={{ backgroundColor: brand.backgroundColor }}>
    <div className="relative w-[60%] h-full overflow-hidden shrink-0">
       <div className="w-full h-full relative" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}>
          {data.image ? (
            <img src={data.image} className="w-full h-full object-cover scale-110" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-black/10" />
       </div>
    </div>

    <div className="flex-1 flex flex-col p-20 justify-center text-white relative z-10">
      <div className="w-full max-w-[500px]">
         <div className="inline-block px-6 py-2 border-2 mb-10 text-sm font-black uppercase tracking-[0.3em]" style={{ borderColor: brand.color, color: brand.color }}>Commercial Op</div>
         
         <h1 className="text-7xl font-black mb-6 leading-[0.95] tracking-tighter uppercase italic">{data.title || 'Corporate Complex'}</h1>
         <div className="w-32 h-2 mb-10" style={{ backgroundColor: brand.color }} />
         
         <p className="text-2xl text-white/50 mb-16 font-bold tracking-tight">📍 {data.location || 'Commercial District, Addis'}</p>
         
         <div className="grid grid-cols-1 gap-6 mb-20">
            <div className="flex border-l-4 p-4 items-center justify-between bg-white/5" style={{ borderColor: brand.color }}>
               <span className="text-xs uppercase font-black opacity-40">Total Area</span>
               <span className="text-3xl font-black">{data.area || '—'} Square Meters</span>
            </div>
            <div className="flex border-l-4 p-4 items-center justify-between bg-white/5" style={{ borderColor: brand.color }}>
               <span className="text-xs uppercase font-black opacity-40">Investment</span>
               <span className="text-3xl font-black text-accent" style={{ color: brand.color }}>{data.price || 'Contact for Price'}</span>
            </div>
            <div className="flex border-l-4 p-4 items-center justify-between bg-white/5" style={{ borderColor: brand.color }}>
               <span className="text-xs uppercase font-black opacity-40">Inquiries</span>
               <span className="text-3xl font-black">{data.phone || 'Direct Line'}</span>
            </div>
         </div>

         {brand.logo && <img src={brand.logo} className="h-20 object-contain self-start opacity-70" />}
      </div>
    </div>
  </div>
);

// ─── TEMPLATE 8: INSTA MODERN ───────────────────────────────────────────────
export const InstaModernTemplate: React.FC<TemplateProps> = ({ data, brand }) => (
  <div className="relative w-full h-full bg-black overflow-hidden">
    {data.image ? (
       <img src={data.image} className="w-full h-full object-cover" />
    ) : (
       <div className="w-full h-full bg-zinc-900" />
    )}
    
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

    {/* Top Bar */}
    <div className="absolute top-0 left-0 w-full p-10 flex justify-between items-center z-20">
       <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20">
          {brand.logo ? <img src={brand.logo} className="h-10 object-contain" /> : <span className="text-white font-black italic">{brand.companyName}</span>}
       </div>
       <div className="bg-white text-black font-black px-8 py-3 rounded-2xl shadow-2xl tracking-tighter">JUST LISTED</div>
    </div>

    {/* Bottom Glass Card */}
    <div className="absolute bottom-10 left-10 right-10 z-20">
       <div className="bg-zinc-900/60 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/10 overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 shadow-2xl" style={{ backgroundColor: brand.color }} />
          
          <div className="flex justify-between items-start mb-6">
             <div className="flex-1 pr-10">
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2 leading-none">{data.title || 'Modern Smart Home'}</h2>
                <p className="text-xl text-white/50 font-bold">📍 {data.location || 'Addis Ababa'}</p>
             </div>
             <div className="text-right">
                <div className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1">Asking Price</div>
                <div className="text-4xl font-black" style={{ color: brand.color }}>{data.price || 'ETB —'}</div>
             </div>
          </div>

          <div className="w-full h-[1px] bg-white/10 mb-8" />

          <div className="flex items-center justify-between">
             <div className="flex gap-10">
                <div className="text-center">
                   <div className="text-4xl font-black text-white leading-none">{data.bedrooms || '0'}</div>
                   <div className="text-[10px] uppercase font-bold text-white/30 mt-1">Beds</div>
                </div>
                <div className="text-center">
                   <div className="text-4xl font-black text-white leading-none">{data.bathrooms || '0'}</div>
                   <div className="text-[10px] uppercase font-bold text-white/30 mt-1">Baths</div>
                </div>
                <div className="text-center">
                   <div className="text-4xl font-black text-white leading-none">{data.area || '0'}</div>
                   <div className="text-[10px] uppercase font-bold text-white/30 mt-1">m²</div>
                </div>
             </div>

             <div className="px-10 py-5 bg-white text-black font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 group overflow-hidden relative">
                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" style={{ backgroundColor: brand.color }} />
                <span className="relative z-10">{data.phone || 'CONTACT AGENT'}</span>
                <span className="relative z-10">📞</span>
             </div>
          </div>
       </div>
    </div>
  </div>
);

export const LISTING_TEMPLATES = [
  { id: 'classic', name: 'Classic', color: '#0E3A47', component: ClassicTemplate },
  { id: 'modern', name: 'Modern', color: '#1a1a2e', component: ModernTemplate },
  { id: 'minimal', name: 'Minimal', color: '#f5f2ed', component: MinimalTemplate },
  { id: 'gold-wave', name: 'Gold Wave', color: '#E5B85D', component: GoldWaveTemplate },
  { id: 'luxury', name: 'Luxury', color: '#0a0a0f', component: LuxuryTemplate },
  { id: 'apartment', name: 'Apartment', color: '#0E3A47', component: ApartmentTemplate },
  { id: 'commercial', name: 'Commercial', color: '#0E3A47', component: CommercialTemplate },
  { id: 'instagram-modern', name: 'Insta Modern', color: '#0E3A47', component: InstaModernTemplate },
];
