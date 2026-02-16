"use client";

import { updateSystemUser } from "@/app/admin/actions";
import Link from "next/link";
import { ArrowLeft, Save, User, BookOpen, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditUserPage({ params }: { params: { id: string } }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        async function load() {
            const { id } = await params;
            const supabase = createClient();
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", id)
                .single();
            setProfile(data);

            if (data?.role === "student") {
                const { data: enrollments } = await supabase
                    .from("enrollments")
                    .select("class_id, classes(id, name)")
                    .eq("user_id", id);
                setEnrolledClasses(enrollments?.map((e: any) => e.classes).filter(Boolean) || []);
            }

            if (data?.role === "teacher") {
                const { data: classes } = await supabase
                    .from("classes")
                    .select("id, name")
                    .eq("teacher_id", id);
                setEnrolledClasses(classes || []);
            }

            setLoading(false);
        }
        load();
    }, [params]);

    async function handleSubmit(formData: FormData) {
        setSaving(true);
        try {
            await updateSystemUser(formData);
            toast.success("Kullanıcı başarıyla güncellendi");
        } catch (error: any) {
            if (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT') || error.digest?.includes('NEXT_REDIRECT')) {
                toast.success("Kullanıcı güncellendi, yönlendiriliyor...");
                return;
            }
            console.error("Update error:", error);
            toast.error("Hata: " + (error.message || "Bilinmeyen hata"));
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-kodrix-purple/30 dark:border-amber-500/30 border-t-kodrix-purple dark:border-t-amber-500 animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 font-bold text-lg">Kullanıcı bulunamadı.</p>
                <Link href="/admin/users" className="text-kodrix-purple dark:text-amber-500 hover:underline mt-4 inline-block">← Listeye Dön</Link>
            </div>
        );
    }

    const isStudent = profile.role === "student";

    return (
        <div className="p-8 max-w-3xl mx-auto">

            <Link href="/admin/users" className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8 transition group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Listeye Dön
            </Link>

            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-kodrix-purple to-purple-700 dark:from-amber-600 dark:to-orange-600 p-8 text-white shadow-2xl border border-white/10 mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-5">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-xl ${isStudent
                        ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white'
                        : 'bg-gradient-to-br from-purple-400 to-fuchsia-400 text-white'
                        }`}>
                        {(profile.full_name || profile.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{profile.full_name || profile.email}</h1>
                        <p className="text-white/70 text-sm mt-1">{profile.email}</p>
                        <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg text-xs font-bold ${isStudent
                            ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                            : 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                            }`}>
                            {isStudent ? <GraduationCap className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            {isStudent ? 'Öğrenci' : 'Öğretmen'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Edit Form */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl p-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                        Bilgileri Düzenle
                    </h2>

                    <form action={handleSubmit} className="space-y-5">
                        <input type="hidden" name="userId" value={profile.id} />

                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1.5 font-semibold">Ad Soyad</label>
                            <input name="fullName" required defaultValue={profile.full_name || ""}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent outline-none transition" />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1.5 font-semibold">
                                {isStudent ? "Okul Numarası / E-posta" : "E-posta"}
                            </label>
                            <input disabled value={isStudent ? (profile.school_number || profile.email) : profile.email}
                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                            <p className="text-[10px] text-gray-400 mt-1">Bu alan değiştirilemez.</p>
                        </div>

                        {isStudent && (
                            <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-4">
                                <h3 className="text-sm font-bold text-kodrix-purple dark:text-amber-500">Veli Bilgileri</h3>
                                <div>
                                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1.5 font-semibold">Veli Adı Soyadı</label>
                                    <input name="parentName" defaultValue={profile.parent_name || ""}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 outline-none transition" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1.5 font-semibold">Veli Telefon</label>
                                    <input name="parentPhone" type="tel" defaultValue={profile.parent_phone || ""}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 outline-none transition" />
                                </div>
                            </div>
                        )}

                        {!isStudent && (
                            <div className="border-t border-gray-100 dark:border-white/5 pt-5">
                                <h3 className="text-sm font-bold text-kodrix-purple dark:text-amber-500 mb-3">Öğretmen Bilgileri</h3>
                                <div>
                                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1.5 font-semibold">Branş / Alan</label>
                                    <input name="subjectField" defaultValue={profile.subject_field || ""}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 outline-none transition" />
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={saving}
                            className="w-full bg-gradient-to-r from-kodrix-purple to-purple-700 dark:from-amber-500 dark:to-orange-500 hover:from-purple-700 hover:to-purple-800 dark:hover:from-amber-600 dark:hover:to-orange-600 text-white font-bold py-3.5 rounded-2xl transition-all mt-4 flex items-center justify-center gap-2 shadow-lg shadow-kodrix-purple/20 dark:shadow-amber-500/20 hover:shadow-kodrix-purple/30 dark:hover:shadow-amber-500/30 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save className="w-5 h-5" />
                            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </button>
                    </form>
                </div>

                {/* Side Info */}
                <div className="space-y-6">
                    {/* Enrolled Classes */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-kodrix-purple dark:text-amber-500" />
                            {isStudent ? "Kayıtlı Sınıflar" : "Verdiği Sınıflar"}
                        </h3>
                        {enrolledClasses.length > 0 ? (
                            <div className="space-y-2">
                                {enrolledClasses.map((cls: any) => (
                                    <Link key={cls.id} href={`/admin/classes/${cls.id}`}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-kodrix-purple/5 dark:hover:bg-amber-900/10 border border-gray-100 dark:border-white/5 transition group">
                                        <div className="w-8 h-8 rounded-lg bg-kodrix-purple/10 dark:bg-amber-500/20 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-kodrix-purple dark:text-amber-500" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition">{cls.name}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                                {isStudent ? "Henüz sınıfa atanmamış." : "Henüz sınıf atanmamış."}
                            </p>
                        )}
                    </div>

                    {/* Account Info */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Hesap Bilgileri</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Rol</span>
                                <span className="font-semibold text-gray-900 dark:text-white capitalize">{profile.role}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kayıt</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString("tr-TR") : "-"}
                                </span>
                            </div>
                            {isStudent && profile.school_number && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Okul No</span>
                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{profile.school_number}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
