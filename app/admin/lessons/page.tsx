import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, GraduationCap, BookOpen, Clock } from "lucide-react";

export default async function LessonsPage() {
    const supabase = await createClient();

    // Fetch all lessons
    const { data: lessons, error } = await supabase
        .from("lessons")
        .select(`
      *,
      created_by_user:profiles!lessons_created_by_fkey(full_name)
    `)
        .order("order", { ascending: true });

    if (error) {
        console.error("Error fetching lessons:", error);
    }

    // Count total lessons
    const { count: lessonsCount } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true });

    return (
        <div className="p-8 space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Ders Taslakları
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Ders içeriklerini oluşturun ve yönetin
                    </p>
                </div>
                <Link
                    href="/admin/lessons/new"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Ders Oluştur
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
                            Toplam Ders Taslağı
                        </h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                            {lessonsCount || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Lessons Grid */}
            {!lessons || lessons.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                    <GraduationCap className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Henüz ders taslağı yok
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        İlk ders taslağınızı oluşturarak başlayın
                    </p>
                    <Link
                        href="/admin/lessons/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Ders Oluştur
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson) => (
                        <Link
                            key={lesson.id}
                            href={`/admin/lessons/${lesson.id}/edit`}
                            className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-kodrix-purple dark:hover:border-amber-500 hover:shadow-lg transition-all duration-200"
                        >
                            {/* Lesson Number Badge */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-amber-500/10 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-purple-500 dark:text-amber-500" />
                                    </div>
                                    <span className="text-sm font-semibold text-purple-600 dark:text-amber-600 bg-purple-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                                        Ders {lesson.lesson_number}
                                    </span>
                                </div>
                            </div>

                            {/* Lesson Title */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition-colors line-clamp-2">
                                {lesson.title}
                            </h3>

                            {/* Lesson Description */}
                            {lesson.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                    {lesson.description}
                                </p>
                            )}

                            {/* Footer Info */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{lesson.duration_minutes} dk</span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {lesson.created_by_user?.full_name || 'Admin'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
