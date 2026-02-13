import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, BookOpen, Clock, Target, Edit } from "lucide-react";
import DeleteQuizButton from "./DeleteQuizButton";
import QuizList from "./QuizList";

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

            <QuizList quizzes={quizzesWithCounts as any[]} />
        </div>
    );
}
