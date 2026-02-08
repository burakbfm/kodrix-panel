import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Calendar, Clock } from "lucide-react";

export default async function TeacherClassesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch classes assigned to this teacher
    const { data: classes } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Sınıflarım
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Yönettiğiniz sınıflar ve ders içerikleri
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes?.map((cls) => (
                    <Link href={`/teacher/classes/${cls.id}`} key={cls.id} className="group">
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-kodrix-purple dark:border-amber-500 p-6 hover:shadow-lg transition-all h-full flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-kodrix-purple dark:text-amber-500">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                                    Aktif
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition">
                                {cls.name}
                            </h3>

                            <div className="mt-auto space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Program: Belirlenmedi</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span>Son Ders: -</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {classes?.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                        Henüz atanmış bir sınıfınız yok.
                    </div>
                )}
            </div>
        </div>
    );
}
