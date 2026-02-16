"use client";

import { createSystemUser } from "@/app/admin/actions";
import Link from "next/link";
import { ArrowLeft, Save, User, Briefcase } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    // @ts-ignore
    if (typeof window !== 'undefined' && window.NProgress) window.NProgress.start();

    try {
      await createSystemUser(formData);
      toast.success("Kullanıcı başarıyla oluşturuldu");
      // Server action redirects, but just in case we can force NProgress done if needed
      // But if it redirects, the page unloads.
    } catch (error: any) {
      // Ignore redirect errors which are actually successful navigations
      if (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT') || error.digest?.includes('NEXT_REDIRECT')) {
        toast.success("Kullanıcı oluşturuldu, yönlendiriliyor...");
        return;
      }
      console.error("User creation error:", error);
      toast.error("Hata: " + (error.message || "Bilinmeyen hata"));
      setSaving(false);
      // @ts-ignore
      if (typeof window !== 'undefined' && window.NProgress) window.NProgress.done();
    }
  }

  return (
    <div className="p-8 flex justify-center bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      <div className="w-full max-w-xl">

        <Link href="/admin/users" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Listeye Dön
        </Link>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-4">
            Yeni Kullanıcı Kaydı
          </h1>

          <form action={handleSubmit} className="space-y-6">

            {/* ROL SEÇİMİ */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-3 font-medium">
                Kullanıcı Rolü
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setRole("student")}
                  className={`cursor-pointer p-4 rounded-lg border flex items-center justify-center gap-2 transition ${role === 'student'
                    ? 'bg-kodrix-purple dark:bg-amber-500 border-kodrix-purple dark:border-amber-500 text-white dark:text-gray-900 shadow-lg'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-bold">Öğrenci</span>
                </div>
                <div
                  onClick={() => setRole("teacher")}
                  className={`cursor-pointer p-4 rounded-lg border flex items-center justify-center gap-2 transition ${role === 'teacher'
                    ? 'bg-green-600 border-green-500 text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="font-bold">Öğretmen</span>
                </div>
              </div>
              <input type="hidden" name="role" value={role} />
            </div>

            {/* AD SOYAD */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                Ad Soyad
              </label>
              <input
                name="fullName"
                required
                placeholder="Örn: Mehmet Yılmaz"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* DEĞİŞKEN ALAN (Mail veya Okul No) */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                {role === "student" ? "Okul Numarası" : "E-posta Adresi"}
              </label>
              <input
                name="identifier"
                required
                type={role === "student" ? "text" : "email"}
                placeholder={role === "student" ? "Örn: 2024001" : "ogretmen@kodrix.com"}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                {role === "student"
                  ? "Giriş yaparken bu numara kullanılacak (Şifre: 123456)"
                  : "Öğretmen bu e-posta adresiyle giriş yapacak."}
              </p>
            </div>

            {/* VELİ BİLGİLERİ (Sadece Öğrenci için) */}
            {role === "student" && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <h3 className="text-sm font-bold text-kodrix-purple dark:text-amber-500 mb-3">
                    Veli Bilgileri
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                        Veli Adı Soyadı
                      </label>
                      <input
                        name="parentName"
                        placeholder="Örn: Ayşe Yılmaz"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                        Veli Telefon
                      </label>
                      <input
                        name="parentPhone"
                        type="tel"
                        placeholder="Örn: 0532 123 45 67"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* BRANŞ BİLGİSİ (Sadece Öğretmen için) */}
            {role === "teacher" && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-bold text-green-600 dark:text-green-400 mb-3">
                  Öğretmen Bilgileri
                </h3>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Branş / Alan
                  </label>
                  <input
                    name="subjectField"
                    placeholder="Örn: Yazılım Geliştirme, Web Tasarım, Robotik"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* ŞİFRE */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                Şifre Belirle
              </label>
              <input
                name="password"
                type="text"
                defaultValue="123456"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-kodrix-purple dark:bg-amber-500 hover:bg-kodrix-purple/90 dark:hover:bg-amber-600 text-white dark:text-gray-900 font-bold py-3 rounded-lg transition mt-4 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? "Kaydediliyor..." : "Kaydı Tamamla"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}