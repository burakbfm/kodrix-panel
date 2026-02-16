import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft, Plus, Users, BookOpen, Calendar, Settings,
  Eye, EyeOff, ExternalLink, Trash2, FileText, Clock,
  Save, MessageSquare, Video, CheckCircle, XCircle, UserCheck, Edit,
  BookCopy, Folder
} from "lucide-react";
import LessonAttachments from "@/components/LessonAttachments";
import { RemoveProgramButton } from "@/components/RemoveProgramButton";
import ClassAssignments from "@/components/ClassAssignments";
import {
  createAssignment, deleteAssignment, removeStudent,
  removeProgram, assignQuiz, toggleLessonActive, updateLessonDetails
} from "@/app/admin/classes/class-actions";


import LessonToggleButton from "@/components/LessonToggleButton";
import DeleteQuizButton from "@/components/DeleteQuizButton";
import StudentAttendanceGrid from "@/components/StudentAttendanceGrid";
import StudentList from "@/components/StudentList";
import { SubmitButton } from "@/components/SubmitButton";
import ClassLessonsList from "@/components/ClassLessonsList";
import CreateAssignmentForm from "@/components/CreateAssignmentForm";

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
    .select(`
      *,
      source_lesson:lessons (
      attachments,
      meeting_link,
      video_url
      )
      `)
    .eq("class_id", id)
    .order("lesson_date", { ascending: true });



  // Fetch all attendance records for the class (for the grid)
  const { data: allAttendance } = await supabase
    .from("attendance")
    .select("student_id, lesson_id, status")
    .eq("class_id", id);
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



  // ... existing imports

  // Fetch assignments for this class
  const { data: classAssignments } = await supabase
    .from("class_assignments")
    .select("*")
    .eq("class_id", id)
    .order("created_at", { ascending: false });

  // For each assignment, count submissions (Keep this for stats cards)
  const assignmentsWithSubmissions = await Promise.all(
    (classAssignments || []).map(async (assignment) => {
      const { count } = await supabase
        .from("class_assignment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("assignment_id", assignment.id);

      return {
        ...assignment,
        submission_count: count || 0,
      };
    })
  );

  // Fetch class quizzes
  const { data: classQuizzes } = await supabase
    .from("class_quizzes")
    .select("*")
    .eq("class_id", id)
    .eq("is_active", true);

  // Fetch all assignment submissions for student stats
  const assignmentIds = classAssignments?.map(a => a.id) || [];
  let allAssignmentSubmissions: any[] = [];
  if (assignmentIds.length > 0) {
    const { data: submissions } = await supabase
      .from("class_assignment_submissions")
      .select("*")
      .in("assignment_id", assignmentIds);
    allAssignmentSubmissions = submissions || [];
  }

  // Fetch all quiz submissions for student stats
  const quizIds = classQuizzes?.map(q => q.id) || [];
  let allQuizSubmissions: any[] = [];
  if (quizIds.length > 0) {
    const { data: submissions } = await supabase
      .from("quiz_submissions")
      .select("*")
      .in("class_quiz_id", quizIds);
    allQuizSubmissions = submissions || [];
  }

  // Fetch all available quizzes for assignment dropdown
  const { data: availableQuizzes } = await supabase
    .from("quizzes")
    .select("id, title")
    .order("created_at", { ascending: false });

  const studentCount = students?.length || 0;
  const activeLessons = lessonsWithAttendance.filter((l) => l.is_active);

  // ============ STATS CALCULATION ============

  // 1. Attendance Rate
  const totalActiveLessons = activeLessons.length;
  let totalAttendancePercentage = 0;
  if (totalActiveLessons > 0 && studentCount > 0) {
    const totalPossibleAttendance = totalActiveLessons * studentCount;
    const totalActualAttendance = activeLessons.reduce((acc, lesson) => acc + lesson.attendance_count, 0);
    totalAttendancePercentage = Math.round((totalActualAttendance / totalPossibleAttendance) * 100);
  }

  // 2. Assignment Completion Rate
  const totalAssignments = assignmentsWithSubmissions.length;
  let assignmentCompletionRate = 0;
  if (totalAssignments > 0 && studentCount > 0) {
    const totalPossibleSubmissions = totalAssignments * studentCount;
    const totalActualSubmissions = assignmentsWithSubmissions.reduce((acc, assign) => acc + assign.submission_count, 0);
    assignmentCompletionRate = Math.round((totalActualSubmissions / totalPossibleSubmissions) * 100);
  }

  // 3. Quiz Completion Rate
  const activeQuizzes = classQuizzes || []; // Assuming only active fetched
  const totalQuizzes = activeQuizzes.length;
  let quizCompletionRate = 0;
  // We need quiz submission counts per quiz, but we only fetched allQuizSubmissions (flat list)
  // Let's approximate from flat list
  if (totalQuizzes > 0 && studentCount > 0) {
    const totalPossibleQuizSubmissions = totalQuizzes * studentCount;
    const totalActualQuizSubmissions = allQuizSubmissions.length; // Approximate, distinct student-quiz pairs ideally
    quizCompletionRate = Math.round((totalActualQuizSubmissions / totalPossibleQuizSubmissions) * 100);
  }

  // 4. Average Class Score (Assignments + Quizzes)
  let classAverageScore = 0;
  let totalGradedItems = 0;
  let sumScores = 0;

  // Assignments
  allAssignmentSubmissions.forEach((sub: any) => {
    if (sub.score !== null && sub.score !== undefined) {
      // Normalize if max score known? For now raw score.
      // Ideally should fetch max_score and normalize to 100.
      // Let's assume most are 100 or raw avg.
      sumScores += sub.score;
      totalGradedItems++;
    }
  });

  // Quizzes
  allQuizSubmissions.forEach((sub: any) => {
    if (sub.score !== null && sub.score !== undefined) {
      sumScores += sub.score;
      totalGradedItems++;
    }
  });

  classAverageScore = totalGradedItems > 0 ? Math.round(sumScores / totalGradedItems) : 0;



  // Assign quiz to class
  async function assignQuiz(formData: FormData) {
    "use server";
    const supabase = await createClient();

    const quizData = {
      class_id: id,
      quiz_id: formData.get("quiz_id") as string,
      lesson_id: (formData.get("lesson_id") as string) || null,
      is_active: formData.get("is_active") === "true",
      start_date: (formData.get("start_date") as string) || null,
      end_date: (formData.get("end_date") as string) || null,
    };

    const { error } = await supabase.from("class_quizzes").insert(quizData);

    if (error) {
      console.error("Quiz atama hatası:", error);
    }

    revalidatePath(`/admin/classes/${id}`);
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
    { key: "settings", label: "Ayarlar" },
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
                  <BookCopy className="w-4 h-4" /> {assignedProgram.program?.title}
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
              href={t.key === "settings" ? `/admin/classes/${id}/settings` : `/admin/classes/${id}?tab=${t.key}`}
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
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Student Count */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-24 h-24 text-kodrix-purple dark:text-amber-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Toplam Öğrenci</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{studentCount}</div>
                <Link href={`/admin/classes/${id}?tab=students`} className="text-xs text-kodrix-purple dark:text-amber-500 hover:underline mt-2 inline-block">Listeyi Görüntüle →</Link>
              </div>
            </div>

            {/* Active Lessons */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BookOpen className="w-24 h-24 text-green-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Aktif Dersler</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{activeLessons.length}</div>
                <div className="text-xs text-gray-500 mt-2">Toplam {lessonsWithAttendance.length} dersten</div>
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText className="w-24 h-24 text-blue-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Toplam Ödev</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{assignmentsWithSubmissions.length}</div>
                <Link href={`/admin/classes/${id}?tab=assignments`} className="text-xs text-blue-500 hover:underline mt-2 inline-block">Ödevleri Yönet →</Link>
              </div>
            </div>

            {/* Quizzes */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-24 h-24 text-orange-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Aktif Quizler</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{classQuizzes?.length || 0}</div>
                <Link href={`/admin/classes/${id}?tab=quizzes`} className="text-xs text-orange-500 hover:underline mt-2 inline-block">Quizleri Yönet →</Link>
              </div>
            </div>
          </div>

          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Attendance & Participation */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Katılım ve Devamlılık
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama Katılım Oranı</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalAttendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${totalAttendancePercentage >= 80 ? 'bg-green-500' : totalAttendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${totalAttendancePercentage}%` }}>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">En Yüksek Katılım</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {/* Logic to find highest attendance lesson could go here, simplifying for now */}
                      -%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Son Ders Katılımı</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {/* Logic for last lesson attendance */}
                      {lessonsWithAttendance[lessonsWithAttendance.length - 1]?.attendance_count || 0}/{studentCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Performance */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Akademik Performans
              </h3>

              <div className="space-y-6">
                {/* Assignment Completion */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ödev Tamamlama Oranı</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{assignmentCompletionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${assignmentCompletionRate}%` }}></div>
                  </div>
                </div>

                {/* Quiz Completion */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quiz Çözme Oranı</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{quizCompletionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${quizCompletionRate}%` }}></div>
                  </div>
                </div>

                {/* Average Score */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sınıf Genel Ortalaması</span>
                    <span className="text-2xl font-bold text-kodrix-purple dark:text-amber-500">{classAverageScore}</span>
                  </div>
                  <p className="text-xs text-gray-500">Ödev ve Quiz puanlarının ortalamasıdır.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teacher Info */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Atanan Öğretmen</h3>
              {teacherData ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center text-white dark:text-gray-900 font-bold text-xl">
                    {teacherData.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{teacherData.full_name}</p>
                    <p className="text-gray-600 dark:text-gray-400">{teacherData.email}</p>
                    <Link href={`./${id}/settings`} className="text-sm text-kodrix-purple dark:text-amber-500 hover:underline mt-1 inline-block">
                      Öğretmeni Değiştir
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <UserCheck className="w-6 h-6" />
                  <div>
                    <p className="font-medium">Henüz öğretmen atanmamış</p>
                    <Link
                      href={`/admin/classes/${id}/settings`}
                      className="text-sm text-kodrix-purple dark:text-amber-500 hover:underline"
                    >
                      Ayarlardan öğretmen ata →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Program */}
            {assignedProgram && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Müfredat Programı</h3>
                  <span className="px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold uppercase tracking-wider">
                    Aktif
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">{assignedProgram.program?.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {assignedProgram.program?.description || "Açıklama yok"}
                  </p>

                  <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-xs text-gray-500 block">Başlangıç</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {assignedProgram.start_date ? new Date(assignedProgram.start_date).toLocaleDateString("tr-TR") : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">İlerleme</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {Math.round((activeLessons.length / (lessonsWithAttendance.length || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <StudentList
              classId={id}
              students={students}
              classLessons={classLessons || []}
              classAssignments={classAssignments || []}
              classQuizzes={classQuizzes || []}
              allAttendance={allAttendance || []}
              allAssignmentSubmissions={allAssignmentSubmissions}
              allQuizSubmissions={allQuizSubmissions}
            />
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

          <ClassLessonsList
            classId={id}
            studentCount={studentCount}
            lessonsWithAttendance={lessonsWithAttendance}
          />
        </div>
      )}

      {/* ==================== ATTENDANCE TAB ==================== */}
      {
        activeTab === "attendance" && (
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
        )
      }

      {/* ==================== ASSIGNMENTS TAB ==================== */}
      {
        activeTab === "assignments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ödevler</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{assignmentsWithSubmissions.length} ödev</p>
              </div>
            </div>

            {/* Create Assignment Form */}
            <CreateAssignmentForm classId={id} />

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
        )
      }

      {/* ==================== QUIZZES TAB ==================== */}
      {
        activeTab === "quizzes" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quizler</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Sınıfa quiz atayın ve yönetin</p>
              </div>
              <Link
                href="/admin/quizzes"
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:shadow-md transition text-sm font-semibold flex items-center gap-2"
              >
                Quiz Kütüphanesine Git →
              </Link>
            </div>

            {/* Assign New Quiz Form */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Quiz Ata
              </h2>
              <form action={assignQuiz} className="space-y-4">
                <input type="hidden" name="class_id" value={id} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quiz Seç *</label>
                    <select
                      name="quiz_id"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                    >
                      <option value="">Seçiniz...</option>
                      {availableQuizzes?.map((quiz: any) => (
                        <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ders (İsteğe Bağlı)</label>
                    <select
                      name="lesson_id"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                    >
                      <option value="">Seçiniz...</option>
                      {activeLessons.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Başlangıç Tarihi</label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bitiş Tarihi</label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    value="true"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Öğrenciler görebilsin (aktif)</label>
                </div>

                <SubmitButton
                  className="px-6 py-2.5 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition font-semibold"
                  loadingText="Atanıyor..."
                >
                  <Plus className="w-5 h-5" />
                  Quiz Ata
                </SubmitButton>
              </form>
            </div>

            {/* Assigned Quizzes List */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Atanmış Quizler</h2>
              {classQuizzes && classQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classQuizzes.map((cq: any) => {
                    const isActive = cq.is_active;
                    const startDate = cq.start_date ? new Date(cq.start_date) : null;
                    const endDate = cq.end_date ? new Date(cq.end_date) : null;
                    const now = new Date();
                    const isStarted = startDate ? startDate <= now : true;
                    const isEnded = endDate ? endDate < now : false;

                    let statusBadge = null;
                    if (!isActive) {
                      statusBadge = <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">Pasif</span>;
                    } else if (isEnded) {
                      statusBadge = <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full font-medium">Süresi Doldu</span>;
                    } else if (!isStarted) {
                      statusBadge = <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-xs px-2 py-1 rounded-full font-medium">Başlamadı</span>;
                    } else {
                      statusBadge = <span className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">Aktif</span>;
                    }

                    return (
                      <div key={cq.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-kodrix-purple/10 dark:bg-amber-500/10 rounded-lg">
                              <FileText className="w-6 h-6 text-kodrix-purple dark:text-amber-500" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-gray-100">{cq.quiz?.title}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{cq.lesson ? `Ders: ${cq.lesson.title}` : "Genel Quiz"}</p>
                            </div>
                          </div>
                          {statusBadge}
                        </div>

                        {cq.quiz?.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{cq.quiz.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                          {startDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Bşl: {startDate.toLocaleDateString("tr-TR")}</span>
                            </div>
                          )}
                          {endDate && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Bit: {endDate.toLocaleDateString("tr-TR")}</span>
                            </div>
                          )}
                          {cq.quiz?.time_limit_minutes && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{cq.quiz.time_limit_minutes} dk</span>
                            </div>
                          )}
                          {cq.quiz?.passing_score && (
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Baraj: {cq.quiz.passing_score}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <Link
                            href={`/admin/classes/${id}/quizzes/${cq.id}`}
                            className="text-sm font-semibold text-kodrix-purple dark:text-amber-500 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Detaylar
                          </Link>

                          <DeleteQuizButton classQuizId={cq.id} classId={id} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center text-gray-500">
                  Henüz quiz atanmamış.
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
}