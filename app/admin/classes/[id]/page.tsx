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

  // 3. Öğrenciler
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-6 md:p-12 transition-colors">

      {/* Üst Kısım & Başlık */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <Link href="/admin/classes" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-2 inline-flex items-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" /> Sınıflara Dön
          </Link>
          <h1 className="text-3xl font-bold text-kodrix-purple dark:text-amber-500">
            {classInfo?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Sınıf Yönetim Paneli</p>
        </div>

        {/* YENİ DERS EKLE BUTONU */}
        <Link
          href={`/admin/classes/${classId}/new`}
          className="bg-kodrix-purple dark:bg-amber-500 hover:bg-kodrix-purple/90 dark:hover:bg-amber-600 text-white dark:text-gray-900 font-bold py-3 px-6 rounded-lg transition shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Yeni Ders Ekle
        </Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* SOL KOLON: ÖĞRENCİ LİSTESİ */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-10 shadow-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="w-4 h-4 text-kodrix-purple dark:text-amber-500" /> Sınıf Mevcudu
              </h3>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                {students?.length || 0}
              </span>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
              {students?.map((student: any) => (
                <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                    {(student.profiles?.school_number || "Ö").substring(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {student.profiles?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No: {student.profiles?.school_number || "-"}
                    </p>
                  </div>
                </div>
              ))}

              {(!students || students.length === 0) && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Henüz öğrenci yok.</p>
                  <button className="text-kodrix-purple dark:text-amber-500 text-xs underline mt-2 hover:opacity-80">
                    + Öğrenci Ekle (Yakında)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: DERS LİSTESİ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <BookOpen className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ders Müfredatı</h2>
          </div>

          {lessons?.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`group p-4 rounded-xl border transition-all duration-200 ${lesson.is_active
                  ? 'bg-white dark:bg-gray-900 border-green-500/50 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
                }`}
            >

              <div className="flex gap-4">
                {/* Sıralama Okları */}
                <div className="flex flex-col justify-center items-center gap-1 pr-3 border-r border-gray-100 dark:border-gray-800">
                  <form action={moveLesson}>
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <input type="hidden" name="classId" value={classId} />
                    <input type="hidden" name="currentOrder" value={lesson.order_index} />
                    <input type="hidden" name="direction" value="up" />
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-kodrix-purple dark:hover:text-amber-400 disabled:opacity-20" disabled={index === 0}>
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </form>
                  <span className="text-xs font-mono text-gray-500">{index + 1}</span>
                  <form action={moveLesson}>
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <input type="hidden" name="classId" value={classId} />
                    <input type="hidden" name="currentOrder" value={lesson.order_index} />
                    <input type="hidden" name="direction" value="down" />
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-kodrix-purple dark:hover:text-amber-400 disabled:opacity-20" disabled={index === (lessons.length - 1)}>
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* İçerik */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {lesson.title}
                        {lesson.file_url && <FileText className="w-3 h-3 text-purple-500" />}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-1">{lesson.description}</p>

                      <div className="flex gap-2 mt-3">
                        {lesson.meet_link && (
                          <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-500/20">
                            <Video className="w-3 h-3" /> Meet
                          </span>
                        )}
                        {lesson.video_url && (
                          <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 dark:text-red-400 px-2 py-1 rounded border border-red-200 dark:border-red-500/20">
                            <PlayCircle className="w-3 h-3" /> Kayıt
                          </span>
                        )}
                        {lesson.file_url && (
                          <a href={lesson.file_url} target="_blank" className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 dark:text-purple-400 px-2 py-1 rounded border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition">
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
                        className="p-2 bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-white rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Aktif/Pasif */}
                      <form action={toggleLessonStatus}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="classId" value={classId} />
                        <input type="hidden" name="currentStatus" value={String(lesson.is_active)} />
                        <button className={`p-2 rounded-lg transition ${lesson.is_active
                            ? 'bg-green-50 dark:bg-green-600/10 hover:bg-green-100 dark:hover:bg-green-600 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-white'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                          }`}>
                          {lesson.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </form>

                      {/* Sil */}
                      <form action={deleteLesson}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="classId" value={classId} />
                        <button type="submit" className="p-2 bg-red-50 dark:bg-red-600/10 hover:bg-red-100 dark:hover:bg-red-600 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-white rounded-lg transition">
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
            <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">Bu sınıfta henüz hiç ders yok.</p>
              <p className="text-sm text-gray-600 dark:text-gray-500">Yukarıdaki butona basarak ilk dersi ekle!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}