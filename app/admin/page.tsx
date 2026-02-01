import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Güvenlik Kontrolü: Giren kişi ADMIN mi?
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Profil tablosundan rolünü kontrol et
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Eğer admin değilse, ana sayfaya (öğrenci paneline) postala
  if (profile?.role !== "admin") {
    redirect("/");
  }

  // 2. İstatistikleri Çekelim (Sistemde ne var ne yok?)
  // Toplam Öğrenci Sayısı
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  // Toplam Sınıf Sayısı
  const { count: classCount } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      
      {/* SOL MENÜ (SIDEBAR) */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-6 hidden md:block">
        <div className="text-2xl font-bold text-yellow-400 mb-10">🛡️ KodriX Admin</div>
        
        <nav className="space-y-4">
          <Link href="/admin" className="block p-3 bg-gray-700 rounded text-white font-medium">
            📊 Genel Bakış
          </Link>
          <Link href="/admin/classes" className="block p-3 text-gray-400 hover:bg-gray-700 hover:text-white rounded transition">
            🏫 Sınıflar & Dersler
          </Link>
          <Link href="/admin/users" className="block p-3 text-gray-400 hover:bg-gray-700 hover:text-white rounded transition">
            👥 Öğrenciler & Öğretmenler
          </Link>
          <div className="pt-10 border-t border-gray-700">
            <Link href="/" className="block p-3 text-sm text-gray-500 hover:text-white">
              ← Öğrenci Görünümüne Dön
            </Link>
          </div>
        </nav>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Yönetim Paneli</h1>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Kart 1 */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Toplam Öğrenci</h3>
            <p className="text-4xl font-bold text-white mt-2">{studentCount || 0}</p>
          </div>
          
          {/* Kart 2 */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Aktif Sınıflar</h3>
            <p className="text-4xl font-bold text-yellow-400 mt-2">{classCount || 0}</p>
          </div>

          {/* Kart 3 (Hızlı İşlem) */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-xl text-gray-900 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition">
            <h3 className="font-bold text-lg">🚀 Hızlı Ders Başlat</h3>
            <p className="text-sm opacity-90 mt-1">Bir sınıfa hemen canlı ders linki ekle.</p>
          </div>
        </div>

        {/* Son Hareketler (Şimdilik Boş) */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4">Sistem Durumu</h2>
          <p className="text-gray-400">Veritabanı bağlantısı aktif. Sistem sorunsuz çalışıyor.</p>
        </div>
      </main>
    </div>
  );
}