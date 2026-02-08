import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, GraduationCap, BookOpen, Layers } from "lucide-react";

export default async function ProgramsPage() {
    const supabase = await createClient();

    // Fetch all programs with module and lesson counts
    const { data: programs, error } = await supabase
        .from("programs")
        .select(`
      *,
      created_by_user:profiles!programs_created_by_fkey(full_name),
      modules:modules(id)
    `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching programs:", error);
    }

    // Count modules for each program
    const programsWithCounts = programs?.map(program => ({
        ...program,
        module_count: program.modules?.length || 0
    }));

    return (
        <div className="p-8 space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Programlar
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Eğitim programlarını oluşturun ve modüllerle organize edin
                    </p>
                </div>
                <Link
                    href="/admin/programs/new"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Program Oluştur
                </Link>
            </div>

            {/* Statistics Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 dark:bg-amber-500/10 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-purple-500 dark:text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Toplam Program
                        </h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                            {programs?.length || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Programs Grid */}
            {!programsWithCounts || programsWithCounts.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                    <GraduationCap className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Henüz program yok
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        İlk eğitim programınızı oluşturarak başlayın
                    </p>
                    <Link
                        href="/admin/programs/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Program Oluştur
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programsWithCounts.map((program) => (
                        <Link
                            key={program.id}
                            href={`/admin/programs/${program.id}`}
                            className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-kodrix-purple dark:hover:border-amber-500 hover:shadow-lg transition-all duration-200"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-amber-500/10 dark:to-orange-500/10 flex items-center justify-center">
                                        <GraduationCap className="w-6 h-6 text-purple-600 dark:text-amber-600" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-purple-600 dark:text-amber-600 bg-purple-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                                        {program.total_modules || 0} Modül
                                    </span>
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                        {program.total_lessons || 0} Ders
                                    </span>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition-colors line-clamp-2">
                                {program.title}
                            </h3>

                            {/* Description */}
                            {program.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                    {program.description}
                                </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Layers className="w-4 h-4" />
                                    <span>{program.module_count} Modül</span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {program.created_by_user?.full_name || 'Admin'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
