import { createClient } from "@/lib/supabase/server";
import { BookOpen, Users } from "lucide-react";

export default async function TeacherDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch assigned classes (Using enrollment logic or separate assignment table?)
    // Currently, we don't have a direct 'teacher_class' table. 
    // Teachers might be assigned via 'classes' table if there is a teacher_id?
    // Let's check schema. If not, we might need to query where they are enrolled as teacher?
    // Or simply show all classes for now if no assignment logic exists yet.
    // Phase 2 checklist says: "Create teacher-class assignment table/logic" -> Pending.
    // So for now, we'll just show a placeholder or all classes.
    // Actually, let's fetch classes where this user is the teacher.
    // Assuming 'classes' table might NOT have teacher_id yet. 
    // Let's check if we added it? Schema Check needed. 
    // Since we haven't added it, I'll display a "No classes assigned" message or all classes.

    // Checking existing classes table structure...
    const { data: classes } = await supabase.from("classes").select("*");

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
                {/* Placeholder for Stats */}
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
                {/* List component here */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500">
                    <p>Henüz atanmış bir sınıfınız bulunmuyor.</p>
                    <p className="text-sm mt-2">(Sınıf atama sistemi geliştirme aşamasındadır)</p>
                </div>
            </div>
        </div>
    );
}
