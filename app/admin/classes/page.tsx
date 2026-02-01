import { createClient } from "@/lib/supabase/server";
import { createClass, deleteClass } from "../actions"; // actions dosyanın yeri aynıysa burası kalabilir
import Link from "next/link";

export default async function AdminClassesPage() {
  const supabase = await createClient();

  // DEĞİŞİKLİK BURADA:
  // Sadece "*" değil, ilişkili tabloların sayısını (count) da istiyoruz.
  const { data: classes } = await supabase
    .from("classes")
    .select(`
      *,
      enrollments(count),
      lessons(count)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      
      {/* Üst Başlık */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">
            ← Panele Dön
          </Link>
          <h1 className="text-3xl font-bold text-yellow-400">🏫 Sınıf Yönetimi</h1>
        </div>
      </div>

      {/* Yeni Sınıf Ekleme Formu */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10 max-w-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Yeni Sınıf Oluştur</h2>
        <div className="flex gap-4">
          <form action={createClass} className="flex-1 flex gap-4">
            <input
              name="name"
              type="text"
              required
              placeholder="Örn: 12-A Sayısal veya Python Grubu"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 outline-none placeholder-gray-500"
            />
            <button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-lg transition transform hover:scale-105">
              + Oluştur
            </button>
          </form>
        </div>
      </div>

      {/* Sınıf Listesi */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Mevcut Sınıflar 
        <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded-full border border-gray-700">
          Toplam: {classes?.length || 0}
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes?.map((cls: any) => (
          <div key={cls.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col justify-between hover:border-yellow-500 transition group shadow-md hover:shadow-yellow-500/10">
            
            {/* Kart Üstü: Başlık ve ID */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-yellow-400 transition">
                {cls.name}
              </h3>
              <p className="text-gray-600 text-[10px] font-mono truncate">ID: {cls.id}</p>
            </div>

            {/* İstatistikler (Mevcut & Hafta) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Mevcut (Öğrenci Sayısı) */}
              <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-400 text-xs mb-1">Öğrenci</div>
                <div className="text-xl font-bold text-white flex items-center justify-center gap-1">
                  👥 {cls.enrollments?.[0]?.count || 0}
                </div>
              </div>

              {/* Hafta (Ders Sayısı) */}
              <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-400 text-xs mb-1">Ders / Hafta</div>
                <div className="text-xl font-bold text-white flex items-center justify-center gap-1">
                  📚 {cls.lessons?.[0]?.count || 0}
                </div>
              </div>
            </div>
            
            {/* Butonlar */}
            <div className="flex gap-3 mt-auto">
              <Link 
                href={`/admin/classes/${cls.id}`} // Bir sonraki adımda bu sayfayı yapacağız!
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-900/20"
              >
                Yönet & Ders Ekle →
              </Link>

              {/* Silme Butonu */}
              <form action={deleteClass}>
                <input type="hidden" name="classId" value={cls.id} />
                <button 
                  className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-3 rounded-lg transition border border-red-500/20 hover:border-transparent"
                  title="Sınıfı Sil"
                  type="submit"
                >
                  🗑️
                </button>
              </form>
            </div>
          </div>
        ))}

        {/* Boş Durum */}
        {classes?.length === 0 && (
          <div className="col-span-3 text-center py-10 border-2 border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-500 text-lg">Henüz hiç sınıf yok. 😪</p>
            <p className="text-gray-600 text-sm mt-1">Yukarıdaki formdan yeni bir tane oluştur.</p>
          </div>
        )}
      </div>
    </div>
  );
}