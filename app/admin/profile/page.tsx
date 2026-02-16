import { createClient } from "@/lib/supabase/server";
import { User, Mail, Shield, Settings } from "lucide-react";

export default async function AdminProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Profilim
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Hesap bilgileriniz
                </p>
            </div>

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
                            <Shield className="w-3 h-3" /> Yönetici
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
                            <p className="text-xs text-gray-500 uppercase font-semibold">Rol</p>
                            <p className="text-gray-900 dark:text-white font-medium capitalize">{profile?.role}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Settings className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Kayıt Tarihi</p>
                            <p className="text-gray-900 dark:text-white font-medium">
                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
