import { createClient } from "@/lib/supabase/server";
import { updateLesson } from "@/app/admin/actions"; // Actions yolunu kendine göre ayarla
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id: lessonId } = await params;

  // Mevcut bilgileri çek
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (!lesson) return <div className="text-white">Ders bulunamadı!</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        
        <Link href={`/admin/classes/${lesson.class_id}`} className="flex items-center text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
        </Link>

        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-yellow-400">Düzenle:</span> {lesson.title}
          </h1>

          <form action={updateLesson} className="space-y-5">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <input type="hidden" name="classId" value={lesson.class_id} />

            {/* Diğer inputlar (Title, Description vs.) aynen kalabilir... */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Ders Başlığı</label>
              <input name="title" defaultValue={lesson.title} required className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Açıklama</label>
              <textarea name="description" rows={4} defaultValue={lesson.description} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Google Meet Linki</label>
                  <input name="meetLink" defaultValue={lesson.meet_link} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Kayıt Linki (Youtube)</label>
                  <input name="videoUrl" defaultValue={lesson.video_url} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
                </div>
            </div>

            {/* YENİ EKLENEN KISIM: DOSYA GÜNCELLEME */}
            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-700">
              <label className="text-sm text-yellow-400 block mb-2 font-semibold">Ders Materyali</label>
              
              {/* Mevcut Dosya Bilgisi */}
              {lesson.file_url ? (
                <div className="flex items-center gap-2 mb-3 text-xs text-green-400 bg-green-400/10 p-2 rounded w-fit">
                   <span>✓ Şu an bir dosya yüklü.</span>
                   <a href={lesson.file_url} target="_blank" className="underline hover:text-green-300">Görüntüle</a>
                </div>
              ) : (
                <div className="text-xs text-gray-500 mb-3">Henüz dosya yüklenmemiş.</div>
              )}

              {/* Yeni Dosya Seçimi */}
              <input 
                name="file" 
                type="file" 
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-gray-900 hover:file:bg-yellow-400 cursor-pointer" 
              />
              <p className="text-[10px] text-gray-500 mt-2">* Yeni dosya seçerseniz eskisi değişir. Seçmezseniz eskisi kalır.</p>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition">
              <Save className="w-5 h-5" /> Değişiklikleri Kaydet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}