import { createClient } from "@/lib/supabase/server";
import { BookOpen, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";

export default async function StudentDashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch enrolled classes
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
      *,
      classes (
        *
      )
    `)
        .eq("student_id", user.id);

    // Extract classes from enrollments
    // Typescript might complain if we don't handle array/null correctly, but let's assume standard response
    const enrolledClasses = enrollments?.map(e => e.classes).filter(Boolean) || [];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Derslerim
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Kayıtlı olduğunuz sınıflar ve ders içerikleri
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledClasses.map((cls: any) => (
                    <div key={cls.id} className="bg-white dark:bg-gray-900 rounded-xl border border-kodrix-purple dark:border-amber-500 p-6 hover:shadow-lg transition-all h-full flex flex-col group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-kodrix-purple dark:text-amber-500">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                                Kayıtlı
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
                            {/* Future: Add link to lesson details */}
                            <button className="w-full mt-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                Ders İçeriği (Yakında)
                            </button>
                        </div>
                    </div>
                ))}

                {enrolledClasses.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Henüz bir sınıfa kaydınız yok</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Yöneticinizden sizi bir sınıfa eklemesini isteyin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
