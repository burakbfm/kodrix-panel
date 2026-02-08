"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SidebarLogo() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-12 bg-white/10 dark:bg-black/10 rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="w-full h-12 relative flex items-center justify-center">
      {/* Light Mode Logo - Dark text for purple background */}
      {theme === "light" && (
        <div className="relative w-[160px] h-[40px]">
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
                parent.className = "text-2xl font-bold text-white text-center flex items-center justify-center h-full";
              }
            }}
          />
        </div>
      )}

      {/* Dark Mode Logo - Dark text for amber background */}
      {theme === "dark" && (
        <div className="relative w-[160px] h-[40px]">
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
                parent.className = "text-2xl font-bold text-gray-900 text-center flex items-center justify-center h-full";
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
