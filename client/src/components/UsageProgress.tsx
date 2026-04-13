import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface UsageProgressProps {
  label: string;
  current: number;
  total: number;
  unit?: string;
}

export function UsageProgress({ label, current, total, unit }: UsageProgressProps) {
  const { theme } = useTheme();
  const percentage = Math.min(Math.round((current / total) * 100), 100);
  
  const isHigh = percentage > 85;
  const isMed = percentage > 60;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</p>
          <p className="text-xl font-black text-foreground">
            {current.toLocaleString()} <span className="text-muted-foreground text-sm font-bold">/ {total.toLocaleString()} {unit}</span>
          </p>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
          isHigh ? "bg-red-500/10 text-red-500" : 
          isMed ? "bg-amber-500/10 text-amber-500" : 
          "bg-emerald-500/10 text-emerald-500"
        }`}>
          {percentage}%
        </span>
      </div>
      
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${
        theme === "dark" ? "bg-white/5" : "bg-black/5"
      }`}>
        <div 
          className={`h-full transition-all duration-1000 ease-out ${
            isHigh ? "bg-gradient-to-r from-red-500 to-rose-600" : 
            isMed ? "bg-gradient-to-r from-amber-500 to-orange-600" : 
            "bg-gradient-to-r from-emerald-500 to-teal-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
