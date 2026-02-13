import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft, Plus, Users, BookOpen, Calendar, Settings,
  Eye, EyeOff, ExternalLink, Trash2, FileText, Clock,
  Save, MessageSquare, Video, CheckCircle, XCircle, UserCheck, Edit
} from "lucide-react";
import { RemoveProgramButton } from "@/components/RemoveProgramButton";
import ClassAssignments from "@/components/ClassAssignments";

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

  // Fetch enrolled students with profiles
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*")
    .eq("class_id", id);

  let students: any[] = [];
  if (enrollments && enrollments.length > 0) {
    const studentIds = enrollments.map((e) => e.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", studentIds);

    students = enrollments.map((enrollment) => ({
      ...enrollment,
      student: profiles?.find((p) => p.id === enrollment.user_id),
    }));
  }

  // Fetch assigned teacher
  let teacherData = null;
  if (classData.teacher_id) {
    const { data: teacher } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", classData.teacher_id)
      .single();
    teacherData = teacher;
  }

  // Fetch assigned program (tek program)
  const { data: assignedPrograms } = await supabase
    .from("class_programs")
    .select(`
      *,
      program:programs(id, title, description),
      teacher:profiles!class_programs_teacher_id_fkey(id, full_name)
    `)
    .eq("class_id", id);

  const assignedProgram = assignedPrograms?.[0] || null;

  // Fetch lessons for this class
  const { data: classLessons } = await supabase
    .from("class_lessons")
    .select("*")
    .eq("class_id", id)
    .order("lesson_date", { ascending: true });

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

  // Fetch assignments for this class
  const { data: classAssignments } = await supabase
    .from("class_assignments")
    .select("*")
    .eq("class_id", id)
    .order("created_at", { ascending: false });

  // For each assignment, count submissions
  const assignmentsWithSubmissions = await Promise.all(
    (classAssignments || []).map(async (assignment) => {
      const { count } = await supabase
        .from("assignment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("assignment_id", assignment.id);

      return {
        ...assignment,
        submission_count: count || 0,
      };
    })
  );

  const studentCount = students?.length || 0;
  const activeLessons = lessonsWithAttendance.filter((l) => l.is_active);

  // ============ SERVER ACTIONS ============

  // Toggle lesson active status
  async function toggleLessonActive(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const lessonId = formData.get("lesson_id") as string;
    const currentStatus = formData.get("current_status") === "true";

    await supabase
      .from("class_lessons")
      .update({ is_active: !currentStatus })
      .eq("id", lessonId);

    const classId = formData.get("class_id") as string;
    revalidatePath(`/admin/classes/${classId}`);
  }

  // Update lesson details (meeting link, notes, date)
  async function updateLessonDetails(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const lessonId = formData.get("lesson_id") as string;
    const classId = formData.get("class_id") as string;

    const updates: any = {};
    const meetingLink = formData.get("meeting_link");
    const teacherNotes = formData.get("teacher_notes");
    const lessonDate = formData.get("lesson_date");
    const lessonTime = formData.get("lesson_time");

    if (meetingLink !== null) updates.meeting_link = meetingLink || null;
    if (teacherNotes !== null) updates.teacher_notes = teacherNotes || null;
    if (lessonDate !== null) updates.lesson_date = lessonDate || null;
    if (lessonTime !== null) updates.lesson_time = lessonTime || null;

    await supabase
      .from("class_lessons")
      .update(updates)
      .eq("id", lessonId);

    revalidatePath(`/admin/classes/${classId}`);
  }

  // Remove student from class
  async function removeStudent(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const enrollmentId = formData.get("enrollment_id") as string;
    const classId = formData.get("class_id") as string;

    await supabase
      .from("enrollments")
      .delete()
      .eq("id", enrollmentId);

    revalidatePath(`/admin/classes/${classId}`);
  }

  // Remove program from class
  async function removeProgram(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const programId = formData.get("program_id") as string;
    const classId = formData.get("class_id") as string;

    // Delete all class_lessons first
    await supabase
      .from("class_lessons")
      .delete()
      .eq("class_id", classId);

    // Then remove the class_programs entry
    await supabase
      .from("class_programs")
      .delete()
      .eq("id", programId);

    revalidatePath(`/admin/classes/${classId}`);
  }

  // Create assignment inline
  async function createAssignment(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const classId = formData.get("class_id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dueDate = formData.get("due_date") as string;
    const startDate = formData.get("start_date") as string;
    const maxScore = parseInt(formData.get("max_score") as string) || 100;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("class_assignments")
      .insert({
        class_id: classId,
        title,
        description: description || null,
        due_date: dueDate || null,
        start_date: startDate || null,
        max_score: maxScore,
        created_by: user?.id,
      });

    revalidatePath(`/admin/classes/${classId}`);
  }

  // Delete assignment
  async function deleteAssignment(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const assignmentId = formData.get("assignment_id") as string;
    const classId = formData.get("class_id") as string;

    await supabase
      .from("class_assignments")
      .delete()
      .eq("id", assignmentId);

    revalidatePath(`/admin/classes/${classId}`);
  }

  // ============ TABS CONFIG ============
  const tabs = [
    { key: "overview", label: "Genel Bakış" },
    { key: "students", label: "Öğrenciler" },
    { key: "programs", label: "Program" },
    { key: "lessons", label: "Dersler" },
    { key: "attendance", label: "Yoklama" },
    { key: "assignments", label: "Ödevler" },
    { key: "quizzes", label: "Quizler" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-kodrix-purple dark:hover:text-amber-500 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Sınıflara Dön
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {classData.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {studentCount} öğrenci
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {activeLessons.length} aktif ders
              </span>
              {assignedProgram && (
                <span className="flex items-center gap-1">
                  📚 {assignedProgram.program?.title}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/admin/classes/${id}/settings`}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/classes/${id}?tab=${t.key}`}
              className={`px-5 py-3 font-semibold transition border-b-2 whitespace-nowrap ${activeTab === t.key
                ? "border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-3xl font-bold text-kodrix-purple dark:text-amber-500">{studentCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Öğrenci</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{activeLessons.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Aktif Ders</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{lessonsWithAttendance.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam Ders</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{assignmentsWithSubmissions.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ödev</div>
            </div>
          </div>

          {/* Teacher Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Atanan Öğretmen</h3>
            {teacherData ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center text-white dark:text-gray-900 font-bold text-lg">
                  {teacherData.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{teacherData.full_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{teacherData.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <UserCheck className="w-5 h-5" />
                <div>
                  <p className="text-sm">Henüz öğretmen atanmamış</p>
                  <Link
                    href={`/admin/classes/${id}/settings`}
                    className="text-xs text-kodrix-purple dark:text-amber-500 hover:underline"
                  >
                    Ayarlardan öğretmen ata →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/admin/classes/${id}?tab=programs`}
              className="bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 p-5 rounded-xl hover:shadow-lg transition-all"
            >
              <BookOpen className="w-7 h-7 mb-2" />
              <h3 className="text-lg font-bold">Program</h3>
              <p className="text-sm opacity-90">{assignedProgram ? assignedProgram.program?.title : "Program ata"}</p>
            </Link>
            <Link
              href={`/admin/classes/${id}?tab=students`}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 rounded-xl hover:shadow-lg transition-all"
            >
              <Users className="w-7 h-7 mb-2" />
              <h3 className="text-lg font-bold">Öğrenciler</h3>
              <p className="text-sm opacity-90">{studentCount} öğrenci kayıtlı</p>
            </Link>
            <Link
              href={`/admin/classes/${id}?tab=assignments`}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-xl hover:shadow-lg transition-all"
            >
              <FileText className="w-7 h-7 mb-2" />
              <h3 className="text-lg font-bold">Ödevler</h3>
              <p className="text-sm opacity-90">{assignmentsWithSubmissions.length} ödev</p>
            </Link>
          </div>

          {/* Recent Program */}
          {assignedProgram && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Atanmış Program</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{assignedProgram.program?.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Öğretmen: {assignedProgram.teacher?.full_name || "Atanmamış"}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold">
                  Aktif
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== STUDENTS TAB ==================== */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Öğrenciler</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{studentCount} kayıtlı öğrenci</p>
            </div>
            <Link
              href={`/admin/classes/${id}/add-students`}
              className="px-5 py-2.5 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Öğrenci Ekle
            </Link>
          </div>

          {students.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Öğrenci</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Okul No</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">E-posta</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Kayıt Tarihi</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {students.map((enrollment: any) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center font-bold text-white dark:text-gray-900 text-sm">
                            {enrollment.student?.full_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {enrollment.student?.full_name || "İsimsiz"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                        {enrollment.student?.school_number || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                        {enrollment.student?.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                        {enrollment.created_at
                          ? new Date(enrollment.created_at).toLocaleDateString("tr-TR")
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <form action={removeStudent}>
                          <input type="hidden" name="enrollment_id" value={enrollment.id} />
                          <input type="hidden" name="class_id" value={id} />
                          <button
                            type="submit"
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Öğrenciyi Çıkar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Henüz öğrenci yok</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Bu sınıfa öğrenci ekleyerek başlayın</p>
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
      )}

      {/* ==================== PROGRAMS TAB ==================== */}
      {activeTab === "programs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Program</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Bu sınıfa yalnızca bir program atanabilir. Dersler otomatik olarak programa göre tanımlanır.
              </p>
            </div>
            {!assignedProgram && (
              <Link
                href={`/admin/classes/${id}/assign-program`}
                className="px-5 py-2.5 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Program Ata
              </Link>
            )}
          </div>

          {assignedProgram ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {assignedProgram.program?.title || "Program"}
                  </h3>
                  {assignedProgram.program?.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{assignedProgram.program.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    Aktif
                  </span>
                  <RemoveProgramButton
                    programId={assignedProgram.id}
                    classId={id}
                    onRemove={removeProgram}
                  />
                  <Link
                    href={`/admin/classes/${id}/assign-program`}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="Programı Düzenle"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Öğretmen</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{assignedProgram.teacher?.full_name || "Atanmamış"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Ders</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{lessonsWithAttendance.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Başlangıç</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {assignedProgram.start_date ? new Date(assignedProgram.start_date).toLocaleDateString("tr-TR") : "-"}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  ℹ️ Bu programdaki dersler otomatik olarak sınıfa tanımlanmıştır. Dersler sekmesinden aktif edebilir, not ve link ekleyebilirsiniz.
                  Orijinal program yapısı değişmez.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Henüz program atanmamış</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bir program atadığınızda dersler otomatik olarak bu sınıfa kopyalanacak
              </p>
              <Link
                href={`/admin/classes/${id}/assign-program`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                Program Ata
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ==================== ASSIGNMENTS TAB ==================== */}
      {activeTab === "assignments" && (
        <ClassAssignments
          classId={id}
          assignments={assignmentsWithSubmissions as any[]}
        />
      )}

      {/* ==================== LESSONS TAB ==================== */}
      {activeTab === "lessons" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dersler</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Programdan gelen dersleri aktif edin, tarih girin, not ve link ekleyin. Orijinal program değişmez.
            </p>
          </div>

          {lessonsWithAttendance.length > 0 ? (
            <div className="space-y-4">
              {lessonsWithAttendance.map((lesson: any) => {
                const attendanceRate = studentCount > 0
                  ? (lesson.attendance_count / studentCount) * 100
                  : 0;

                return (
                  <div
                    key={lesson.id}
                    className={`bg-white dark:bg-gray-900 rounded-xl border p-6 transition ${lesson.is_active
                      ? "border-green-300 dark:border-green-700 shadow-sm"
                      : "border-gray-200 dark:border-gray-800 opacity-75"
                      }`}
                  >
                    {/* Lesson Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {lesson.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${lesson.is_active
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500"
                            }`}>
                            {lesson.is_active ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                        {lesson.module_name && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">📚 {lesson.module_name}</p>
                        )}
                        {lesson.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{lesson.description}</p>
                        )}
                      </div>

                      {/* Toggle Active Button */}
                      <form action={toggleLessonActive}>
                        <input type="hidden" name="lesson_id" value={lesson.id} />
                        <input type="hidden" name="class_id" value={id} />
                        <input type="hidden" name="current_status" value={String(lesson.is_active)} />
                        <button
                          type="submit"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${lesson.is_active
                            ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                            : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                            }`}
                        >
                          {lesson.is_active ? (
                            <><EyeOff className="w-4 h-4" /> Pasife Al</>
                          ) : (
                            <><Eye className="w-4 h-4" /> Aktif Et</>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Lesson Info & Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {/* Left: Attendance + Link */}
                      <div className="space-y-3">
                        {/* Attendance Badge */}
                        {lesson.is_active && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Katılım:</span>
                            <span className={`px-3 py-1 rounded-full text-white font-bold text-xs ${attendanceRate === 100 ? "bg-green-500" :
                              attendanceRate >= 75 ? "bg-yellow-500" :
                                attendanceRate >= 50 ? "bg-orange-500" : "bg-red-500"
                              }`}>
                              {lesson.attendance_count}/{studentCount} ({Math.round(attendanceRate)}%)
                            </span>
                            <Link
                              href={`/admin/classes/${id}/attendance/new?lesson_id=${lesson.id}`}
                              className="text-sm text-kodrix-purple dark:text-amber-500 hover:underline font-semibold"
                            >
                              Yoklama Al →
                            </Link>
                          </div>
                        )}

                        {/* Meeting Link Display */}
                        {lesson.meeting_link && (
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-500" />
                            <a
                              href={lesson.meeting_link}
                              target="_blank"
                              rel="noopener"
                              className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                            >
                              Toplantı Linki
                            </a>
                          </div>
                        )}

                        {/* Teacher Notes Display */}
                        {lesson.teacher_notes && (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.teacher_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Edit Controls */}
                      <form action={updateLessonDetails} className="space-y-2">
                        <input type="hidden" name="lesson_id" value={lesson.id} />
                        <input type="hidden" name="class_id" value={id} />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            name="lesson_date"
                            defaultValue={lesson.lesson_date || ""}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            placeholder="Tarih"
                          />
                          <input
                            type="time"
                            name="lesson_time"
                            defaultValue={lesson.lesson_time?.slice(0, 5) || ""}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            placeholder="Saat"
                          />
                        </div>
                        <input
                          type="url"
                          name="meeting_link"
                          defaultValue={lesson.meeting_link || ""}
                          placeholder="Toplantı linki (Zoom, Meet vb.)"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <textarea
                          name="teacher_notes"
                          defaultValue={lesson.teacher_notes || ""}
                          placeholder="Ders notu ekle..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                        />
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-4 py-2 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:shadow-md transition"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Kaydet
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Henüz ders yok</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Önce bir program atayın, dersler otomatik olarak tanımlanacak
              </p>
              <Link
                href={`/admin/classes/${id}?tab=programs`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                <BookOpen className="w-5 h-5" />
                Program Ata
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ==================== ATTENDANCE TAB ==================== */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Yoklama</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Ders bazında yoklama alın</p>
          </div>

          {activeLessons.length > 0 ? (
            <div className="space-y-3">
              {activeLessons.map((lesson: any) => {
                const attendanceRate = studentCount > 0
                  ? (lesson.attendance_count / studentCount) * 100
                  : 0;

                return (
                  <div key={lesson.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{lesson.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {lesson.lesson_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(lesson.lesson_date).toLocaleDateString("tr-TR")}
                          </span>
                        )}
                        <span>Katılım: {lesson.attendance_count}/{studentCount} ({Math.round(attendanceRate)}%)</span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/classes/${id}/attendance/new?lesson_id=${lesson.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm"
                    >
                      Yoklama Al
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Aktif ders yok</h3>
              <p className="text-gray-600 dark:text-gray-400">Yoklama almak için önce dersleri aktif edin</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== ASSIGNMENTS TAB ==================== */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ödevler</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{assignmentsWithSubmissions.length} ödev</p>
            </div>
          </div>

          {/* Create Assignment Form - Inline */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Yeni Ödev Oluştur
            </h3>
            <form action={createAssignment} className="space-y-4">
              <input type="hidden" name="class_id" value={id} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ödev Başlığı *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Örn: Hafta 1 - Proje Ödevi"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maksimum Puan</label>
                  <input
                    type="number"
                    name="max_score"
                    defaultValue={100}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Ödev detaylarını yazın..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bitiş Tarihi</label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ödev Oluştur
              </button>
            </form>
          </div>

          {/* Assignments List */}
          {assignmentsWithSubmissions.length > 0 ? (
            <div className="space-y-3">
              {assignmentsWithSubmissions.map((assignment: any) => {
                const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
                const isActive = assignment.start_date ? new Date(assignment.start_date) <= new Date() : true;

                return (
                  <div key={assignment.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100">{assignment.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isOverdue
                            ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                            : isActive
                              ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                              : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                            }`}>
                            {isOverdue ? "Süresi Doldu" : isActive ? "Aktif" : "Beklemede"}
                          </span>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                          {assignment.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Başlangıç: {new Date(assignment.start_date).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                          {assignment.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Bitiş: {new Date(assignment.due_date).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {assignment.submission_count} teslim / {studentCount} öğrenci
                          </span>
                          <span>Puan: {assignment.max_score}</span>
                        </div>
                      </div>
                      <form action={deleteAssignment}>
                        <input type="hidden" name="assignment_id" value={assignment.id} />
                        <input type="hidden" name="class_id" value={id} />
                        <button
                          type="submit"
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Ödevi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-500">Henüz ödev oluşturulmadı. Yukarıdaki formu kullanarak ilk ödevinizi oluşturun.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== QUIZZES TAB ==================== */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quizler</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Sınıfa quiz atayın</p>
            </div>
            <Link
              href="/admin/quizzes"
              className="px-5 py-2.5 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
            >
              Quiz Kütüphanesi →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quiz Sistemi</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Quiz kütüphanesinden quiz oluşturun ve bu sınıfa atayın
            </p>
            <Link
              href="/admin/quizzes"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Quiz Oluştur
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}