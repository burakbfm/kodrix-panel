import { createClient } from "@/lib/supabase/server";
import { User, Mail, Shield, BookOpen, Users as UsersIcon, Briefcase } from "lucide-react";
import Link from "next/link";

export default async function TeacherProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const { data: classes } = await supabase
        .from("classes")
        .select("id, name, enrollments(count)")
        .eq("teacher_id", user.id);

    const totalStudents = classes?.reduce((sum: number, cls: any) => sum + (cls.enrollments?.[0]?.count || 0), 0) || 0;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profilim</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Hesap bilgileriniz ve sınıflarınız</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-xl">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-kodrix-purple to-purple-700 dark:from-amber-500 dark:to-orange-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                        {(profile?.full_name || profile?.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {profile?.full_name || "İsimsiz Kullanıcı"}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-3 py-1 mt-2 rounded-lg bg-kodrix-purple/10 dark:bg-amber-900/30 text-kodrix-purple dark:text-amber-500 text-sm font-bold">
                            <Shield className="w-3 h-3" /> Öğretmen
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">E-posta Adresi</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile?.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Branş / Alan</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile?.subject_field || "Belirtilmemiş"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats + Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-kodrix-purple to-purple-700 dark:from-amber-500 dark:to-orange-500 text-white shadow-xl">
                    <BookOpen className="w-8 h-8 mb-3 opacity-80" />
                    <p className="text-3xl font-black">{classes?.length || 0}</p>
                    <p className="text-sm font-semibold opacity-80 mt-1">Verdiğim Sınıf</p>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl">
                    <UsersIcon className="w-8 h-8 mb-3 opacity-80" />
                    <p className="text-3xl font-black">{totalStudents}</p>
                    <p className="text-sm font-semibold opacity-80 mt-1">Toplam Öğrenci</p>
                </div>

                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-xl md:row-span-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-kodrix-purple dark:text-amber-500" />
                        Sınıflarım
                    </h3>
                    {classes && classes.length > 0 ? (
                        <div className="space-y-2">
                            {classes.map((cls: any) => (
                                <Link key={cls.id} href={`/teacher/classes/${cls.id}`}
                                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-kodrix-purple/5 dark:hover:bg-amber-900/10 border border-gray-100 dark:border-white/5 transition group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-kodrix-purple/10 dark:bg-amber-500/20 flex items-center justify-center">
                                            <BookOpen className="w-3.5 h-3.5 text-kodrix-purple dark:text-amber-500" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition">{cls.name}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                                        {cls.enrollments?.[0]?.count || 0} öğrenci
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                            Henüz sınıf atanmamış.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
