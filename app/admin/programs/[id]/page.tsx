import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache"; // Import revalidatePath
import { ArrowLeft, Plus, BookOpen, GraduationCap, Layers, Clock, Edit } from "lucide-react";
import { DeleteProgramButton } from "@/components/DeleteProgramButton";
import { DeleteModuleButton } from "@/components/DeleteModuleButton";
import { DeleteLessonButton } from "@/components/DeleteLessonButton";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch program with all modules and lessons
    const { data: program, error: programError } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();

    if (programError || !program) {
        notFound();
    }

    // Fetch modules with lessons
    const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select(`
      *,
      lessons:lessons(*)
    `)
        .eq("program_id", id)
        .order("order", { ascending: true });

    const programWithModules = {
        ...program,
        modules: modules?.map(m => ({
            ...m,
            lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order) || []
        })) || []
    };

    async function addModule(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const moduleData = {
            program_id: id,
            title: formData.get("module_title") as string,
            description: formData.get("module_description") as string || null,
            order: parseInt(formData.get("module_order") as string) || 0,
        };

        await supabase.from("modules").insert([moduleData]);
        revalidatePath(`/admin/programs/${id}`); // REVALIDATE ADDED!
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
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {program.title}
                        </h1>
                        {program.description && (
                            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-3xl">
                                {program.description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/admin/programs/${id}/edit`}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            title="Programı Düzenle"
                        >
                            <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <DeleteProgramButton programId={id} />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-amber-500/10 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-purple-500 dark:text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {programWithModules.modules.length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Modül</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {programWithModules.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Ders</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {program.duration_weeks || '-'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Hafta</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {program.total_lessons || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Hedef Ders</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Module Form */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Yeni Modül Ekle
                </h3>
                <form action={addModule} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                name="module_title"
                                required
                                placeholder="Modül adı (örn: Programlamaya Giriş)"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                name="module_order"
                                min="0"
                                defaultValue={programWithModules.modules.length + 1}
                                placeholder="Sıra"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            name="module_description"
                            placeholder="Açıklama (isteğe bağlı)"
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Ekle
                        </button>
                    </div>
                </form>
            </div>

            {/* Modules List */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Modüller ve Dersler
                </h2>

                {programWithModules.modules.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                        <Layers className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Henüz modül yok
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Yukarıdaki formu kullanarak ilk modülünüzü ekleyin
                        </p>
                    </div>
                ) : (
                    programWithModules.modules.map((module: any, moduleIndex: number) => (
                        <div
                            key={module.id}
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                        >
                            {/* Module Header */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-purple-500 dark:bg-amber-500 text-white dark:text-gray-900 flex items-center justify-center font-bold text-lg">
                                            {module.order}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {module.title}
                                            </h3>
                                            {module.description && (
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                    {module.description}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                                {module.lessons.length} ders
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/programs/${id}/modules/${module.id}/lessons/new`}
                                            className="px-4 py-2 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2 text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Ders Ekle
                                        </Link>
                                        <Link
                                            href={`/admin/programs/${id}/modules/${module.id}/edit`}
                                            className="p-2 rounded-lg text-gray-400 hover:text-kodrix-purple dark:text-gray-500 dark:hover:text-amber-500 transition"
                                            title="Modülü Düzenle"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </Link>
                                        <DeleteModuleButton programId={id} moduleId={module.id} />
                                    </div>
                                </div>
                            </div>

                            {/* Lessons List */}
                            {module.lessons.length > 0 && (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {module.lessons.map((lesson: any) => (
                                        <Link
                                            key={lesson.id}
                                            href={`/admin/programs/${id}/modules/${module.id}/lessons/${lesson.id}`}
                                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                    {lesson.lesson_number}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition">
                                                        {lesson.title}
                                                    </h4>
                                                    {lesson.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                                            {lesson.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {lesson.meeting_link && (
                                                    <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                                                        Link var
                                                    </span>
                                                )}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {lesson.duration_minutes} dk
                                                </span>
                                                <DeleteLessonButton programId={id} lessonId={lesson.id} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
