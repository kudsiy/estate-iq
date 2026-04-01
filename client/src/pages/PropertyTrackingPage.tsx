import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Building2, MapPin, BedDouble, Bath, Square, 
  Send, Phone, CheckCircle2, ArrowRight, Loader2, MessageCircle, Share2, Info, ChevronLeft, ChevronRight, LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PropertyTrackingPage() {
  const [, params] = useRoute("/l/:userId/:listingId");
  const listingId = params?.listingId;
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Fetch public property data
  const { data: property, isLoading, error } = trpc.crm.public.getProperty.useQuery(
    { uniqueId: listingId ?? "" },
    { enabled: !!listingId }
  );

  const captureMutation = trpc.crm.leads.createWithCascade.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Enquiry sent successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send enquiry");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId || !property) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const platform = searchParams.get("platform");
    const creativeId = searchParams.get("creativeId");

    captureMutation.mutate({
      propertyId: property.id,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email || null,
      notes: form.notes || null,
      source: "tracking_link",
      leadData: { 
        ...(platform ? { platform } : {}), 
        ...(creativeId ? { creativeId } : {}) 
      }
    });
  };

  const handleWhatsApp = () => {
    if (!property) return;
    const message = encodeURIComponent(`Hello, I'm interested in the listing "${property.title}" (ID: ${property.uniqueListingId}). Could you provide more details?`);
    window.open(`https://wa.me/251911223344?text=${message}`, "_blank"); // Placeholder Agent Number
    
    // Log intent to CRM if they've already filled name
    if (form.phone && !submitted) {
      captureMutation.mutate({
        propertyId: property.id,
        firstName: form.firstName || "Quick",
        lastName: form.lastName || "WhatsApp",
        phone: form.phone,
        source: "whatsapp",
        notes: "Clicked Floating WhatsApp Button",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-6 text-center">
        <div className="max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Building2 className="w-16 h-16 text-accent/20 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Listing Expired</h1>
            <p className="text-muted-foreground mb-8">This property is no longer active or the link has expired.</p>
            <Button onClick={() => window.location.href = "/"} variant="outline" className="rounded-full px-8">
              Back to Home
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const photos = (property.photos as string[]) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans overflow-x-hidden">
      {/* Premium Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3 glass-morphism py-2 px-5 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl">
             <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/40">
                <Building2 className="w-3.5 h-3.5 text-white" />
             </div>
             <span className="font-bold tracking-tighter text-sm uppercase italic">Estate IQ</span>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                <Share2 className="w-4 h-4" />
             </Button>
             <Button 
                className="rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold px-6 shadow-xl"
                onClick={() => document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
             >
                Inquire Now
             </Button>
          </div>
        </div>
      </nav>

      {/* Cinematic Cover */}
      <div className="relative h-[65vh] w-full bg-black overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.img 
            key={activePhoto}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={photos[activePhoto] || `/placeholder-property.jpg`} 
            className="w-full h-full object-cover opacity-80"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/40" />
        
        {/* Navigation Overlays */}
        <div className="absolute bottom-12 left-8 right-8 z-20 flex items-end justify-between">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                 <span className="px-3 py-1 rounded-full bg-accent text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20">
                    {property.status}
                 </span>
                 <span className="text-white/60 text-[10px] font-medium uppercase tracking-widest pl-2 border-l border-white/20">
                    ID: {property.uniqueListingId}
                 </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 max-w-2xl leading-[1.1]">{property.title}</h1>
              <div className="flex items-center gap-2 text-white/70 text-sm md:text-lg">
                 <MapPin className="w-4 h-4 text-accent" />
                 {property.address}, {property.city}
              </div>
           </motion.div>

           <div className="flex gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl"
                onClick={() => setActivePhoto(prev => (prev > 0 ? prev - 1 : photos.length - 1))}
              >
                 <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl"
                onClick={() => setActivePhoto(prev => (prev < photos.length - 1 ? prev + 1 : 0))}
              >
                 <ChevronRight className="w-5 h-5" />
              </Button>
           </div>
        </div>

        {/* Floating View All */}
        <Button 
          variant="ghost" 
          className="absolute top-24 right-8 z-20 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest px-5 h-8 gap-2"
        >
           <LayoutGrid className="w-3 h-3" /> View 12 Photos
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 pt-16 pb-32">
        
        {/* Deep Details */}
        <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-16">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/5">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Investment</p>
              <p className="text-2xl font-bold tracking-tight text-accent italic">
                ETB {property.price ? Number(property.price).toLocaleString() : "CVP"}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Bedrooms</p>
              <div className="flex items-center gap-2 text-xl font-bold">
                 <BedDouble className="w-5 h-5 text-accent" /> {property.bedrooms || "-"}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Bathrooms</p>
              <div className="flex items-center gap-2 text-xl font-bold">
                 <Bath className="w-5 h-5 text-accent" /> {property.bathrooms || "-"}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Space</p>
              <div className="flex items-center gap-2 text-xl font-bold">
                 <Square className="w-5 h-5 text-accent" /> {property.squareFeet ? `${property.squareFeet}m²` : "-"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
             <div className="md:col-span-3">
                <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                   Property Narrative
                </h3>
                <p className="text-white/60 leading-[1.8] text-lg font-light tracking-wide italic">
                   {property.description || "The agent preferred to share the details of this masterpiece through a personal viewing."}
                </p>
             </div>
             
             <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-accent">Location Context</h3>
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                         <MapPin className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-white uppercase tracking-tight">{property.subcity}</p>
                         <p className="text-[10px] text-white/40 uppercase tracking-widest">District</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3 opacity-60">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                         <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-white uppercase tracking-tight">{property.city}</p>
                         <p className="text-[10px] text-white/40 uppercase tracking-widest">Metropolitan</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Lead Conversion Hub */}
        <div className="lg:col-span-12 xl:col-span-4" id="enquiry-form">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="sticky top-28 bg-[#151518] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 blur-[80px] rounded-full" />
            
            {submitted ? (
              <div className="text-center py-12 relative z-10">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/20"
                >
                   <CheckCircle2 className="w-10 h-10 text-accent" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 tracking-tight">Request Received</h3>
                <p className="text-white/50 mb-10 leading-relaxed font-light">
                   Your private inquiry for <strong>{property.title}</strong> has been secured. Our lead agent will contact you shortly via {form.phone}.
                </p>
                <Button 
                   className="w-full bg-white/5 text-white hover:bg-white/10 rounded-2xl h-14 font-bold tracking-tight border border-white/5"
                   onClick={() => setSubmitted(false)}
                >
                   Send another inquiry
                </Button>
              </div>
            ) : (
              <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Secure this Listing</h2>
                <p className="text-white/40 text-sm font-light mb-10">Submit your inquiry for priority viewing access.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Identity</Label>
                    <div className="grid grid-cols-2 gap-3">
                       <Input 
                        placeholder="First" 
                        required 
                        className="bg-black/20 border-white/5 h-14 rounded-2xl placeholder:text-white/10 focus-visible:ring-accent"
                        value={form.firstName}
                        onChange={e => setForm({...form, firstName: e.target.value})}
                       />
                       <Input 
                        placeholder="Last" 
                        required 
                        className="bg-black/20 border-white/5 h-14 rounded-2xl placeholder:text-white/10 focus-visible:ring-accent"
                        value={form.lastName}
                        onChange={e => setForm({...form, lastName: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Connectivity</Label>
                    <div className="relative">
                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                       <Input 
                        placeholder="+251 ..." 
                        required 
                        className="bg-black/20 border-white/5 h-14 pl-14 rounded-2xl placeholder:text-white/10 focus-visible:ring-accent"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Specific Needs</Label>
                    <Textarea 
                      placeholder="Pricing, layout, or timeline questions..."
                      className="bg-black/20 border-white/5 min-h-[120px] rounded-2xl p-5 placeholder:text-white/10 focus-visible:ring-accent resize-none shrink-0"
                      value={form.notes}
                      onChange={e => setForm({...form, notes: e.target.value})}
                    />
                  </div>

                  <Button 
                    className="w-full bg-accent hover:bg-accent/90 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/20 border-b-4 border-black/20 transition-all active:border-b-0 active:translate-y-1 disabled:opacity-50"
                    disabled={captureMutation.isPending}
                  >
                    {captureMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Consultation"}
                  </Button>

                  <div className="flex items-center gap-3 py-2">
                     <div className="h-px bg-white/5 flex-1" />
                     <span className="text-[10px] font-black tracking-widest text-white/20 uppercase">Instant Access</span>
                     <div className="h-px bg-white/5 flex-1" />
                  </div>

                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full border-white/5 hover:bg-white/5 bg-transparent h-14 rounded-2xl font-bold flex gap-3 text-white/60"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    Inquire via WhatsApp
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Glassmorphic Mobile Footer */}
      <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden animate-in fade-in slide-in-from-bottom-5 duration-700 delay-500">
         <div className="bg-[#1a1a1e]/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex gap-2 shadow-2xl">
            <Button 
              className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-full h-14 font-black uppercase tracking-widest text-[10px]"
              onClick={() => document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Contact Agent
            </Button>
            <Button 
              size="icon" 
              className="w-14 h-14 bg-[#25D366] hover:bg-[#20bd5c] rounded-full shrink-0 shadow-lg shadow-[#25D366]/20"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="w-6 h-6 fill-white text-white" />
            </Button>
         </div>
      </div>
    </div>
  );
}
