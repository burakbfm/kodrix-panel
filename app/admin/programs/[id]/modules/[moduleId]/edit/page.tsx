import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string; moduleId: string }>;
}

export default async function EditModulePage({ params }: PageProps) {
    const { id: programId, moduleId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch program and module
    const { data: program } = await supabase
        .from("programs")
        .select("title")
        .eq("id", programId)
        .single();

    const { data: module } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

    if (!program || !module) {
        notFound();
    }

    async function updateModule(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const order = parseInt(formData.get("order") as string);

        const { error } = await supabase
            .from("modules")
            .update({ title, description, order })
            .eq("id", moduleId);

        if (error) {
            console.error("Error updating module:", error);
            return;
        }

        revalidatePath(`/admin/programs/${programId}`);
        redirect(`/admin/programs/${programId}`);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href={`/admin/programs/${programId}`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {program.title}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Modülü Düzenle
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {module.title}
                </p>
            </div>

            {/* Form */}
            <form action={updateModule} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-3">
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Modül Adı *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                maxLength={255}
                                defaultValue={module.title}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="order" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Sıra
                            </label>
                            <input
                                type="number"
                                id="order"
                                name="order"
                                min="0"
                                defaultValue={module.order}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            defaultValue={module.description || ''}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={`/admin/programs/${programId}`}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                        Modülü Güncelle
                    </button>
                </div>
            </form>
        </div>
    );
}
