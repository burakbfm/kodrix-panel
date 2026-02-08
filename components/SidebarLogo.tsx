"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SidebarLogo({ className }: { className?: string }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-full h-12 bg-white/10 dark:bg-black/10 rounded-lg animate-pulse", className)} />
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center", className || "w-full h-12")}>
      {/* Light Mode Logo - Dark text for purple background */}
      {theme === "light" && (
        <div className="relative w-full h-full">
          <Image
            src="/logos/logo-light.png"
            alt="KodriX Logo"
            fill
            className="object-contain"
            priority
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerText = 'KodriX';
                // Basic fallback styling, might inherit text size from parent via className
                parent.className = "flex items-center justify-center h-full font-bold";
              }
            }}
          />
        </div>
      )}

      {/* Dark Mode Logo - Dark text for amber background */}
      {theme === "dark" && (
        <div className="relative w-full h-full">
          <Image
            src="/logos/logo-dark.png"
            alt="KodriX Logo"
            fill
            className="object-contain"
            priority
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerText = 'KodriX';
                parent.className = "flex items-center justify-center h-full font-bold";
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
