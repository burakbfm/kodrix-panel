import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function StudentQuizzesPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Lütfen giriş yapın</div>;
    }

    // Get student's classes
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("class_id, classes(id, name)")
        .eq("user_id", user.id);

    const classIds = enrollments?.map(e => e.class_id) || [];

    // Get assigned quizzes for these classes
    const { data: classQuizzes } = await supabase
        .from("class_quizzes")
        .select(`
      *,
      quiz:quizzes(*),
      class:classes(id, name),
      lesson:class_lessons(id, title)
    `)
        .in("class_id", classIds)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    // For each quiz, check if student has submitted
    const quizzesWithStatus = await Promise.all(
        (classQuizzes || []).map(async (cq) => {
            const { data: submission } = await supabase
                .from("quiz_submissions")
                .select("*")
                .eq("class_quiz_id", cq.id)
                .eq("student_id", user.id)
                .single();

            const now = new Date();
            const endDate = cq.end_date ? new Date(cq.end_date) : null;
            const isExpired = endDate && now > endDate;

            return {
                ...cq,
                submission,
                is_expired: isExpired,
                status: submission
                    ? "completed"
                    : isExpired
                        ? "expired"
                        : "available",
            };
        })
    );

    // Group by class
    const quizzesByClass = quizzesWithStatus.reduce((acc: any, quiz) => {
        const className = quiz.class?.name || "Diğer";
        if (!acc[className]) {
            acc[className] = [];
        }
        acc[className].push(quiz);
        return acc;
    }, {});

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Quizlerim
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Atanmış quizleri görüntüleyin ve çözün
                </p>
            </div>

            {/* Quizzes by Class */}
            {Object.keys(quizzesByClass).length > 0 ? (
                Object.entries(quizzesByClass).map(([className, quizzes]: [string, any]) => (
                    <div key={className} className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {className}
                        </h2>

                        <div className="grid gap-4">
                            {quizzes.map((cq: any) => {
                                const statusColors = {
                                    available: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
                                    completed: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
                                    expired: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
                                };

                                return (
                                    <div
                                        key={cq.id}
                                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                        {cq.quiz?.title}
                                                    </h3>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[cq.status as keyof typeof statusColors]
                                                            }`}
                                                    >
                                                        {cq.status === "available"
                                                            ? "Çözülebilir"
                                                            : cq.status === "completed"
                                                                ? "Tamamlandı"
                                                                : "Süresi Doldu"}
                                                    </span>
                                                </div>

                                                {cq.quiz?.description && (
                                                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                        {cq.quiz.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    {cq.quiz?.time_limit_minutes && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {cq.quiz.time_limit_minutes} dakika
                                                        </div>
                                                    )}

                                                    {cq.end_date && (
                                                        <div>
                                                            Son: {new Date(cq.end_date).toLocaleString("tr-TR")}
                                                        </div>
                                                    )}

                                                    {cq.lesson && (
                                                        <div>📚 {cq.lesson.title}</div>
                                                    )}
                                                </div>

                                                {cq.submission && (
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                Puan:
                                                            </span>
                                                            <span className="px-3 py-1 rounded-full bg-blue-500 text-white font-bold">
                                                                {cq.submission.score}
                                                            </span>
                                                        </div>

                                                        {cq.submission.score >= (cq.quiz?.passing_score || 70) ? (
                                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Geçti
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                                                <XCircle className="w-4 h-4" />
                                                                Kaldı
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                {cq.status === "available" && (
                                                    <Link
                                                        href={`/student/quizzes/${cq.id}`}
                                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
                                                    >
                                                        Quiz'i Başlat
                                                    </Link>
                                                )}

                                                {cq.status === "completed" && (
                                                    <Link
                                                        href={`/student/quizzes/${cq.id}/results`}
                                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
                                                    >
                                                        Sonuçları Gör
                                                    </Link>
                                                )}

                                                {cq.status === "expired" && (
                                                    <button
                                                        disabled
                                                        className="px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed font-semibold"
                                                    >
                                                        Süresi Doldu
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Henüz quiz atanmamış
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Öğretmeniniz quiz atadığında burada görünecek
                    </p>
                </div>
            )}
        </div>
    );
}
