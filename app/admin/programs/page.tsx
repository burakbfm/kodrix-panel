import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Plus, Edit, Trash2, Layers, BookMarked } from "lucide-react";
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
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 to-emerald-900 dark:from-teal-950 dark:to-emerald-950 p-10 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <BookMarked className="w-10 h-10 text-emerald-200" />
                            Programlar
                        </h1>
                        <p className="text-emerald-200 text-lg">
                            Eğitim programlarını ve ders şablonlarını yönetin.
                        </p>
                    </div>
                    <Link
                        href="/admin/programs/new"
                        className="px-8 py-4 bg-white text-emerald-900 rounded-2xl hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Program
                    </Link>
                </div>
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
                <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-gray-50/50 dark:bg-white/5">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz program eklenmemiş</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                        İlk eğitim programınızı oluşturarak müfredatınızı hazırlamaya başlayın.
                    </p>
                    <Link
                        href="/admin/programs/new"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-kodrix-purple to-purple-800 dark:from-amber-500 dark:to-orange-600 text-white dark:text-gray-900 rounded-2xl hover:shadow-lg transition-all font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        Program Oluştur
                    </Link>
                </div>
            )}
        </div>
    );
}
