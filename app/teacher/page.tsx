import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";

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
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Genel Bakış
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Atanan sınıflarınız ve ders programınız.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Classes Stat Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                Sınıflarım
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                {classes?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classes List */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Sınıflarınız
                </h2>

                {classes && classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls) => (
                            <div key={cls.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Öğretmen: Siz
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800 p-8 text-center text-gray-500">
                        <p>Henüz size atanmış bir sınıf bulunmuyor.</p>
                        <p className="text-sm mt-2">Yöneticinizden sınıf ataması yapmasını isteyin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
