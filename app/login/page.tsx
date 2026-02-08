"use client";

import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { login } from "./actions";
import { SidebarLogo } from "@/components/SidebarLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import { AlertCircle } from "lucide-react";

// Wrapper for Submit Button to handle pending state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg shadow-purple-500/20 dark:shadow-amber-500/20 text-sm font-bold text-white bg-kodrix-purple hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? "Giriş Yapılıyor..." : "Giriş Yap"}
    </button>
  );
}

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Left Side - Form Area */}
      <div className="flex flex-col justify-center flex-1 px-8 py-12 lg:flex-none lg:w-1/2 xl:w-[500px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 relative">
        <div className="w-full max-w-sm mx-auto">

          <div className="mb-10 text-center lg:text-left">
            <div className="inline-block p-4 mb-6 rounded-2xl bg-purple-50 dark:bg-amber-900/20 border border-purple-100 dark:border-amber-900/30">
              <SidebarLogo />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Hoş Geldiniz</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Öğretmen veya Öğrenci girişi için bilgilerinizi giriniz.
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="schoolNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Kullanıcı Adı / Okul No
              </label>
              <input
                id="schoolNumber"
                name="schoolNumber"
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Örn: 202401 veya t.yilmaz"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Şifre
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4" />
                {state.error}
              </div>
            )}

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Giriş yapamıyor musun? <br />
                <span className="text-kodrix-purple dark:text-amber-500 font-medium cursor-help">Yöneticinizle iletişime geçin</span>
              </p>

              {/* Theme Toggle */}
              <div className="flex items-center gap-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800/50">
                <ThemeToggle />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right Side - Image/Brand Area */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-kodrix-purple to-purple-900 dark:from-gray-900 dark:to-black overflow-hidden items-center justify-center">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 dark:opacity-10 bg-center"></div>

        {/* Floating shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Large Logo with Spin Animation */}
          <div className="relative w-64 h-64 mb-8">
            {/* Spinning Ring */}
            <div className="absolute inset-0 border-4 border-dashed border-white/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 border-4 border-dashed border-amber-400/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

            {/* Logo Image */}
            <div className="absolute inset-8 flex items-center justify-center bg-white/5 backdrop-blur-xl rounded-full shadow-2xl border border-white/10">
              <Image
                src="/logos/logo-light.png"
                alt="KodriX Large Logo"
                width={120}
                height={120}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          <div className="text-center space-y-4 max-w-lg px-6">
            <h2 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg">KODRIX LMS</h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full"></div>
            <p className="text-xl text-purple-100 dark:text-gray-400 font-light leading-relaxed">
              Geleceğin eğitim teknolojisi.<br />
              <span className="text-amber-300 font-medium">Öğrenci</span> • <span className="text-amber-300 font-medium">Öğretmen</span> • <span className="text-amber-300 font-medium">Yönetim</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}