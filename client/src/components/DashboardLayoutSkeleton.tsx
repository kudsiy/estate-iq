import { Skeleton } from './ui/skeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

export function DashboardLayoutSkeleton() {
  const { theme } = useTheme();

  const glassStyle = useMemo(() => ({
    background: theme === "dark" ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(24px)",
    borderRight: "1px solid",
    borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
  }), [theme]);

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-slate-50'} overflow-hidden`}>
      {/* Sidebar skeleton */}
      <div className="w-[280px] p-6 space-y-10 relative z-10" style={glassStyle}>
        {/* Header/Logo area */}
        <div className="flex items-center gap-4 px-2 h-10">
          <Skeleton className="h-10 w-10 rounded-xl bg-accent/10" />
          <Skeleton className="h-4 w-28 rounded-full opacity-20" />
        </div>

        {/* Menu items */}
        <div className="space-y-4 px-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-4 h-11 px-3">
              <Skeleton className="h-5 w-5 rounded-md opacity-10" />
              <Skeleton className="h-2.5 w-24 rounded-full opacity-10" />
            </div>
          ))}
        </div>

        {/* User profile area at bottom */}
        <div className="absolute bottom-8 left-6 right-6">
           <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                 <Skeleton className="h-10 w-10 rounded-2xl bg-accent/10" />
                 <div className="space-y-2">
                    <Skeleton className="h-3 w-20 rounded-full opacity-20" />
                    <Skeleton className="h-2 w-12 rounded-full opacity-10" />
                 </div>
              </div>
              <div className="space-y-2 pt-2">
                 <Skeleton className="h-8 w-full rounded-xl opacity-5" />
                 <Skeleton className="h-8 w-full rounded-xl opacity-5" />
              </div>
           </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-10 border-b border-white/5 bg-background/20 backdrop-blur-xl">
           <div className="flex gap-4">
              <Skeleton className="h-9 w-9 rounded-xl opacity-10" />
              <Skeleton className="h-9 w-32 rounded-xl opacity-10" />
           </div>
           <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-xl opacity-10" />
              <Skeleton className="h-10 w-28 rounded-xl bg-accent/10" />
           </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-12 space-y-10">
           <div className="space-y-3">
              <Skeleton className="h-8 w-64 rounded-2xl opacity-10" />
              <Skeleton className="h-3 w-96 rounded-full opacity-5" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                 <Skeleton key={i} className="h-36 rounded-[40px] opacity-10 border border-white/5" />
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Skeleton className="lg:col-span-8 h-[500px] rounded-[48px] opacity-10 border border-white/5" />
              <Skeleton className="lg:col-span-4 h-[500px] rounded-[48px] opacity-5 border border-white/5" />
           </div>
        </div>
      </div>
    </div>
  );
}
