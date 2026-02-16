import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Save, GripVertical } from "lucide-react";
import { revalidatePath } from "next/cache";
import DeleteModuleButton from "./DeleteModuleButton";
import DeleteLessonButton from "@/components/DeleteLessonButton";
import AddModuleForm from "./AddModuleForm";

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



    async function deleteModule(formData: FormData) {
        "use server";
        const moduleId = formData.get("module_id") as string;
        console.log("🔥 Silme işlemi başladı (Admin Client):", moduleId);

        const supabase = createAdminClient();

        // 1. Önce ders referanslarını kontrol et
        const { count, error: countError } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("module_id", moduleId);

        console.log("📚 Modüle ait ders sayısı:", count, "Hata:", countError);

        // 2. Dersleri sil
        const { error: lessonsError } = await supabase
            .from("lessons")
            .delete()
            .eq("module_id", moduleId);

        if (lessonsError) {
            console.error("❌ Ders silme hatası:", lessonsError);
            return;
        }
        console.log("✅ Dersler silindi");

        // 3. Modülü sil
        const { error: moduleError } = await supabase
            .from("modules")
            .delete()
            .eq("id", moduleId);

        if (moduleError) {
            console.error("❌ Modül silme hatası:", moduleError);
            return;
        }
        console.log("✅ Modül başarıyla silindi");

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

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Modül</div>
                    <div className="text-3xl font-bold text-kodrix-purple dark:text-amber-500">{modules?.length || 0}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Ders</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {modules?.reduce((total, m) => total + (m.lessons?.length || 0), 0) || 0}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Süre</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {modules?.reduce((total, m) => total + (m.lessons?.reduce((sum: number, l: any) => sum + (l.duration_minutes || 0), 0) || 0), 0) || 0} dk
                    </div>
                </div>
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition font-semibold shadow-md shadow-kodrix-purple/20"
                    >
                        <Save className="w-4 h-4" />
                        Kaydet
                    </button>
                </div>
            </form>

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* Modules Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <span className="bg-purple-100 dark:bg-amber-900/20 text-kodrix-purple dark:text-amber-500 p-2 rounded-lg">
                            <BookOpen className="w-6 h-6" />
                        </span>
                        Modüller ve Dersler
                    </h2>
                </div>

                {/* Add Module Form */}
                {/* Add Module Form */}
                <AddModuleForm programId={id} />

                {/* Modules List */}
                <div className="space-y-6">
                    {modules?.map((module: any) => (
                        <div
                            key={module.id}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            {/* Module Header */}
                            <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                            {module.title}
                                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-full">
                                                {module.lessons?.length || 0} Ders
                                            </span>
                                        </h3>
                                        {module.description && (
                                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                                                {module.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Actions */}
                                    <Link
                                        href={`/admin/programs/${id}/modules/${module.id}/edit`}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-500 hover:text-kodrix-purple dark:text-gray-400 dark:hover:text-amber-500"
                                        title="Düzenle"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>

                                    <DeleteModuleButton
                                        moduleId={module.id}
                                        moduleTitle={module.title}
                                        deleteAction={deleteModule}
                                    />
                                </div>
                            </div>      {/* Lessons List in Module */}
                            <div className="p-4 bg-white dark:bg-gray-900">
                                {module.lessons && module.lessons.length > 0 ? (
                                    <div className="space-y-2">
                                        {module.lessons
                                            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                                            .map((lesson: any) => (
                                                <div
                                                    key={lesson.id}
                                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                                            {lesson.lesson_number}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition-colors">
                                                                {lesson.title}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                                <span>{lesson.duration_minutes} dk</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/admin/lessons/${lesson.id}/edit`}
                                                            className="p-2 text-gray-400 hover:text-kodrix-purple dark:hover:text-amber-500 hover:bg-purple-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                                                            title="Düzenle"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <DeleteLessonButton
                                                            lessonId={lesson.id}
                                                            programId={id}
                                                            lessonTitle={lesson.title}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        Bu modülde henüz ders yok
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-center">
                                    <Link
                                        href={`/admin/lessons/new?moduleId=${module.id}&programId=${id}`}
                                        className="text-sm font-medium text-kodrix-purple dark:text-amber-500 hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Ders Ekle
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
