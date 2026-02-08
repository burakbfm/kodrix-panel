import { createClient } from "@/lib/supabase/server";
import { User, Mail, Shield } from "lucide-react";

export default async function TeacherProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Profilim
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Hesap bilgileriniz
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-kodrix-purple dark:border-amber-500 p-8 max-w-2xl">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-kodrix-purple/10 dark:bg-amber-500/10 flex items-center justify-center text-4xl font-bold text-kodrix-purple dark:text-amber-500">
                        {(profile?.full_name || profile?.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {profile?.full_name || "İsimsiz Kullanıcı"}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-3 py-1 mt-2 rounded-full bg-purple-100 dark:bg-amber-900/30 text-purple-700 dark:text-amber-500 text-sm font-medium">
                            <Shield className="w-3 h-3" /> Öğretmen
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">E-posta Adresi</p>
                            <p className="text-gray-900 dark:text-white">{profile?.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Branş / Alan</p>
                            <p className="text-gray-900 dark:text-white">{profile?.subject_field || "Belirtilmemiş"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
