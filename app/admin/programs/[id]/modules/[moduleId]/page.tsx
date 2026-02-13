import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, Edit } from "lucide-react";
import { revalidatePath } from "next/cache";
import DeleteLessonButton from "./DeleteLessonButton";

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

    async function deleteLesson(formData: FormData) {
        "use server";
        const lessonId = formData.get("lesson_id") as string;
        console.log("🔥 Ders silme işlemi başladı (Admin Client):", lessonId);

        const supabase = createAdminClient();

        const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

        if (error) {
            console.error("❌ Ders silme veritabanı hatası:", error);
            return;
        }

        console.log("✅ Ders başarıyla silindi");
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

            {/* Add Lesson Button */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-dashed border-purple-300 dark:border-gray-700 p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Yeni Ders Ekle
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Ders linki, dosya ekleme ve detaylı içerik için detaylı forma gidin
                </p>
                <Link
                    href={`/admin/programs/${id}/modules/${moduleId}/lessons/new`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 font-bold text-lg"
                >
                    <Plus className="w-6 h-6" />
                    Ders Oluştur
                </Link>
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

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/programs/${id}/modules/${moduleId}/lessons/${lesson.id}/edit`}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                                            title="Düzenle"
                                        >
                                            <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        </Link>

                                        <DeleteLessonButton
                                            lessonId={lesson.id}
                                            lessonTitle={lesson.title}
                                            deleteAction={deleteLesson}
                                        />
                                    </div>
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
