import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sparkles, Check, Zap, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function PremiumUpgradeModal({ open, onOpenChange, feature }: PremiumUpgradeModalProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data: any) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: any) => toast.error(error.message || "Checkout failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-background/80 backdrop-blur-3xl">
        <div className={`p-10 relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-[#1e293b] to-[#0f172a]' : 'bg-gradient-to-br from-white to-[#f1f5f9]'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="flex justify-center mb-8 relative z-10">
            <div className="w-24 h-24 bg-accent rounded-[2rem] flex items-center justify-center shadow-2xl shadow-accent/40 animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <DialogHeader className="text-center space-y-4 relative z-10">
            <DialogTitle className="text-4xl font-black uppercase tracking-tighter italic text-foreground leading-none">
               {t("set.upgrade")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold text-sm tracking-tight px-6 uppercase opacity-60">
               {t("set.plans")} — {feature || "Estate IQ Pro"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-12 space-y-5 relative z-10">
            {[
              t("pro.feature1"),
              t("pro.feature2"),
              t("pro.feature3"),
              t("pro.feature4"),
              t("pro.feature5")
            ].map((f) => (
              <div key={f} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20 group-hover:bg-accent group-hover:text-white transition-all">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-[12px] font-black uppercase tracking-widest text-foreground/80">{f}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-6 relative z-10">
             <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <p className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Manual Payment Activation</p>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Telebirr</span>
                      <span className="text-xs font-black text-foreground tracking-widest">[your number]</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">CBE Account</span>
                      <span className="text-xs font-black text-foreground tracking-widest">[your account]</span>
                   </div>
                </div>
             </div>

             <Button 
               className="w-full h-16 rounded-2.5xl bg-accent hover:bg-accent/90 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-accent/40 border-b-4 border-black/20 hover:translate-y-px active:translate-y-1 transition-all"
               onClick={() => window.open(`https://wa.me/251XXXXXXXXX?text=Hello, I have made a payment for Estate IQ Pro.`, '_blank')}
             >
               Confirm via WhatsApp
             </Button>
             
             <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" /> {t("pro.secure")} — Active within 1 hour
             </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
