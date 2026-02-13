import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Plus, Edit, Trash2, Layers } from "lucide-react";
import { revalidatePath } from "next/cache";
import ProgramCard from "./ProgramCard";

export default async function ProgramsPage() {
    const supabase = await createClient();

    // Delete program server action
    async function deleteProgram(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const programId = formData.get("program_id") as string;

        // Delete program (cascading deletes will handle modules and lessons)
        const { error } = await supabase
            .from("programs")
            .delete()
            .eq("id", programId);

        if (error) {
            console.error("Delete error:", error);
        }

        revalidatePath("/admin/programs");
    }

    // Fetch all programs with module and lesson counts
    const { data: programs } = await supabase
        .from("programs")
        .select(`
      *,
      modules:modules(count),
      created_by_profile:profiles!programs_created_by_fkey(id, full_name)
    `)
        .order("created_at", { ascending: false });

    // For each program, count lessons
    const programsWithCounts = await Promise.all(
        (programs || []).map(async (program) => {
            const { count: moduleCount } = await supabase
                .from("modules")
                .select("*", { count: "exact", head: true })
                .eq("program_id", program.id);

            // Get all module IDs for this program
            const moduleIds = await supabase
                .from("modules")
                .select("id")
                .eq("program_id", program.id)
                .then((res) => res.data?.map((m) => m.id) || []);

            const { count: lessonCount } = await supabase
                .from("lessons")
                .select("*", { count: "exact", head: true })
                .in("module_id", moduleIds);

            // Get total duration from all lessons
            const { data: lessons } = await supabase
                .from("lessons")
                .select("duration_minutes")
                .in("module_id", moduleIds);

            const totalDuration = lessons?.reduce(
                (sum, lesson) => sum + (lesson.duration_minutes || 0),
                0
            ) || 0;

            return {
                ...program,
                module_count: moduleCount || 0,
                lesson_count: lessonCount || 0,
                total_duration_minutes: totalDuration,
            };
        })
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Programlar
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Eğitim programlarını ve ders şablonlarını yönetin
                    </p>
                </div>
                <Link
                    href="/admin/programs/new"
                    className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Program
                </Link>
            </div>

            {/* Programs Grid */}
            {programsWithCounts && programsWithCounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programsWithCounts.map((program: any) => (
                        <ProgramCard
                            key={program.id}
                            program={program}
                            deleteAction={deleteProgram}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Henüz program eklenmemiş
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        İlk eğitim programınızı oluşturarak başlayın
                    </p>
                    <Link
                        href="/admin/programs/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Program Oluştur
                    </Link>
                </div>
            )}
        </div>
    );
}
