import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ClassSettingsPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get class
    const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

    if (!classData) {
        notFound();
    }

    async function updateClass(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const name = formData.get("name") as string;

        const { error } = await supabase
            .from("classes")
            .update({ name })
            .eq("id", id);

        if (error) {
            console.error("Sınıf güncelleme hatası:", error);
            return;
        }

        revalidatePath(`/admin/classes/${id}`);
        revalidatePath("/admin/classes");
        redirect(`/admin/classes/${id}`);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/admin/classes/${id}`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Geri Dön
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Sınıf Ayarları
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {classData.name} sınıfını düzenleyin
                </p>
            </div>

            <form action={updateClass} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                    {/* Class Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Sınıf Adı *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            defaultValue={classData.name}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        />
                    </div>

                    {/* Class ID - Read only */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Sınıf ID
                        </label>
                        <input
                            type="text"
                            value={classData.id}
                            readOnly
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>

                    {/* Created At */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Oluşturulma Tarihi
                        </label>
                        <input
                            type="text"
                            value={new Date(classData.created_at).toLocaleString("tr-TR")}
                            readOnly
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={`/admin/classes/${id}`}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Değişiklikleri Kaydet
                    </button>
                </div>
            </form>
        </div>
    );
}
