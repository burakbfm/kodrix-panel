import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function QuizzesPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get class
    const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

    if (!classData) {
        notFound();
    }

    // Get class quizzes
    const { data: classQuizzes } = await supabase
        .from("class_quizzes")
        .select(`
      *,
      quiz:quizzes(
        id,
        title,
        description,
        time_limit_minutes,
        passing_score
      ),
      lesson:class_lessons(id, title, lesson_date)
    `)
        .eq("class_id", id)
        .order("created_at", { ascending: false });

    // Get all available quizzes not yet assigned
    const { data: availableQuizzes } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

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
            return;
        }

        revalidatePath(`/admin/classes/${id}/quizzes`);
        redirect(`/admin/classes/${id}/quizzes`);
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/admin/classes/${id}?tab=overview`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Sınıf Detayı
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Quiz Yönetimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {classData.name} sınıfı için quiz atayın ve yönetin
                </p>
            </div>

            {/* Assign New Quiz */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Quiz Ata
                </h2>
                <form action={assignQuiz} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Quiz Seç *
                            </label>
                            <select
                                name="quiz_id"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            >
                                <option value="">Seçiniz...</option>
                                {availableQuizzes?.map((quiz: any) => (
                                    <option key={quiz.id} value={quiz.id}>
                                        {quiz.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Ders (İsteğe Bağlı)
                            </label>
                            <select
                                name="lesson_id"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            >
                                <option value="">Seçiniz...</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Başlangıç Tarihi
                            </label>
                            <input
                                type="datetime-local"
                                name="start_date"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Bitiş Tarihi
                            </label>
                            <input
                                type="datetime-local"
                                name="end_date"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
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
                        <label htmlFor="is_active" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Öğrenciler görebilsin (aktif)
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Quiz Ata
                    </button>
                </form>
            </div>

            {/* Assigned Quizzes */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Atanmış Quizler
                </h2>

                {classQuizzes && classQuizzes.length > 0 ? (
                    <div className="grid gap-4">
                        {classQuizzes.map((cq: any) => (
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
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${cq.is_active
                                                        ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                    }`}
                                            >
                                                {cq.is_active ? "Aktif" : "Pasif"}
                                            </span>
                                        </div>

                                        {cq.quiz?.description && (
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                {cq.quiz.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            {cq.quiz?.time_limit_minutes && (
                                                <div>⏱️ {cq.quiz.time_limit_minutes} dakika</div>
                                            )}
                                            {cq.quiz?.passing_score && (
                                                <div>📊 Geçme notu: {cq.quiz.passing_score}</div>
                                            )}
                                            {cq.lesson && (
                                                <div>📚 {cq.lesson.title}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                        <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Henüz quiz atanmamış
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <Link
                    href={`/admin/quizzes/new`}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:shadow-lg transition font-semibold"
                >
                    Yeni Quiz Oluştur
                </Link>
            </div>
        </div>
    );
}
