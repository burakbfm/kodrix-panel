import { createClient } from "@/lib/supabase/server";
import { deleteLesson, toggleLessonStatus, moveLesson } from "../../actions";
import Link from "next/link";
import { 
  ArrowLeft, Video, PlayCircle, FileText, Plus, 
  Trash2, Eye, EyeOff, Edit, ArrowUp, ArrowDown, Users, BookOpen 
} from "lucide-react";

export const revalidate = 0;

export default async function AdminClassManagePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id: classId } = await params;

  // 1. Sınıf Bilgisi
  const { data: classInfo } = await supabase.from("classes").select("name").eq("id", classId).single();

  // 2. Dersler
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("class_id", classId)
    .order("order_index", { ascending: true });

  // 3. Öğrenciler (Enrollments tablosundan Profillere bağlanıyoruz)
  // Not: Eğer profiles tablon boşsa burası boş gelebilir.
  const { data: students } = await supabase
    .from("enrollments")
    .select(`
      id,
      profiles:user_id (
        email,
        school_number,
        role
      )
    `)
    .eq("class_id", classId);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      
      {/* Üst Kısım & Başlık */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <Link href="/admin/classes" className="text-gray-400 hover:text-white text-sm mb-2 inline-flex items-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" /> Sınıflara Dön
          </Link>
          <h1 className="text-3xl font-bold text-yellow-400">
             {classInfo?.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Sınıf Yönetim Paneli</p>
        </div>

        {/* YENİ DERS EKLE BUTONU (Artık burada!) */}
        <Link 
          href={`/admin/classes/${classId}/new`}
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition shadow-lg shadow-yellow-500/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Yeni Ders Ekle
        </Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: ÖĞRENCİ LİSTESİ (Kısa Görünüm) */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden sticky top-10">
            <div className="p-4 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Sınıf Mevcudu
              </h3>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded text-white">{students?.length || 0}</span>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
              {students?.map((student: any) => (
                <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {(student.profiles?.school_number || "Ö").substring(0,2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{student.profiles?.email}</p>
                    <p className="text-xs text-gray-500">No: {student.profiles?.school_number || "-"}</p>
                  </div>
                </div>
              ))}

              {(!students || students.length === 0) && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Henüz öğrenci yok.</p>
                  <button className="text-blue-400 text-xs underline mt-2 hover:text-blue-300">
                    + Öğrenci Ekle (Yakında)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: DERS LİSTESİ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
             <BookOpen className="w-5 h-5 text-yellow-400" />
             <h2 className="text-xl font-bold">Ders Müfredatı</h2>
          </div>
          
          {lessons?.map((lesson, index) => (
            <div key={lesson.id} className={`group p-4 rounded-xl border transition-all duration-200 ${lesson.is_active ? 'bg-gray-800 border-green-500/30' : 'bg-gray-800/40 border-gray-700 opacity-80'}`}>
              
              <div className="flex gap-4">
                {/* Sıralama Okları */}
                <div className="flex flex-col justify-center items-center gap-1 pr-3 border-r border-gray-700/50">
                   <form action={moveLesson}>
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <input type="hidden" name="classId" value={classId} />
                      <input type="hidden" name="currentOrder" value={lesson.order_index} />
                      <input type="hidden" name="direction" value="up" />
                      <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-yellow-400 disabled:opacity-20" disabled={index === 0}>
                        <ArrowUp className="w-4 h-4" />
                      </button>
                   </form>
                   <span className="text-xs font-mono text-gray-600">{index + 1}</span>
                   <form action={moveLesson}>
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <input type="hidden" name="classId" value={classId} />
                      <input type="hidden" name="currentOrder" value={lesson.order_index} />
                      <input type="hidden" name="direction" value="down" />
                      <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-yellow-400 disabled:opacity-20" disabled={index === (lessons.length - 1)}>
                        <ArrowDown className="w-4 h-4" />
                      </button>
                   </form>
                </div>

                {/* İçerik */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {lesson.title}
                        {lesson.file_url && <FileText className="w-3 h-3 text-purple-400" />}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-1">{lesson.description}</p>
                      
                      <div className="flex gap-2 mt-3">
                        {lesson.meet_link && (
                            <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                                <Video className="w-3 h-3" /> Meet
                            </span>
                        )}
                        {lesson.video_url && (
                            <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">
                                <PlayCircle className="w-3 h-3" /> Kayıt
                            </span>
                        )}
                        {lesson.file_url && (
                            <a href={lesson.file_url} target="_blank" className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 hover:bg-purple-500/20 transition">
                                <FileText className="w-3 h-3" /> Dosya
                            </a>
                        )}
                      </div>
                    </div>

                    {/* Yönetim Butonları */}
                    <div className="flex items-center gap-2">
                       {/* Düzenle */}
                       <Link 
                          href={`/admin/lessons/${lesson.id}/edit`} 
                          className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition"
                       >
                          <Edit className="w-4 h-4" />
                       </Link>

                       {/* Aktif/Pasif */}
                       <form action={toggleLessonStatus}>
                          <input type="hidden" name="lessonId" value={lesson.id} />
                          <input type="hidden" name="classId" value={classId} />
                          <input type="hidden" name="currentStatus" value={String(lesson.is_active)} />
                          <button className={`p-2 rounded-lg transition ${lesson.is_active ? 'bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white'}`}>
                             {lesson.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                       </form>

                       {/* Sil */}
                       <form action={deleteLesson}>
                          <input type="hidden" name="lessonId" value={lesson.id} />
                          <input type="hidden" name="classId" value={classId} />
                          <button type="submit" className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {lessons?.length === 0 && (
            <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-xl">
              <p className="text-gray-500">Bu sınıfta henüz hiç ders yok.</p>
              <p className="text-sm text-gray-600">Yukarıdaki butona basarak ilk dersi ekle!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}