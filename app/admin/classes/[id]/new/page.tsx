import { createClient } from "@/lib/supabase/server";
import { createLesson } from "@/app/admin/actions"; // Actions yoluna dikkat et
import Link from "next/link";
import { ArrowLeft, Video, PlayCircle, FileText, Save } from "lucide-react";

export default async function NewLessonPage({ params }: { params: { id: string } }) {
  const { id: classId } = await params;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        
        <Link href={`/admin/classes/${classId}`} className="flex items-center text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Sınıfa Dön
        </Link>

        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-yellow-400">
            ➕ Yeni Ders Oluştur
          </h1>

          <form action={createLesson} className="space-y-5">
            <input type="hidden" name="classId" value={classId} />
            
            <div>
              <label className="text-sm text-gray-400 block mb-1">Ders Başlığı</label>
              <input name="title" required placeholder="Örn: Hafta 4: React Props" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Açıklama</label>
              <textarea name="description" rows={4} placeholder="Ders içeriği..." className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative">
                 <label className="text-sm text-gray-400 block mb-1">Google Meet</label>
                 <Video className="absolute left-3 top-9 w-4 h-4 text-gray-500" />
                 <input name="meetLink" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
               </div>

               <div className="relative">
                 <label className="text-sm text-gray-400 block mb-1">Youtube Kaydı</label>
                 <PlayCircle className="absolute left-3 top-9 w-4 h-4 text-gray-500" />
                 <input name="videoUrl" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
               </div>
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-700">
               <label className="text-sm text-gray-400 block mb-2">Materyal Yükle (PDF/Resim)</label>
               <div className="flex items-center gap-2">
                 <FileText className="w-5 h-5 text-yellow-500" />
                 <input name="file" type="file" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-gray-900 hover:file:bg-yellow-400 cursor-pointer" />
               </div>
            </div>

            <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg transition mt-4 flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Dersi Kaydet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}