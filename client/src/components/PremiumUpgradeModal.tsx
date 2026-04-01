import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Zap, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function PremiumUpgradeModal({ open, onOpenChange, feature }: PremiumUpgradeModalProps) {
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data: any) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: any) => toast.error(error.message || "Checkout failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-background">
        <div className="bg-gradient-to-br from-foreground to-[#151518] p-10 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/20 blur-[60px] rounded-full" />
          
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-accent rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-accent/40 relative z-10 animate-bounce-slow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <DialogHeader className="text-center space-y-3 relative z-10">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-white italic">Upgrade to Pro</DialogTitle>
            <DialogDescription className="text-white/60 font-medium text-sm leading-relaxed px-4">
              Unlock the full power of <span className="text-accent underline underline-offset-4 decoration-accent/30 font-bold">{feature || "Advanced AI"}</span> and scale your real estate dominance.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-5">
            {[
              "Unlimited AI Room Staging & Eraser",
              "Dual-Language SEO (Amharic/English)",
              "Cinematic Magic Reel Exports",
              "Priority Social Hub Scheduling",
              "Multi-Seat Agency Collaboration"
            ].map((f) => (
              <div key={f} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-accent/20">
                  <Check className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-[13px] font-bold text-foreground/80 tracking-tight">{f}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-6">
             <Button 
               className="w-full h-16 rounded-[1.25rem] bg-accent hover:bg-accent/90 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-accent/30 transition-all active:scale-95 border-b-4 border-black/20"
               onClick={() => checkoutMutation.mutate({ plan: "pro" })}
               disabled={checkoutMutation.isPending}
             >
               {checkoutMutation.isPending ? (
                 <span className="flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Securing Connection...
                 </span>
               ) : "Upgrade for ETB 999/mo"}
             </Button>
             
             <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-[10px] font-black italic tracking-tighter">CHAPA PAY</div>
                <div className="text-[10px] font-black italic tracking-tighter">TELEBIRR</div>
                <div className="text-[10px] font-black italic tracking-tighter">CBE BIRR</div>
             </div>
             
             <p className="text-[10px] text-center text-muted-foreground/60 font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure Payment via Chapa
             </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
