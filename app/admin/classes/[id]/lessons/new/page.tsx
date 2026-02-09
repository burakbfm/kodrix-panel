import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NewLessonPage({ params }: PageProps) {
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

    // Get assigned programs for module selection
    const { data: assignedPrograms } = await supabase
        .from("class_programs")
        .select(`
      *,
      program:programs(id, title)
    `)
        .eq("class_id", id)
        .eq("is_active", true);

    async function createLesson(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const lessonData = {
            class_id: id,
            program_id: formData.get("program_id") as string || null,
            title: formData.get("title") as string,
            module_name: formData.get("module_name") as string || null,
            description: formData.get("description") as string || null,
            lesson_date: formData.get("lesson_date") as string,
            lesson_time: formData.get("lesson_time") as string || null,
            duration_minutes: parseInt(formData.get("duration_minutes") as string) || 90,
            meeting_link: formData.get("meeting_link") as string || null,
            recording_link: formData.get("recording_link") as string || null,
            teacher_notes: formData.get("teacher_notes") as string || null,
            is_active: formData.get("is_active") === "true",
        };

        const { error } = await supabase
            .from("class_lessons")
            .insert(lessonData);

        if (error) {
            console.error("Ders oluşturma hatası:", error);
            return;
        }

        revalidatePath(`/admin/classes/${id}?tab=lessons`);
        redirect(`/admin/classes/${id}?tab=lessons`);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/admin/classes/${id}?tab=lessons`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Dersler
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Yeni Ders Ekle
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {classData.name} sınıfı için yeni ders oluşturun
                </p>
            </div>

            <form action={createLesson} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Ders Başlığı *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            placeholder="Örn: Python Fonksiyonları"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        />
                    </div>

                    {/* Program & Module */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="program_id"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Program (İsteğe Bağlı)
                            </label>
                            <select
                                id="program_id"
                                name="program_id"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            >
                                <option value="">Seçiniz...</option>
                                {assignedPrograms?.map((cp: any) => (
                                    <option key={cp.id} value={cp.program_id}>
                                        {cp.program?.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="module_name"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Modül/Konu
                            </label>
                            <input
                                type="text"
                                id="module_name"
                                name="module_name"
                                placeholder="Örn: Temel Python"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label
                                htmlFor="lesson_date"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Tarih *
                            </label>
                            <input
                                type="date"
                                id="lesson_date"
                                name="lesson_date"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="lesson_time"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Saat
                            </label>
                            <input
                                type="time"
                                id="lesson_time"
                                name="lesson_time"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="duration_minutes"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Süre (dk)
                            </label>
                            <input
                                type="number"
                                id="duration_minutes"
                                name="duration_minutes"
                                defaultValue={90}
                                min={15}
                                step={15}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Açıklama
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Ders hakkında kısa açıklama..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                        />
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="meeting_link"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Toplantı Linki (Zoom/Teams)
                            </label>
                            <input
                                type="url"
                                id="meeting_link"
                                name="meeting_link"
                                placeholder="https://zoom.us/j/..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="recording_link"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Kayıt Linki
                            </label>
                            <input
                                type="url"
                                id="recording_link"
                                name="recording_link"
                                placeholder="https://..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                    </div>

                    {/* Teacher Notes */}
                    <div>
                        <label
                            htmlFor="teacher_notes"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Öğretmen Notları (Öğrenciler de görecek)
                        </label>
                        <textarea
                            id="teacher_notes"
                            name="teacher_notes"
                            rows={4}
                            placeholder="Derse özel notlar, ödevler, önemli bilgiler..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            value="true"
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple dark:text-amber-500 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500"
                        />
                        <label
                            htmlFor="is_active"
                            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                        >
                            Dersi öğrencilere göster (aktif)
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={`/admin/classes/${id}?tab=lessons`}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Dersi Kaydet
                    </button>
                </div>
            </form>
        </div>
    );
}
