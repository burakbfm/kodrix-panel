import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function NewQuizPage() {
    const supabase = await createClient();

    async function createQuiz(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            redirect("/login");
        }

        const quizData = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            time_limit_minutes: parseInt(formData.get("time_limit_minutes") as string) || null,
            passing_score: parseInt(formData.get("passing_score") as string) || 70,
            show_correct_answers: formData.get("show_correct_answers") === "true",
            shuffle_questions: formData.get("shuffle_questions") === "true",
            shuffle_answers: formData.get("shuffle_answers") === "true",
            difficulty: formData.get("difficulty") as string || "medium",
            created_by: user.id,
        };

        const { data, error } = await supabase
            .from("quizzes")
            .insert(quizData)
            .select()
            .single();

        if (error) {
            console.error("Quiz oluşturma hatası:", error);
            return;
        }

        revalidatePath("/admin/quizzes");
        redirect(`/admin/quizzes/${data.id}`);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
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
                    Yeni Quiz Oluştur
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Quiz oluşturun, sonra soru ekleyin
                </p>
            </div>

            {/* Form */}
            <form action={createQuiz} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
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
                            placeholder="Örn: Python Temelleri Quiz"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Quiz hakkında açıklama..."
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
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            >
                                <option value="easy">Kolay</option>
                                <option value="medium" selected>Orta</option>
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
                                placeholder="İsteğe bağlı"
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
                                defaultValue="70"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="show_correct_answers"
                                name="show_correct_answers"
                                value="true"
                                defaultChecked
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                            />
                            <label htmlFor="show_correct_answers" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Doğru cevapları sonuçta göster
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="shuffle_questions"
                                name="shuffle_questions"
                                value="true"
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                            />
                            <label htmlFor="shuffle_questions" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Soruları karıştır
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="shuffle_answers"
                                name="shuffle_answers"
                                value="true"
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                            />
                            <label htmlFor="shuffle_answers" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Cevapları karıştır
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/admin/quizzes"
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Quiz Oluştur ve Soru Ekle
                    </button>
                </div>
            </form>
        </div>
    );
}
