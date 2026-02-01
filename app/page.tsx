import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link"; // Link zaten ekliydi, süper.

export default async function Home() {
  const supabase = await createClient();

  // 1. Kim giriş yapmış kontrol et
  const { data: { user } } = await supabase.auth.getUser();

  // Eğer giriş yapan yoksa, giriş sayfasına postala
  if (!user) {
    redirect("/login");
  }

  // 2. Bu öğrencinin kayıtlı olduğu sınıfları bul
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select(`
      class_id,
      classes (
        id,
        name
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Veri çekme hatası:", error);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white">
      
      {/* Üst Menü (Navbar) */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="text-xl font-bold text-yellow-400">🚀 KodriX</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Öğrenci No: {user.email?.split("@")[0]}
          </span>
          <form action="/auth/signout" method="post">
            <button className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition">
              Çıkış
            </button>
          </form>
        </div>
      </nav>

      {/* Ana İçerik */}
      <main className="w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold mb-6">Derslerim</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments?.map((kayit: any) => (
            /* DEĞİŞİKLİK BURADA BAŞLIYOR */
            /* Kartın tamamını Link içine aldık ve key'i buraya taşıdık */
            <Link 
              key={kayit.class_id} 
              href={`/class/${kayit.class_id}`}
              className="block" // Link'in düzgün davranması için
            >
              <div
                /* Key'i buradan sildik çünkü üstteki Link'e verdik */
                className="group relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-all duration-300 shadow-lg hover:shadow-yellow-500/10 cursor-pointer h-full"
              >
                {/* Süsleme Çizgisi */}
                <div className="h-2 w-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition">
                    {kayit.classes.name}
                  </h3>
                  <p className="text-gray-400 mt-2 text-sm">
                    Canlı derslere ve kayıtlara ulaşmak için tıkla.
                  </p>
                  
                  <div className="mt-6 flex items-center text-yellow-500 text-sm font-medium">
                    Derse Git <span className="ml-2 group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
              </div>
            </Link>
            /* DEĞİŞİKLİK BURADA BİTİYOR */
          ))}

          {/* Hiç ders yoksa */}
          {(!enrollments || enrollments.length === 0) && (
            <div className="col-span-2 text-center p-10 bg-gray-800 rounded-lg border border-gray-700 border-dashed">
              <p className="text-gray-400 text-lg">
                Henüz atanmış bir dersiniz yok.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}