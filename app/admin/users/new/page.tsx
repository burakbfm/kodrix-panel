"use client"; // Etkileşimli form olduğu için client component

import { createSystemUser } from "@/app/admin/actions";
import Link from "next/link";
import { ArrowLeft, Save, User, Briefcase } from "lucide-react";
import { useState } from "react";

export default function NewUserPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
      <div className="w-full max-w-xl">
        
        <Link href="/admin/users" className="flex items-center text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Listeye Dön
        </Link>

        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-4">
             Yeni Kullanıcı Kaydı
          </h1>

          <form action={createSystemUser} className="space-y-6">
            
            {/* ROL SEÇİMİ */}
            <div>
              <label className="text-sm text-gray-400 block mb-3">Kullanıcı Rolü</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setRole("student")}
                  className={`cursor-pointer p-4 rounded-lg border flex items-center justify-center gap-2 transition ${role === 'student' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'}`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-bold">Öğrenci</span>
                </div>
                <div 
                  onClick={() => setRole("teacher")}
                  className={`cursor-pointer p-4 rounded-lg border flex items-center justify-center gap-2 transition ${role === 'teacher' ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50' : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'}`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="font-bold">Öğretmen</span>
                </div>
              </div>
              <input type="hidden" name="role" value={role} />
            </div>

            {/* AD SOYAD */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Ad Soyad</label>
              <input name="fullName" required placeholder="Örn: Mehmet Yılmaz" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>

            {/* DEĞİŞKEN ALAN (Mail veya Okul No) */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                {role === "student" ? "Okul Numarası" : "E-posta Adresi"}
              </label>
              <input 
                name="identifier" 
                required 
                type={role === "student" ? "text" : "email"}
                placeholder={role === "student" ? "Örn: 2024001" : "ogretmen@kodrix.com"} 
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" 
              />
              <p className="text-[10px] text-gray-500 mt-1">
                {role === "student" 
                  ? "Giriş yaparken bu numara kullanılacak (Şifre: 123456)" 
                  : "Öğretmen bu e-posta adresiyle giriş yapacak."}
              </p>
            </div>

            {/* ŞİFRE */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Şifre Belirle</label>
              <input name="password" type="text" defaultValue="123456" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>

            <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg transition mt-4 flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Kaydı Tamamla
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}