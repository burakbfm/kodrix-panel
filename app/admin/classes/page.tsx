import { createClient } from "@/lib/supabase/server";
import { createClass } from "../actions";
import Link from "next/link";
import { BookOpen, Users, FileText, Plus, GraduationCap, UserCircle } from "lucide-react";
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
      )
    `)
    .order("created_at", { ascending: false });

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
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-kodrix-purple dark:text-amber-500" />
          Sınıf Yönetimi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sınıfları oluştur, düzenle ve ders ekle.
        </p>
      </div>

      {/* Create Class Form */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
          Yeni Sınıf Oluştur
        </h2>
        <div className="flex gap-4">
          <form action={createClass} className="flex-1 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="name"
                type="text"
                required
                placeholder="Örn: 12-A Sayısal veya Python Grubu"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple transition-all outline-none"
              />
            </div>
            <button className="bg-gradient-to-r from-kodrix-purple to-purple-800 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-kodrix-purple/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap">
              <Plus className="w-5 h-5" />
              Sınıf Ekle
            </button>
          </form>
        </div>
      </div>

      {/* Classes Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
          Mevcut Sınıflar
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
            {classes?.length || 0} Sınıf
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls: any) => {
            // Get active program and teacher info
            const activeProgram = cls.class_programs?.find((cp: any) => cp.is_active);
            const enrollmentCount = cls.enrollments?.[0]?.count || 0;

            return (
              <div
                key={cls.id}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden hover:border-kodrix-purple/30 dark:hover:border-amber-500/30"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-kodrix-purple to-purple-600 dark:from-amber-400 dark:to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition-colors pl-2">
                      {cls.name}
                    </h3>
                    <DeleteClassButton classId={cls.id} className={cls.name} />
                  </div>

                  {/* Program & Teacher Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    {activeProgram ? (
                      <>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <GraduationCap className="w-4 h-4 text-purple-500 dark:text-amber-500" />
                          <span className="font-medium">
                            {activeProgram.program?.title || "Program"}
                          </span>
                        </div>
                        {activeProgram.teacher && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <UserCircle className="w-4 h-4 text-blue-500" />
                            <span>{activeProgram.teacher.full_name}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-600 italic text-xs">
                        Henüz program atanmamış
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Student Count */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                      <div className="text-blue-600 dark:text-blue-400 text-xs mb-1 font-semibold">
                        Öğrenci
                      </div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" />
                        {enrollmentCount}
                      </div>
                    </div>

                    {/* Lesson Count - Placeholder for now */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 text-center">
                      <div className="text-green-600 dark:text-green-400 text-xs mb-1 font-semibold">
                        Program
                      </div>
                      <div className="text-xl font-bold text-green-700 dark:text-green-300 flex items-center justify-center gap-1">
                        <FileText className="w-4 h-4" />
                        {cls.class_programs?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/admin/classes/${cls.id}`}
                  className="w-full py-3 px-4 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                >
                  Yönet & Detaylar
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
            );
          })}

          {/* Empty State */}
          {classes?.length === 0 && (
            <div className="col-span-3 text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              {error ? (
                <div>
                  <p className="text-red-500 font-medium mb-1">Veri yüklenirken hata oluştu</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Console'da detayları kontrol edin</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Henüz hiç sınıf yok.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    Yukarıdaki formdan yeni bir tane oluştur.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}