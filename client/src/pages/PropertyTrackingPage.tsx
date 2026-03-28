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
  Send, Phone, CheckCircle2, ArrowRight, Loader2
} from "lucide-react";

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
    
    captureMutation.mutate({
      propertyId: property.id,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email || null,
      notes: form.notes || null,
      source: "tracking_link",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117] p-6 text-center">
        <div className="max-w-md">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h1 className="text-xl font-semibold text-white mb-2">Listing not found</h1>
          <p className="text-muted-foreground mb-6">This listing may have been removed or the link is incorrect.</p>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Hero / Cover */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {property.photos && Array.isArray(property.photos) && property.photos[0] ? (
          <img 
            src={property.photos[0]} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-background/50 flex items-center justify-center">
            <Building2 className="w-20 h-20 text-accent/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-transparent to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
                  {property.status}
                </span>
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  ID: {property.uniqueListingId}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground text-lg">
                <MapPin className="w-5 h-5 text-accent" />
                {property.address}, {property.city}{property.subcity ? `, ${property.subcity}` : ""}
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-wrap gap-8 items-center">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Price</p>
                <p className="text-3xl font-bold text-accent">
                  ETB {property.price ? Number(property.price).toLocaleString() : "Contact for Price"}
                </p>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">Beds</p>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <BedDouble className="w-4 h-4 text-accent" /> {property.bedrooms || "—"}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">Baths</p>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Bath className="w-4 h-4 text-accent" /> {property.bathrooms || "—"}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">Area</p>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Square className="w-4 h-4 text-accent" /> {property.squareFeet ? `${property.squareFeet}sqft` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Property Description</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {property.description || "No description provided for this listing."}
              </p>
            </div>
          </div>

          {/* Sticky Lead Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
              <div className="h-1.5 bg-accent w-full" />
              <CardContent className="p-8">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Enquiry Sent!</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      The agent has been notified and will contact you via {form.phone} shortly.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-white/10"
                      onClick={() => setSubmitted(false)}
                    >
                      Send another enquiry
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">Interested?</h3>
                      <p className="text-sm text-muted-foreground">
                        Get more details or schedule a viewing with the agent.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">First Name</Label>
                          <Input 
                            className="bg-white/5 border-white/10 h-10" 
                            placeholder="Abebe"
                            required
                            value={form.firstName}
                            onChange={(e) => setForm({...form, firstName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Last Name</Label>
                          <Input 
                            className="bg-white/5 border-white/10 h-10" 
                            placeholder="Girma"
                            required
                            value={form.lastName}
                            onChange={(e) => setForm({...form, lastName: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            className="bg-white/5 border-white/10 h-10 pl-10" 
                            placeholder="+251 9--"
                            type="tel"
                            required
                            value={form.phone}
                            onChange={(e) => setForm({...form, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Email (Optional)</Label>
                        <Input 
                          className="bg-white/5 border-white/10 h-10" 
                          placeholder="name@example.com"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({...form, email: e.target.value})}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Message</Label>
                        <Textarea 
                          className="bg-white/5 border-white/10 min-h-[100px] resize-none" 
                          placeholder="I'm interested in this property. Please contact me with more information."
                          value={form.notes}
                          onChange={(e) => setForm({...form, notes: e.target.value})}
                        />
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 shadow-lg shadow-accent/20 transition-all active:scale-95"
                        disabled={captureMutation.isPending}
                      >
                        {captureMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Send Message <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      <p className="text-[10px] text-center text-muted-foreground mt-4">
                        Powered by <strong>Estate IQ</strong> — Digital Real Estate Solutions
                      </p>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
