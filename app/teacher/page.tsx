import { createClient } from "@/lib/supabase/server";
import { BookOpen, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default async function TeacherDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch classes assigned to this teacher
    // Using the new teacher_id column
    const { data: classes } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">

            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 to-purple-900 dark:from-indigo-950 dark:to-purple-950 p-10 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2">Eğitmen Paneli</h1>
                    <p className="text-indigo-200 text-lg">
                        Hoş geldiniz. Sınıflarınızı ve ders programınızı buradan yönetebilirsiniz.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Classes Stat Card */}
                <div className="relative overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                                Atanan Sınıflar
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {classes?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classes List */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
                    Sınıflarınız
                </h2>

                {classes && classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls) => (
                            <Link key={cls.id} href={`/teacher/classes/${cls.id}`} className="group block h-full">
                                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-8 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300 h-full flex flex-col justify-between group-hover:-translate-y-1">
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                                <span className="text-xl font-bold">{cls.name.charAt(0)}</span>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                                                Aktif
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-500 transition-colors">
                                            {cls.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            Bu sınıfın ders programını ve öğrencilerini yönetin.
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400">
                                        Sınıfı Yönet
                                        <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Henüz Sınıf Yok</h3>
                        <p className="text-sm max-w-sm mx-auto">Size atanmış herhangi bir sınıf bulunmuyor. Yöneticinizle iletişime geçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
