import { createClient, createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, Search } from "lucide-react";

export default async function QuizDetailsPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
    const supabase = await createClient();
    const { id: classId, quizId: classQuizId } = await params;

    // 1. Get Class Quiz Details
    const { data: classQuiz } = await supabase
        .from("class_quizzes")
        .select(`
    *,
    quiz: quizzes(*),
        class: classes(id, name)
        `)
        .eq("id", classQuizId)
        .single();

    if (!classQuiz) {
        return <div className="p-8 text-center">Quiz bulunamadı</div>;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // 2. Get All Students in Class
    const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("class_id", classId);

    let students: any[] = [];
    let profileError = null;

    if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map((e) => e.user_id);

        // Use Admin Client to bypass RLS for profiles if needed
        /*
        // Old implementation with regular client - kept for reference if admin client fails
        const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id, full_name, email") // avatar_url removed
            .in("id", studentIds);
        */
        const adminSupabase = await createAdminClient();
        const { data: profiles, error } = await adminSupabase
            .from("profiles")
            .select("id, full_name, email") // Removed avatar_url
            .in("id", studentIds);

        profileError = error;

        if (error) console.error("Profile Fetch Error:", error);
        console.log(`Debug Profiles found: `, profiles?.length);

        students = enrollments.map((enrollment) => {
            const profile = profiles?.find((p) => p.id === enrollment.user_id);
            return profile ? profile : null;
        }).filter(p => p !== null);
    }

    // 3. Get Student Submissions
    const { data: submissions } = await supabase
        .from("quiz_submissions")
        .select("*")
        .eq("class_quiz_id", classQuizId);

    // 4. Merge Data (Student + Submission)
    const studentResults = students.map((student: any) => {
        const submission = submissions?.find(s => s.student_id === student.id);
        const score = submission ? submission.score : null;
        const passed = score !== null && score >= (classQuiz.quiz.passing_score || 0);

        return {
            student,
            submission,
            score,
            passed,
            status: submission ? "completed" : "pending"
        };
    });

    // Sort: Completed first, then alphabetical
    studentResults.sort((a, b) => {
        if (a.status === b.status) {
            const nameA = a.student.full_name || a.student.email || "";
            const nameB = b.student.full_name || b.student.email || "";
            return nameA.localeCompare(nameB);
        }
        return a.status === "completed" ? -1 : 1;
    });

    const completedCount = studentResults.filter(r => r.status === "completed").length;
    const completionRate = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">


            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link
                        href={`/admin/classes/${classId}?tab=quizzes`}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Sınıfa Dön
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        {classQuiz.quiz.title}
                        <span className={`px - 3 py - 1 rounded - full text - sm font - medium ${classQuiz.is_active
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            } `}>
                            {classQuiz.is_active ? "Aktif" : "Pasif"}
                        </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                        {classQuiz.quiz.description}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-kodrix-purple dark:text-amber-500">{completionRate}%</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tamamlanma</div>
                    </div>
                    <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedCount}/{students.length}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Öğrenci</div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Süre Sınırı</div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {classQuiz.quiz.time_limit_minutes ? `${classQuiz.quiz.time_limit_minutes} dk` : "Sınırsız"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Geçme Notu</div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {classQuiz.quiz.passing_score || 0} Puan
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Bitiş Tarihi</div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {classQuiz.end_date ? new Date(classQuiz.end_date).toLocaleDateString("tr-TR") : "-"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Öğrenci Sonuçları</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Öğrenci ara..."
                            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-kodrix-purple w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Öğrenci</th>
                                <th className="px-6 py-3">Durum</th>
                                <th className="px-6 py-3">Puan</th>
                                <th className="px-6 py-3">Tamamlanma Zamanı</th>
                                <th className="px-6 py-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {studentResults.map((result, index) => (
                                <tr key={result.student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-kodrix-purple/10 dark:bg-amber-500/10 flex items-center justify-center text-kodrix-purple dark:text-amber-500 font-bold text-xs">
                                                {result.student.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {result.student.full_name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {result.status === "completed" ? (
                                            <span className={`inline - flex items - center gap - 1.5 px - 2.5 py - 0.5 rounded - full text - xs font - medium ${result.passed
                                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                                : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                                } `}>
                                                {result.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {result.passed ? "Geçti" : "Kaldı"}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                                                Tamamlanmadı
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {result.score !== null ? (
                                            <span className={`text - sm font - bold ${result.passed
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                                } `}>
                                                {result.score}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {result.submission?.submitted_at ? new Date(result.submission.submitted_at).toLocaleString("tr-TR") : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-sm font-medium">
                                            Detay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {studentResults.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                        Bu sınıfta kayıtlı öğrenci bulunmuyor.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
