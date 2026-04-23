import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { 
  ImageIcon, Download, Trash2, LayoutGrid, Calendar, 
  ArrowRight, Search, Filter, Sparkles, Building2, Paintbrush
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { optimizeCloudinaryUrl } from "@/lib/image";

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(32px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "32px",
});

export default function DesignGallery() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const { data: designs = [], isLoading, refetch } = trpc.crm.designs.list.useQuery();

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-12 px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/20">
                <Paintbrush className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent opacity-80">Persistence Layer</span>
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase italic">Design Gallery</h1>
            <p className="text-muted-foreground mt-4 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Every premium ad and rebrand you've created, archived for rapid deployment.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-[24px] border border-border/50">
             <div className="flex items-center gap-3 px-6 py-2">
                <LayoutGrid className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest">{designs.length} Assets</span>
             </div>
             <Button variant="outline" className="rounded-full border-border/50 bg-background/50 text-[10px] font-black uppercase tracking-widest px-8">
                Filter
             </Button>
          </div>
        </div>

        {designs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={glassStyle}
            className="flex flex-col items-center justify-center py-32 border-0 text-center"
          >
            <div className="w-24 h-24 rounded-[40px] bg-accent/5 flex items-center justify-center mb-8">
               <ImageIcon className="w-10 h-10 text-accent/20" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 italic">Gallery is Empty</h2>
            <p className="text-muted-foreground font-medium mb-10 max-w-sm">
              Head over to the Design Studio to create your first premium listing ad or AI rebrand.
            </p>
            <Button className="rounded-2xl gap-3 px-8 h-12 bg-accent text-white font-black text-[11px] uppercase tracking-widest" onClick={() => window.location.href = "/studio"}>
               Open Design Studio <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {designs.map((design, idx) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={glassStyle}
                  className="group relative overflow-hidden border-0 hover:border-accent/30 transition-all"
                >
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={optimizeCloudinaryUrl(design.previewUrl) || "/placeholder-property.jpg"} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                       <Button 
                         size="icon" 
                         className="w-12 h-12 rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl"
                         onClick={() => design.previewUrl && handleDownload(design.previewUrl, design.name)}
                       >
                          <Download className="w-5 h-5" />
                       </Button>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-accent italic">
                            {design.type} Asset
                          </p>
                          <h3 className="text-xl font-black tracking-tighter truncate max-w-[200px] uppercase">
                            {design.name}
                          </h3>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1 justify-end">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(design.createdAt).toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-6 border-t border-border/50">
                       <div className="flex-1 flex gap-2">
                          <span className="px-3 py-1 rounded-lg bg-muted text-[8px] font-black uppercase tracking-widest">
                            {design.template || "Standard"}
                          </span>
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
