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

  const logoSrc = mounted && theme === "dark" ? "/logos/logo-dark.png" : "/logos/logo-light.png";

  return (
    <div className={cn("relative flex items-center justify-center", className || "w-full h-12")}>
      <div className="relative w-full h-full">
        <Image
          src={logoSrc}
          alt="KodriX Logo"
          fill
          className="object-contain"
          priority
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = '<span class="text-2xl font-bold bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 bg-clip-text text-transparent">KodriX</span>';
            }
          }}
        />
      </div>
    </div>
  );
}
