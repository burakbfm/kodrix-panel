import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProgramPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch program
    const { data: program, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !program) {
        notFound();
    }

    async function updateProgram(formData: FormData) {
        "use server";

        const supabase = await createClient();

        const programData = {
            title: formData.get("title") as string,
            description: formData.get("description") as string || null,
            total_lessons: parseInt(formData.get("total_lessons") as string) || 0,
            total_modules: parseInt(formData.get("total_modules") as string) || 0,
            duration_weeks: parseInt(formData.get("duration_weeks") as string) || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("programs")
            .update(programData)
            .eq("id", id);

        if (error) {
            console.error("Error updating program:", error);
            return;
        }

        revalidatePath(`/admin/programs/${id}`);
        revalidatePath("/admin/programs");
        redirect(`/admin/programs/${id}`);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href={`/admin/programs/${id}`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Program Detayı
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Programı Düzenle
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {program.title}
                </p>
            </div>

            {/* Form */}
            <form action={updateProgram} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">

                    {/* Program Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Program Adı *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            maxLength={255}
                            defaultValue={program.title}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        />
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="total_modules" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Toplam Modül Sayısı
                            </label>
                            <input
                                type="number"
                                id="total_modules"
                                name="total_modules"
                                min="0"
                                defaultValue={program.total_modules}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="total_lessons" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Toplam Ders Sayısı
                            </label>
                            <input
                                type="number"
                                id="total_lessons"
                                name="total_lessons"
                                min="0"
                                defaultValue={program.total_lessons}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="duration_weeks" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Süre (Hafta)
                            </label>
                            <input
                                type="number"
                                id="duration_weeks"
                                name="duration_weeks"
                                min="1"
                                defaultValue={program.duration_weeks}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={5}
                            defaultValue={program.description || ''}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={`/admin/programs/${id}`}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                        Değişiklikleri Kaydet
                    </button>
                </div>
            </form>
        </div>
    );
}
