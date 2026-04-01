import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Sparkles, Wand2, ShieldCheck, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function PremiumModal({ open, onOpenChange, feature }: PremiumModalProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    onOpenChange(false);
    setLocation("/billing");
  };

  const proFeatures = [
    { icon: <Sparkles className="w-4 h-4 text-accent" />, label: "Unlimited AI Captions", sub: "SEO-optimized for Ethiopian market" },
    { icon: <Wand2 className="w-4 h-4 text-accent" />, label: "30 AI Image Generations", sub: "DALL-E 3 grade property visuals" },
    { icon: <ShieldCheck className="w-4 h-4 text-accent" />, label: "Magic Rebrand Tool", sub: "Remove competitor watermarks instantly" },
    { icon: <TrendingUp className="w-4 h-4 text-accent" />, label: "Auto-Tracking Links", sub: "Capture leads from every social share" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-background/80 backdrop-blur-xl shadow-2xl rounded-[2rem]">
        {/* Apple-style gradient header */}
        <div className="bg-gradient-to-br from-accent via-accent/90 to-[#b8860b] p-8 text-white relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
            Pro Upgrade
          </div>
          <Zap className="w-10 h-10 mb-4 text-white fill-white" />
          <DialogTitle className="text-2xl font-bold leading-tight">
            Unlock the Full Power of Estate IQ.
          </DialogTitle>
          <DialogDescription className="text-white/80 mt-2 text-sm leading-relaxed">
            {feature 
              ? `The ${feature} is a Pro-tier feature designed for high-performing agents.`
              : "Scale your real estate business with professional marketing automation."}
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {proFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="mt-1 w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleUpgrade}
              className="w-full h-12 bg-accent text-white hover:bg-accent/90 rounded-2xl font-bold text-sm shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
            >
              Start 14-Day Free Trial
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-semibold">
              Monthly or Yearly billing • Cancel anytime
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
