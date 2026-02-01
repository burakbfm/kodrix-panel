import { createClient } from "@/lib/supabase/server";
import { createLesson, deleteLesson, toggleLessonStatus } from "../../actions";
import Link from "next/link";

export default async function AdminClassManagePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id: classId } = await params;

  // 1. Sınıfın Adını Çek
  const { data: classInfo } = await supabase
    .from("classes")
    .select("name")
    .eq("id", classId)
    .single();

  // 2. Dersleri Tarihe Göre Çek (Yeniden Eskiye)
  const { data: lessons, error } = await supabase // <-- BURAYA 'error' EKLENDİ
    .from("lessons")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

    // Şimdi artık hata vermez
    console.log("--- DEBUG RAPORU ---");
    console.log("Aranan Class ID:", classId);
    console.log("Gelen Ders Sayısı:", lessons?.length);
    console.log("Varsa Hata:", error);
    console.log("--------------------");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      
      {/* Üst Başlık */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link href="/admin/classes" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">
          ← Sınıflara Dön
        </Link>
        <h1 className="text-3xl font-bold text-yellow-400">
          {classInfo?.name} <span className="text-white text-lg font-normal">/ Ders Yönetimi</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL TARAF: YENİ DERS EKLEME FORMU */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              ➕ Yeni Ders Ekle
            </h2>
            <form action={createLesson} className="space-y-4">
              <input type="hidden" name="classId" value={classId} />
              
              <div>
                <label className="text-xs text-gray-400">Ders Başlığı</label>
                <input name="title" required placeholder="Örn: Hafta 3: Döngüler" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-yellow-500 outline-none" />
              </div>

              <div>
                <label className="text-xs text-gray-400">Açıklama</label>
                <textarea name="description" rows={3} placeholder="Bu derste neler işlenecek..." className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-yellow-500 outline-none" />
              </div>

              <div>
                <label className="text-xs text-gray-400">Google Meet Linki</label>
                <input name="meetLink" placeholder="https://meet.google.com/..." className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-yellow-500 outline-none" />
              </div>

              <div>
                <label className="text-xs text-gray-400">Kayıt Linki (Youtube/Vimeo)</label>
                <input name="videoUrl" placeholder="https://youtube.com/..." className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-yellow-500 outline-none" />
              </div>
                {/* MEVCUT INPUTLAR (Youtube Linki vs.) BURADA BİTİYOR */}
              
              {/* YENİ EKLENECEK KISIM: DOSYA YÜKLEME */}
              <div>
                <label className="text-xs text-gray-400">Ders Materyali (PDF, Zip, Resim)</label>
                <div className="relative">
                  <input 
                    name="file" 
                    type="file" 
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-gray-900 hover:file:bg-yellow-400 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">* İsteğe bağlıdır.</p>
              </div>
              
              {/* BUTON BURADA */}

              <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg transition mt-2">
                Dersi Kaydet
              </button>
            </form>
          </div>
        </div>

        {/* SAĞ TARAF: DERS LİSTESİ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-4">Ders Listesi ({lessons?.length || 0})</h2>
          
          {lessons?.map((lesson) => (
            <div key={lesson.id} className={`p-5 rounded-xl border transition ${lesson.is_active ? 'bg-gray-800 border-green-500/50' : 'bg-gray-800/50 border-gray-700 opacity-75'}`}>
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{lesson.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{lesson.description}</p>
                  
                  {/* Link Bilgileri */}
                  <div className="flex gap-3 mt-3 text-xs">
                    {lesson.meet_link ? (
                       <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded">📹 Meet Var</span>
                    ) : (
                       <span className="text-gray-500 bg-gray-700/50 px-2 py-1 rounded">Link Yok</span>
                    )}
                    
                    {lesson.video_url && (
                       <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded">▶️ Kayıt Var</span>
                    )}
                  </div>
                </div>

                {/* Kontrol Butonları */}
                <div className="flex flex-col gap-2 items-end">
                  
                  {/* YAYINLA / GİZLE BUTONU */}
                  <form action={toggleLessonStatus}>
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <input type="hidden" name="classId" value={classId} />
                    <input type="hidden" name="currentStatus" value={String(lesson.is_active)} />
                    
                    <button className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${lesson.is_active ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}>
                      {lesson.is_active ? (
                        <>🟢 Yayında (Gizle)</>
                      ) : (
                        <>🔴 Gizli (Yayınla)</>
                      )}
                    </button>
                  </form>

                  {/* SİLME BUTONU */}
                  <form action={deleteLesson}>
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <input type="hidden" name="classId" value={classId} />
                    <button 
                      className="text-red-500 hover:text-red-400 text-xs underline mt-2"
                      onClick={(e) => {
                         if(!confirm('Bu dersi silmek istediğine emin misin?')) e.preventDefault();
                      }}
                    >
                      Dersi Sil
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {lessons?.length === 0 && (
            <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-xl">
              <p className="text-gray-500">Bu sınıfta henüz hiç ders yok.</p>
              <p className="text-sm text-gray-600">Soldaki formu kullanarak ilk dersi ekle!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}