import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AssignProgramPage({ params }: PageProps) {
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

    // Get all programs
    const { data: programs } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });

    // Get teachers
    const { data: teachers } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .order("full_name");

    async function assignProgram(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const programId = formData.get("program_id") as string;
        const teacherId = formData.get("teacher_id") as string || null;
        const startDate = formData.get("start_date") as string || null;
        const isActive = formData.get("is_active") === "true";
        const notes = formData.get("notes") as string || null;

        const { error } = await supabase.from("class_programs").insert([
            {
                class_id: id,
                program_id: programId,
                teacher_id: teacherId,
                start_date: startDate,
                is_active: isActive,
                notes: notes,
            },
        ]);

        if (error) {
            console.error("Program atama hatası:", error);
            return;
        }

        revalidatePath(`/admin/classes/${id}`);
        redirect(`/admin/classes/${id}?tab=programs`);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/admin/classes/${id}?tab=programs`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Geri Dön
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Program Ata
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {classData.name} sınıfına program atayın
                </p>
            </div>

            <form action={assignProgram} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                    {/* Program Selection */}
                    <div>
                        <label
                            htmlFor="program_id"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Program *
                        </label>
                        <select
                            id="program_id"
                            name="program_id"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        >
                            <option value="">Program seçin</option>
                            {programs?.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Teacher Selection */}
                    <div>
                        <label
                            htmlFor="teacher_id"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Öğretmen
                        </label>
                        <select
                            id="teacher_id"
                            name="teacher_id"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        >
                            <option value="">Öğretmen seçin (isteğe bağlı)</option>
                            {teachers?.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label
                            htmlFor="start_date"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Başlangıç Tarihi
                        </label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            value="true"
                            defaultChecked
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple dark:text-amber-500 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500"
                        />
                        <label
                            htmlFor="is_active"
                            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                        >
                            Programı hemen aktif et
                        </label>
                    </div>

                    {/* Notes */}
                    <div>
                        <label
                            htmlFor="notes"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Notlar
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                            placeholder="Ek notlar..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={`/admin/classes/${id}?tab=programs`}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                        Programı Ata
                    </button>
                </div>
            </form>
        </div>
    );
}
