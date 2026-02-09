import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, BookOpen, Clock, Target, Edit } from "lucide-react";

export default async function QuizzesPage() {
    const supabase = await createClient();

    // Fetch all quizzes
    const { data: quizzes } = await supabase
        .from("quizzes")
        .select(`
      *,
      created_by_profile:profiles!quizzes_created_by_fkey(id, full_name),
      questions:quiz_questions(count)
    `)
        .order("created_at", { ascending: false });

    // Count questions for each quiz
    const quizzesWithCounts = await Promise.all(
        (quizzes || []).map(async (quiz) => {
            const { count: questionCount } = await supabase
                .from("quiz_questions")
                .select("*", { count: "exact", head: true })
                .eq("quiz_id", quiz.id);

            return {
                ...quiz,
                question_count: questionCount || 0,
            };
        })
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Quiz Kütüphanesi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Quizleri oluşturun ve yönetin
                    </p>
                </div>
                <Link
                    href="/admin/quizzes/new"
                    className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Quiz
                </Link>
            </div>

            {/* Quizzes Grid */}
            {quizzesWithCounts && quizzesWithCounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzesWithCounts.map((quiz: any) => {
                        const difficultyColors = {
                            easy: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
                            medium: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
                            hard: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
                        };

                        return (
                            <div
                                key={quiz.id}
                                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-white dark:text-gray-900" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/quizzes/${quiz.id}`}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                                            title="Düzenle"
                                        >
                                            <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        </Link>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {quiz.title}
                                </h3>

                                {quiz.description && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                        {quiz.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[quiz.difficulty as keyof typeof difficultyColors] ||
                                            difficultyColors.medium
                                            }`}
                                    >
                                        {quiz.difficulty === "easy"
                                            ? "Kolay"
                                            : quiz.difficulty === "hard"
                                                ? "Zor"
                                                : "Orta"}
                                    </span>

                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                        {quiz.question_count} Soru
                                    </span>

                                    {quiz.time_limit_minutes && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {quiz.time_limit_minutes} dk
                                        </span>
                                    )}

                                    {quiz.passing_score && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 flex items-center gap-1">
                                            <Target className="w-3 h-3" />
                                            {quiz.passing_score}%
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <Link
                                        href={`/admin/quizzes/${quiz.id}`}
                                        className="text-kodrix-purple dark:text-amber-500 hover:underline font-semibold text-sm"
                                    >
                                        Düzenle ve Detay →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Henüz quiz eklenmemiş
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        İlk quizinizi oluşturarak başlayın
                    </p>
                    <Link
                        href="/admin/quizzes/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Quiz Oluştur
                    </Link>
                </div>
            )}
        </div>
    );
}
