import { createClient } from "@/lib/supabase/server";
import { User, Mail, Shield, Phone, BookOpen, Award } from "lucide-react";
import Link from "next/link";

export default async function StudentProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch enrolled classes
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("class_id, classes(id, name)")
        .eq("user_id", user.id);

    const enrolledClasses = enrollments?.map((e: any) => e.classes).filter(Boolean) || [];

    // Fetch quiz results
    const { data: quizResults } = await supabase
        .from("quiz_results")
        .select("score, total_questions, quizzes(title)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    const totalQuizzes = quizResults?.length || 0;
    const avgScore = totalQuizzes > 0
        ? Math.round((quizResults!.reduce((sum: number, r: any) => sum + (r.score / r.total_questions) * 100, 0)) / totalQuizzes)
        : 0;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profilim</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Hesap bilgileriniz ve performansınız</p>
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
                            <Shield className="w-3 h-3" /> Öğrenci
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
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Veli Bilgisi</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile?.parent_name || "-"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Veli Telefon</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile?.parent_phone || "-"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrolled Classes */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                        Kayıtlı Sınıflarım
                    </h3>
                    {enrolledClasses.length > 0 ? (
                        <div className="space-y-2">
                            {enrolledClasses.map((cls: any) => (
                                <Link key={cls.id} href={`/student`}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-kodrix-purple/5 dark:hover:bg-amber-900/10 border border-gray-100 dark:border-white/5 transition group">
                                    <div className="w-8 h-8 rounded-lg bg-kodrix-purple/10 dark:bg-amber-500/20 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-kodrix-purple dark:text-amber-500" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition">{cls.name}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                            Henüz sınıfa atanmamışsınız.
                        </p>
                    )}
                </div>

                {/* Quiz Performance */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                        Quiz Performansım
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-4 rounded-xl bg-kodrix-purple/10 dark:bg-amber-900/20 border border-kodrix-purple/20 dark:border-amber-800/40 text-center">
                            <p className="text-2xl font-black text-kodrix-purple dark:text-amber-500">{totalQuizzes}</p>
                            <p className="text-xs text-kodrix-purple/70 dark:text-amber-500/70 font-semibold mt-1">Çözülen Quiz</p>
                        </div>
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 text-center">
                            <p className="text-2xl font-black text-green-600 dark:text-green-400">%{avgScore}</p>
                            <p className="text-xs text-green-500 dark:text-green-400 font-semibold mt-1">Ortalama</p>
                        </div>
                    </div>

                    {quizResults && quizResults.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Son Quizler</p>
                            {quizResults.map((r: any, i: number) => {
                                const pct = Math.round((r.score / r.total_questions) * 100);
                                return (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                                            {(r.quizzes as any)?.title || "Quiz"}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${pct >= 70
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                            : pct >= 40
                                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            }`}>
                                            {r.score}/{r.total_questions} (%{pct})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                            Henüz quiz çözülmedi.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
