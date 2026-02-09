import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string; moduleId: string }>;
}

export default async function ModuleLessonsPage({ params }: PageProps) {
    const { id, moduleId } = await params;
    const supabase = await createClient();

    // Get module
    const { data: module } = await supabase
        .from("modules")
        .select("*, program:programs(*)")
        .eq("id", moduleId)
        .single();

    if (!module) {
        notFound();
    }

    // Get lessons
    const { data: lessons } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order", { ascending: true });

    async function addLesson(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const maxOrder = lessons && lessons.length > 0
            ? Math.max(...lessons.map(l => l.order || 0))
            : 0;

        const lessonData = {
            module_id: moduleId,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            content: formData.get("content") as string,
            duration_minutes: parseInt(formData.get("duration_minutes") as string) || null,
            order: maxOrder + 1,
        };

        const { error } = await supabase.from("lessons").insert(lessonData);

        if (error) {
            console.error("Ders ekleme hatası:", error);
            return;
        }

        revalidatePath(`/admin/programs/${id}/modules/${moduleId}`);
    }

    async function deleteLesson(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const lessonId = formData.get("lesson_id") as string;

        const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

        if (error) {
            console.error("Ders silme hatası:", error);
            return;
        }

        revalidatePath(`/admin/programs/${id}/modules/${moduleId}`);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href={`/admin/programs/${id}`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {module.program.title}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {module.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Modül derslerini yönetin
                </p>
            </div>

            {/* Add Lesson Form */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Yeni Ders Ekle
                </h2>
                <form action={addLesson} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ders Başlığı *
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="Örn: Değişkenler ve Veri Tipleri"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Kısa Açıklama
                        </label>
                        <textarea
                            name="description"
                            rows={2}
                            placeholder="Dersin kısa açıklaması..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ders İçeriği
                        </label>
                        <textarea
                            name="content"
                            rows={6}
                            placeholder="Ders içeriği, video linkler, materyaller..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none resize-none"
                        />
                    </div>

                    <div className="w-48">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Süre (Dakika)
                        </label>
                        <input
                            type="number"
                            name="duration_minutes"
                            min="1"
                            placeholder="45"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ders Ekle
                    </button>
                </form>
            </div>

            {/* Lessons List */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Dersler ({lessons?.length || 0})
                </h2>

                {lessons && lessons.length > 0 ? (
                    <div className="space-y-3">
                        {lessons.map((lesson: any, index: number) => (
                            <div
                                key={lesson.id}
                                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3 flex-1">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-kodrix-purple/10 dark:bg-amber-500/10 text-kodrix-purple dark:text-amber-500 font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                                                {lesson.title}
                                            </h3>
                                            {lesson.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {lesson.description}
                                                </p>
                                            )}
                                            {lesson.duration_minutes && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    ⏱️ {lesson.duration_minutes} dakika
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <form action={deleteLesson}>
                                        <input type="hidden" name="lesson_id" value={lesson.id} />
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
                            Bu modülde henüz ders yok
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
