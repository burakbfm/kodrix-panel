import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, Image as ImageIcon, Check } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

import QuizQuestionForm from "../QuizQuestionForm";
import Image from "next/image";

// ... imports remain the same, ensure Image is imported if not already

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function QuizDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get quiz
    const { data: quiz } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

    if (!quiz) {
        notFound();
    }

    // Get questions with answers
    const { data: questions } = await supabase
        .from("quiz_questions")
        .select(`
      *,
      answers:quiz_answers(*)
    `)
        .eq("quiz_id", id)
        .order("order_index", { ascending: true });

    async function updateQuiz(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const updates = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            time_limit_minutes: parseInt(formData.get("time_limit_minutes") as string) || null,
            passing_score: parseInt(formData.get("passing_score") as string) || 70,
            difficulty: formData.get("difficulty") as string,
            show_correct_answers: formData.get("show_correct_answers") === "true",
            shuffle_questions: formData.get("shuffle_questions") === "true",
            shuffle_answers: formData.get("shuffle_answers") === "true",
        };

        const { error } = await supabase
            .from("quizzes")
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error("Quiz güncelleme hatası:", error);
            return;
        }

        revalidatePath(`/admin/quizzes/${id}`);
    }

    async function deleteQuestion(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const questionId = formData.get("question_id") as string;

        // Delete answers first
        await supabase.from("quiz_answers").delete().eq("question_id", questionId);

        // Delete question
        const { error } = await supabase
            .from("quiz_questions")
            .delete()
            .eq("id", questionId);

        if (error) {
            console.error("Soru silme hatası:", error);
            return;
        }

        revalidatePath(`/admin/quizzes/${id}`);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/admin/quizzes"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quizler
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {quiz.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Quiz detaylarını düzenleyin ve soru ekleyin
                </p>
            </div>

            {/* Quiz Settings Form */}
            <form action={updateQuiz} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Quiz Ayarları
                </h2>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Quiz Başlığı *
                    </label>
                    <input
                        type="text"
                        name="title"
                        required
                        defaultValue={quiz.title}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Açıklama
                    </label>
                    <textarea
                        name="description"
                        rows={2}
                        defaultValue={quiz.description || ""}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none resize-none"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Zorluk
                        </label>
                        <select
                            name="difficulty"
                            defaultValue={quiz.difficulty}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                        >
                            <option value="easy">Kolay</option>
                            <option value="medium">Orta</option>
                            <option value="hard">Zor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Süre (Dakika)
                        </label>
                        <input
                            type="number"
                            name="time_limit_minutes"
                            min="1"
                            defaultValue={quiz.time_limit_minutes || ""}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Geçme Notu (%)
                        </label>
                        <input
                            type="number"
                            name="passing_score"
                            min="0"
                            max="100"
                            defaultValue={quiz.passing_score}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="show_correct_answers"
                            value="true"
                            defaultChecked={quiz.show_correct_answers}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                        />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Doğru cevapları göster
                        </span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="shuffle_questions"
                            value="true"
                            defaultChecked={quiz.shuffle_questions}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                        />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Soruları karıştır
                        </span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="shuffle_answers"
                            value="true"
                            defaultChecked={quiz.shuffle_answers}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                        />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Cevapları karıştır
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    Kaydet
                </button>
            </form>

            <QuizQuestionForm quizId={id} />

            {/* Questions List */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Sorular ({questions?.length || 0})
                </h2>

                {questions && questions.length > 0 ? (
                    <div className="space-y-4">
                        {questions.map((question: any, index: number) => (
                            <div
                                key={question.id}
                                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-3 flex-1">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-kodrix-purple/10 dark:bg-amber-500/10 text-kodrix-purple dark:text-amber-500 font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                                {question.question_text}
                                            </p>

                                            {question.image_url && (
                                                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                                                    <Image
                                                        src={question.image_url}
                                                        alt="Soru görseli"
                                                        fill
                                                        className="object-contain bg-gray-50 dark:bg-gray-800"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2 mb-3">
                                                {question.answers?.map((answer: any, answerIndex: number) => (
                                                    <div
                                                        key={answer.id}
                                                        className={`flex items-center gap-4 p-3 rounded-lg ${answer.is_correct
                                                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                                            : "bg-gray-50 dark:bg-gray-800"
                                                            }`}
                                                    >
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                            {String.fromCharCode(65 + answerIndex)}.
                                                        </span>

                                                        {answer.image_url && (
                                                            <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                                                                <Image
                                                                    src={answer.image_url}
                                                                    alt="Cevap görseli"
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        )}

                                                        <span className="text-gray-900 dark:text-gray-100">
                                                            {answer.answer_text}
                                                        </span>

                                                        {answer.is_correct && (
                                                            <span className="ml-auto text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                                                                <Check className="w-4 h-4" />
                                                                Doğru
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {question.points} puan
                                            </div>
                                        </div>
                                    </div>

                                    <form action={deleteQuestion}>
                                        <input type="hidden" name="question_id" value={question.id} />
                                        <button
                                            type="submit"
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Henüz soru eklenmemiş
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
