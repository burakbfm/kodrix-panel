import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, BookOpen, Calendar, BarChart3, Settings } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ClassDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab || "overview";

  const supabase = await createClient();

  // Fetch class details
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .single();

  if (classError || !classData) {
    notFound();
  }
  // Fetch enrolled students - simple approach without joins
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*")
    .eq("class_id", id);

  // Fetch student profiles separately
  let students: any[] = [];
  if (enrollments && enrollments.length > 0) {
    const studentIds = enrollments.map((e) => e.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", studentIds);

    // Combine enrollment with profile data
    students = enrollments.map((enrollment) => ({
      ...enrollment,
      student: profiles?.find((p) => p.id === enrollment.user_id),
    }));
  }

  // Fetch assigned programs
  const { data: assignedPrograms } = await supabase
    .from("class_programs")
    .select(`
      *,
      program:programs(id, title, description),
      teacher:profiles!class_programs_teacher_id_fkey(id, full_name)
    `)
    .eq("class_id", id);

  // Fetch lessons for this class
  const { data: classLessons } = await supabase
    .from("class_lessons")
    .select("*")
    .eq("class_id", id)
    .order("lesson_date", { ascending: false });

  // For each lesson, fetch attendance count
  const lessonsWithAttendance = await Promise.all(
    (classLessons || []).map(async (lesson) => {
      const { count } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("lesson_id", lesson.id)
        .eq("status", "present");

      return {
        ...lesson,
        attendance_count: count || 0,
      };
    })
  );

  // Count stats
  const studentCount = students?.length || 0;
  const programCount = assignedPrograms?.length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Sınıflar
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {classData.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sınıf yönetimi, program ataması ve yoklama takibi
            </p>
          </div>
          <Link
            href={`/admin/classes/${id}/settings`}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            title="Sınıf Ayarları"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {studentCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Kayıtlı Öğrenci</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-amber-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-500 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {programCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Atanmış Program</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                -
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">İşlenen Ders</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                -
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Devamsızlık %</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
        <nav className="flex gap-2">
          <Link
            href={`/admin/classes/${id}?tab=overview`}
            className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === "overview"
              ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
          >
            Genel Bakış
          </Link>
          <Link
            href={`/admin/classes/${id}?tab=students`}
            className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === "students"
              ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
          >
            Öğrenciler
          </Link>
          <Link
            href={`/admin/classes/${id}?tab=attendance`}
            className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === "attendance"
              ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
          >
            Yoklama
          </Link>
          <Link
            href={`/admin/classes/${id}?tab=programs`}
            className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === "programs"
              ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
          >
            Program
          </Link>
          <Link
            href={`/admin/classes/${id}?tab=lessons`}
            className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === "lessons"
              ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
          >
            Dersler
          </Link>
          <Link
            href={`/admin/classes/${id}?tab=quizzes`}
            className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === "quizzes"
              ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
          >
            Quizler
          </Link>
          <Link
            href={`/admin/classes/${id}?tab=assignments`}
            className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === "assignments"
              ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
          >
            Ödevler
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      {
        activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href={`/admin/classes/${id}?tab=programs`}
                className="bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 p-6 rounded-xl hover:shadow-lg transition-all group"
              >
                <BookOpen className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-bold mb-2">Program Ata</h3>
                <p className="opacity-90">Sınıfa eğitim programı ekle</p>
              </Link>

              <Link
                href={`/admin/classes/${id}?tab=students`}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:shadow-lg transition-all group"
              >
                <Users className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-bold mb-2">Öğrenci Yönetimi</h3>
                <p className="opacity-90">Öğrenci ekle veya çıkar</p>
              </Link>
            </div>

            {/* Recent Programs */}
            {assignedPrograms && assignedPrograms.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Atanmış Programlar
                </h3>
                <div className="space-y-3">
                  {assignedPrograms.slice(0, 3).map((cp: any) => (
                    <div
                      key={cp.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {cp.program?.title || "Program"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Öğretmen: {cp.teacher?.full_name || "Atanmamış"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${cp.is_active
                          ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                      >
                        {cp.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Students */}
            {students && students.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Son Eklenen Öğrenciler
                </h3>
                <div className="space-y-3">
                  {students.slice(0, 5).map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-600 dark:text-gray-400">
                        {enrollment.student?.full_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {enrollment.student?.full_name || "İsimsiz"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {enrollment.student?.school_number || enrollment.student?.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      {
        activeTab === "programs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Atanmış Programlar
              </h2>
              <Link
                href={`/admin/classes/${id}/assign-program`}
                className="px-4 py-2 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Program Ata
              </Link>
            </div>

            {assignedPrograms && assignedPrograms.length > 0 ? (
              <div className="grid gap-6">
                {assignedPrograms.map((cp: any) => (
                  <div
                    key={cp.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {cp.program?.title || "Program"}
                        </h3>
                        {cp.program?.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {cp.program.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${cp.is_active
                          ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                      >
                        {cp.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Öğretmen</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {cp.teacher?.full_name || "Atanmamış"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Başlangıç</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {cp.start_date
                            ? new Date(cp.start_date).toLocaleDateString("tr-TR")
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Henüz program atanmamış
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Bu sınıfa eğitim programı atayarak başlayın
                </p>
                <Link
                  href={`/admin/classes/${id}/assign-program`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  İlk Programı Ata
                </Link>
              </div>
            )}
          </div>
        )
      }

      {/* Lessons Tab */}
      {
        activeTab === "lessons" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Sınıf Dersleri
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Derslerinizi yönetin, yoklama alın ve içerik ekleyin
                </p>
              </div>
              <Link
                href={`/admin/classes/${id}/lessons/new`}
                className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Yeni Ders Ekle
              </Link>
            </div>

            {lessonsWithAttendance && lessonsWithAttendance.length > 0 ? (
              <div className="grid gap-4">
                {lessonsWithAttendance.map((lesson: any) => {
                  const attendanceRate = studentCount > 0
                    ? (lesson.attendance_count / studentCount) * 100
                    : 0;

                  let rateColor = 'bg-red-500';
                  if (attendanceRate === 100) rateColor = 'bg-green-500';
                  else if (attendanceRate >= 75) rateColor = 'bg-yellow-500';
                  else if (attendanceRate >= 50) rateColor = 'bg-orange-500';

                  return (
                    <div
                      key={lesson.id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {lesson.title}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${lesson.is_active
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                }`}
                            >
                              {lesson.is_active ? "Aktif" : "Pasif"}
                            </span>
                          </div>

                          {lesson.module_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              📚 {lesson.module_name}
                            </p>
                          )}

                          {lesson.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {lesson.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {new Date(lesson.lesson_date).toLocaleDateString("tr-TR")}
                              {lesson.lesson_time && ` - ${lesson.lesson_time.slice(0, 5)}`}
                            </div>

                            {lesson.duration_minutes && (
                              <div className="text-gray-600 dark:text-gray-400">
                                ⏱️ {lesson.duration_minutes} dk
                              </div>
                            )}

                            {/* Attendance Rate Badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Katılım:
                              </span>
                              <span className={`px-3 py-1 rounded-full text-white font-bold text-sm ${rateColor}`}>
                                {lesson.attendance_count}/{studentCount}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                ({Math.round(attendanceRate)}%)
                              </span>
                            </div>

                            {lesson.meeting_link && (
                              <Link
                                href={lesson.meeting_link}
                                target="_blank"
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                🔗 Toplantı Linki
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/admin/classes/${id}/attendance/new?lesson_id=${lesson.id}`}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm"
                          >
                            Yoklama Al
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Henüz ders eklenmemiş
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  İlk dersinizi ekleyerek başlayın
                </p>
                <Link
                  href={`/admin/classes/${id}/lessons/new`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  <BookOpen className="w-5 h-5" />
                  Ders Ekle
                </Link>
              </div>
            )}
          </div>
        )
      }

      {
        activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Kayıtlı Öğrenciler ({studentCount})
              </h2>
              <Link
                href={`/admin/classes/${id}/add-students`}
                className="px-4 py-2 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Öğrenci Ekle
              </Link>
            </div>

            {students && students.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Öğrenci
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Okul No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Kayıt Tarihi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map((enrollment: any) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-600 dark:text-gray-400">
                              {enrollment.student?.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {enrollment.student?.full_name || "İsimsiz"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {enrollment.student?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                          {enrollment.student?.school_number || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                          {enrollment.created_at
                            ? new Date(enrollment.created_at).toLocaleDateString("tr-TR")
                            : "Tarih yok"}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/students/${enrollment.student?.id}`}
                            className="text-kodrix-purple dark:text-amber-500 hover:underline font-semibold"
                          >
                            Detay
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Henüz öğrenci yok
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Bu sınıfa öğrenci ekleyerek başlayın
                </p>
                <Link
                  href={`/admin/classes/${id}/add-students`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  İlk Öğrenciyi Ekle
                </Link>
              </div>
            )}
          </div>
        )
      }

      {
        activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Yoklama Sistemi
              </h2>
              <Link
                href={`/admin/classes/${id}/attendance/new`}
                className="px-4 py-2 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Yoklama Al
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Yoklama sistemi yakında aktif olacak
              </h3>
            </div>
          </div>
        )
      }

      {/* Quizzes Tab */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Quizler
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Sınıfa quiz atayın ve sonuçları görüntüleyin
              </p>
            </div>
            <Link
              href={`/admin/classes/${id}/quizzes`}
              className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
            >
              Quiz Yönetimi
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Quiz yönetimi sayfasına gidin
            </p>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Ödevler
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ödev oluşturun ve öğrenci teslimlerini değerlendirin
              </p>
            </div>
            <Link
              href={`/admin/classes/${id}/assignments`}
              className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
            >
              Ödev Yönetimi
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Ödev yönetimi sayfasına gidin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}