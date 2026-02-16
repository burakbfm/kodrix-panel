"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "./actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import SplineScene from "@/components/SplineScene";

// Wrapper for Submit Button to handle pending state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-kodrix-purple/30 dark:shadow-amber-500/20 text-sm font-bold text-white dark:text-gray-900 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-400 dark:to-orange-500 hover:to-purple-500 dark:hover:to-orange-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-kodrix-purple dark:focus:ring-amber-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          Giriş Yapılıyor...
        </span>
      ) : "Giriş Yap"}
    </button>
  );
}

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a16] text-gray-900 dark:text-white selection:bg-kodrix-purple selection:text-white transition-colors duration-300 overflow-hidden">

      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Left Side - Form Area */}
      <div className="relative z-10 flex flex-col justify-center flex-1 px-8 py-12 lg:flex-none lg:w-1/2 xl:w-[500px] border-r border-gray-200 dark:border-white/5 backdrop-blur-xl bg-white/60 dark:bg-black/40 transition-colors duration-300">
        <div className="w-full max-w-sm mx-auto">

          <div className="mb-12">
            <div className="inline-flex items-center gap-3 mb-8">
              {/* Left Logo REMOVED as requested, only text remains */}
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-400 dark:to-yellow-300">
                KodriX LMS
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">Tekrar Hoş Geldiniz</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Eğitim yolculuğunuza devam etmek için giriş yapın.
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="schoolNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                Kullanıcı Adı / Okul No
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-kodrix-purple to-amber-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>
                <input
                  id="schoolNumber"
                  name="schoolNumber"
                  type="text"
                  required
                  className="relative w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-black/40 focus:border-kodrix-purple dark:focus:border-white/20 focus:ring-0 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-600 shadow-sm dark:shadow-none"
                  placeholder="Örn: 202401"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şifre
                </label>
                <a href="#" className="text-xs text-kodrix-purple dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors">Şifremi Unuttum?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-kodrix-purple to-amber-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="relative w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-black/40 focus:border-kodrix-purple dark:focus:border-white/20 focus:ring-0 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-600 shadow-sm dark:shadow-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {state?.error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-200 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" />
                {state.error}
              </div>
            )}

            <div className="pt-4">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Giriş sorunu mu yaşıyorsunuz? <br />
              <button className="text-gray-700 dark:text-gray-300 hover:text-kodrix-purple dark:hover:text-white transition-colors underline decoration-gray-300 dark:decoration-white/20 hover:decoration-kodrix-purple dark:hover:decoration-white/50 underline-offset-4">
                Yönetici ile iletişime geçin
              </button>
            </p>
            {/* Theme Toggle */}
            <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <ThemeToggle />
            </div>
          </div>

        </div>
      </div>

      {/* Right Side - 3D Scene */}
      <div className="hidden lg:flex flex-1 relative bg-gray-100 dark:bg-black transition-colors duration-500 items-center justify-center overflow-hidden">

        {/* Dynamic Glow Effect Behind Robot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-700
          bg-purple-600/30 dark:bg-amber-500/20"></div>

        <div className="absolute inset-0 z-0">
          <SplineScene scene="/scene.splinecode" className="scale-110" />
        </div>

        {/* Overlay Content - Logo Frame in front */}
        <div className="absolute bottom-16 left-0 right-0 z-10 flex flex-col items-center pointer-events-none">
          <div className="relative flex flex-col items-center gap-4 backdrop-blur-md bg-white/10 dark:bg-black/40 p-8 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-300">
            <div className="relative w-40 h-12 drop-shadow-xl">
              <Image
                src="/logos/logo-dark-main.png"
                alt="KodriX"
                fill
                className="object-contain dark:hidden"
              />
              <Image
                src="/logos/logo-light-main.png"
                alt="KodriX"
                fill
                className="object-contain hidden dark:block"
              />
            </div>
            <div className="h-0.5 w-16 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-400 dark:to-orange-500 rounded-full"></div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide">
              Geleceğin Eğitim Teknolojisi
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}