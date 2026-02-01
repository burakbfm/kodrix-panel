import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id: classId } = await params; // Next.js 15 için await eklendi

  // 1. Önce Sınıfın Adını Çekelim (Başlık için)
  const { data: classInfo } = await supabase
    .from("classes")
    .select("name")
    .eq("id", classId)
    .single();

  // 2. SADECE AKTİF olan dersleri çekelim!
  // Öğretmen 'is_active: false' yaptıysa buraya gelmez.
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("class_id", classId)
    .eq("is_active", true) // <-- İşte senin güvenlik kuralın!
    .order("date", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      
      {/* Üst Kısım: Geri Dön Butonu ve Başlık */}
      <div className="max-w-4xl mx-auto mb-10">
        <Link
          href="/"
          className="text-gray-400 hover:text-yellow-400 text-sm mb-4 inline-block transition"
        >
          ← Derslerim Sayfasına Dön
        </Link>
        <h1 className="text-4xl font-bold text-yellow-400">
          {classInfo?.name || "Sınıf Detayı"}
        </h1>
        <p className="text-gray-400 mt-2">
          Aktif dersler ve içerikler aşağıda listelenmiştir.
        </p>
      </div>

      {/* Ders Listesi */}
      <div className="max-w-4xl mx-auto space-y-6">
        {lessons?.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-600 transition"
          >
            {/* Sol Taraf: Ders Bilgisi */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                  ● Canlı / Aktif
                </span>
                <span className="text-gray-500 text-sm">
                  {new Date(lesson.date).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {lesson.title}
              </h2>
              <p className="text-gray-400 text-sm max-w-xl">
                {lesson.description}
              </p>
            </div>

            {/* Sağ Taraf: Aksiyon Butonları */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              {/* 1. Google Meet Butonu */}
              {lesson.meet_link && (
                <a
                  href={lesson.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105"
                >
                  📹 Canlı Derse Bağlan
                </a>
              )}

              {/* 2. Kayıt İzle Butonu (Varsa) */}
              {lesson.video_url && (
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition text-sm"
                >
                  ▶️ Kaydı İzle
                </a>
              )}
              
              {/* 3. Dosya İndir (Varsa) */}
               {lesson.file_url && (
                <a
                   href={lesson.file_url}
                   target="_blank"
                   className="text-center text-gray-400 hover:text-white text-xs underline"
                >
                   Ders Dosyasını İndir
                </a>
               )}
            </div>
          </div>
        ))}

        {/* Eğer hiç aktif ders yoksa */}
        {lessons?.length === 0 && (
          <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
            <p className="text-xl text-gray-300 font-semibold">
              Şu an aktif bir ders görünmüyor. 💤
            </p>
            <p className="text-gray-500 mt-2">
              Öğretmenin dersi başlattığında burada göreceksin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}