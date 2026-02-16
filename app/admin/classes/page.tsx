import { createClient } from "@/lib/supabase/server";
import { createClass } from "../actions";
import Link from "next/link";
import { BookOpen, Users, FileText, Plus, GraduationCap, UserCircle, Search, CheckCircle, ClipboardList, Target } from "lucide-react";
import { DeleteClassButton } from "@/components/DeleteClassButton";

export const revalidate = 0;

export default async function AdminClassesPage() {
  const supabase = await createClient();

  // Fetch classes WITH assigned programs and teachers
  const { data: classes, error } = await supabase
    .from("classes")
    .select(`
      *,
      enrollments(count),
      class_programs(
        id,
        is_active,
        program:programs(id, title),
        teacher:profiles!class_programs_teacher_id_fkey(id, full_name)
      ),
      class_lessons(count),
      class_quizzes(count),
      class_assignments(count)
    `)
    .order("created_at", { ascending: false });

  // Fetch active lesson counts per class
  const classIds = classes?.map(c => c.id) || [];
  let activeLessonMap = new Map<string, number>();
  if (classIds.length > 0) {
    const { data: activeLessons } = await supabase
      .from("class_lessons")
      .select("class_id")
      .in("class_id", classIds)
      .eq("is_active", true);

    activeLessons?.forEach((l: any) => {
      activeLessonMap.set(l.class_id, (activeLessonMap.get(l.class_id) || 0) + 1);
    });
  }

  // Log errors for debugging
  if (error) {
    console.error("❌ Classes fetch error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 dark:from-purple-950 dark:to-indigo-950 p-10 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-purple-200" />
              Sınıf Yönetimi
            </h1>
            <p className="text-purple-200 text-lg">
              Sınıfları oluşturun, düzenleyin ve öğrencileri yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Create Class Form */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
            <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          Yeni Sınıf Oluştur
        </h2>
        <div className="flex gap-4">
          <form action={createClass} className="flex-1 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Users className="w-5 h-5" />
              </div>
              <input
                name="name"
                type="text"
                required
                placeholder="Örn: 12-A Sayısal veya Python Grubu"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple transition-all outline-none"
              />
            </div>
            <button className="bg-gradient-to-r from-kodrix-purple to-purple-800 dark:from-amber-500 dark:to-orange-600 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-lg hover:shadow-kodrix-purple/20 dark:hover:shadow-amber-500/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-md">
              <Plus className="w-5 h-5" />
              Sınıf Ekle
            </button>
          </form>
        </div>
      </div>

      {/* Classes Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
            Mevcut Sınıflar
          </h2>
          <span className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm">
            Topam {classes?.length || 0} Sınıf
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls: any) => {
            // Get active program and teacher info
            const activeProgram = cls.class_programs?.find((cp: any) => cp.is_active);
            const enrollmentCount = cls.enrollments?.[0]?.count || 0;

            return (
              <div
                key={cls.id}
                className="group relative bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>

                {/* Header */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl shadow-inner">
                        {cls.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-amber-500 transition-colors">
                        {cls.name}
                      </h3>
                    </div>
                    <DeleteClassButton classId={cls.id} className={cls.name} />
                  </div>

                  {/* Program & Teacher Info */}
                  <div className="space-y-3 mb-6">
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                      {activeProgram ? (
                        <>
                          <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-200 dark:border-white/5">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                              <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300 truncate">
                              {activeProgram.program?.title || "Program"}
                            </span>
                          </div>
                          {activeProgram.teacher && (
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                                <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {activeProgram.teacher.full_name}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 italic text-sm">
                          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                          Henüz program atanmamış
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  {(() => {
                    const totalLessons = cls.class_lessons?.[0]?.count || 0;
                    const activeLessonCount = activeLessonMap.get(cls.id) || 0;
                    const quizCount = cls.class_quizzes?.[0]?.count || 0;
                    const assignmentCount = cls.class_assignments?.[0]?.count || 0;
                    const progress = totalLessons > 0 ? Math.round((activeLessonCount / totalLessons) * 100) : 0;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {/* Student Count */}
                          <div className="bg-blue-50/80 dark:bg-blue-500/10 p-2.5 rounded-xl border border-blue-100/80 dark:border-blue-500/10 text-center">
                            <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{enrollmentCount}</div>
                            <div className="text-[9px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mt-0.5">Öğrenci</div>
                          </div>

                          {/* Total Lessons */}
                          <div className="bg-green-50/80 dark:bg-green-500/10 p-2.5 rounded-xl border border-green-100/80 dark:border-green-500/10 text-center">
                            <BookOpen className="w-3.5 h-3.5 text-green-500 dark:text-green-400 mx-auto mb-1" />
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{totalLessons}</div>
                            <div className="text-[9px] font-bold text-green-600/70 dark:text-green-400/70 uppercase tracking-wider mt-0.5">Ders</div>
                          </div>

                          {/* Quiz Count */}
                          <div className="bg-purple-50/80 dark:bg-purple-500/10 p-2.5 rounded-xl border border-purple-100/80 dark:border-purple-500/10 text-center">
                            <ClipboardList className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 mx-auto mb-1" />
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{quizCount}</div>
                            <div className="text-[9px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider mt-0.5">Quiz</div>
                          </div>

                          {/* Assignment Count */}
                          <div className="bg-orange-50/80 dark:bg-orange-500/10 p-2.5 rounded-xl border border-orange-100/80 dark:border-orange-500/10 text-center">
                            <FileText className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 mx-auto mb-1" />
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{assignmentCount}</div>
                            <div className="text-[9px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider mt-0.5">Ödev</div>
                          </div>
                        </div>

                        {/* Lesson Progress Bar */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Ders İlerlemesi
                            </span>
                            <span className={`text-xs font-black ${progress >= 75 ? 'text-emerald-600 dark:text-emerald-400' : progress >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              %{progress}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${progress >= 75 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : progress >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500'}`}
                              style={{ width: `${Math.max(progress, 2)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                            {activeLessonCount} / {totalLessons} ders aktif
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Action Button */}
                <Link
                  href={`/admin/classes/${cls.id}`}
                  className="w-full py-3.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl flex items-center justify-center gap-2 hover:bg-kodrix-purple dark:hover:bg-amber-500 hover:text-white transition-all duration-300 font-bold shadow-lg shadow-gray-200 dark:shadow-none group-hover:scale-[1.02]"
                >
                  <span>Yönet</span>
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </div>
                </Link>
              </div>
            );
          })}

          {/* Empty State */}
          {classes?.length === 0 && (
            <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-gray-50/50 dark:bg-white/5">
              {error ? (
                <div>
                  <p className="text-red-500 font-bold text-lg mb-2">Veri yüklenirken hata oluştu 😕</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teknik detaylar için konsolu kontrol edin.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-4xl">
                    🏫
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz Sınıf Yok</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Eğitimlere başlamak için yukarıdaki formu kullanarak ilk sınıfınızı oluşturun.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}