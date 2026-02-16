import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, BookOpen, Clock, Target, Edit, BrainCircuit } from "lucide-react";
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
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-900 to-rose-900 dark:from-pink-950 dark:to-rose-950 p-10 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <BrainCircuit className="w-10 h-10 text-pink-200" />
                            Quiz Kütüphanesi
                        </h1>
                        <p className="text-pink-200 text-lg">
                            Öğrencilerinizi test etmek için quizler oluşturun ve yönetin.
                        </p>
                    </div>
                    <Link
                        href="/admin/quizzes/new"
                        className="px-8 py-4 bg-white text-pink-900 rounded-2xl hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Quiz
                    </Link>
                </div>
            </div>

            <QuizList quizzes={quizzesWithCounts as any[]} />
        </div>
    );
}
