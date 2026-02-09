import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Save, GripVertical } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get program
    const { data: program } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();

    if (!program) {
        notFound();
    }

    // Get modules with lessons
    const { data: modules } = await supabase
        .from("modules")
        .select(`
      *,
      lessons:lessons(*)
    `)
        .eq("program_id", id)
        .order("order", { ascending: true });

    async function updateProgram(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const updates = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            duration_weeks: parseInt(formData.get("duration_weeks") as string) || null,
        };

        const { error } = await supabase
            .from("programs")
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error("Program güncelleme hatası:", error);
            return;
        }

        revalidatePath(`/admin/programs/${id}`);
    }

    async function addModule(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const maxOrder = modules && modules.length > 0
            ? Math.max(...modules.map(m => m.order || 0))
            : 0;

        const moduleData = {
            program_id: id,
            title: formData.get("module_title") as string,
            description: formData.get("module_description") as string,
            order: maxOrder + 1,
        };

        const { error } = await supabase.from("modules").insert(moduleData);

        if (error) {
            console.error("Modül ekleme hatası:", error);
            return;
        }

        revalidatePath(`/admin/programs/${id}`);
    }

    async function deleteModule(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const moduleId = formData.get("module_id") as string;

        // First delete all lessons in the module
        await supabase.from("lessons").delete().eq("module_id", moduleId);

        // Then delete the module
        const { error } = await supabase.from("modules").delete().eq("id", moduleId);

        if (error) {
            console.error("Modül silme hatası:", error);
            return;
        }

        revalidatePath(`/admin/programs/${id}`);
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/admin/programs"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Programlar
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {program.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Program detaylarını düzenleyin ve modüller ekleyin
                </p>
            </div>

            {/* Program Info Form */}
            <form action={updateProgram} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Program Bilgileri
                </h2>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Program Adı *
                    </label>
                    <input
                        type="text"
                        name="title"
                        required
                        defaultValue={program.title}
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
                        defaultValue={program.description || ""}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none resize-none"
                    />
                </div>

                <div className="w-48">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Süre (Hafta)
                    </label>
                    <input
                        type="number"
                        name="duration_weeks"
                        min="1"
                        defaultValue={program.duration_weeks || ""}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                    />
                </div>

                <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    Kaydet
                </button>
            </form>

            {/* Add Module Form */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Yeni Modül Ekle
                </h2>
                <form action={addModule} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Modül Adı *
                            </label>
                            <input
                                type="text"
                                name="module_title"
                                required
                                placeholder="Örn: Python Temelleri"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Açıklama
                            </label>
                            <input
                                type="text"
                                name="module_description"
                                placeholder="Modül açıklaması..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Modül Ekle
                    </button>
                </form>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Modüller ve Dersler
                </h2>

                {modules && modules.length > 0 ? (
                    modules.map((module: any, moduleIndex) => (
                        <div
                            key={module.id}
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-kodrix-purple/10 dark:bg-amber-500/10 text-kodrix-purple dark:text-amber-500 font-bold">
                                        {moduleIndex + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {module.title}
                                        </h3>
                                        {module.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {module.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/programs/${id}/modules/${module.id}`}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold flex items-center gap-2"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Dersler
                                    </Link>

                                    <form action={deleteModule}>
                                        <input type="hidden" name="module_id" value={module.id} />
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

                            {/* Lessons List */}
                            {module.lessons && module.lessons.length > 0 ? (
                                <div className="mt-4 space-y-2 pl-11">
                                    {module.lessons.map((lesson: any, lessonIndex: number) => (
                                        <div
                                            key={lesson.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                {lessonIndex + 1}.
                                            </span>
                                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                                {lesson.title}
                                            </span>
                                            {lesson.duration_minutes && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                                    {lesson.duration_minutes} dk
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 pl-11 mt-2">
                                    Bu modülde henüz ders yok
                                </p>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                        <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Henüz modül eklenmemiş
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
