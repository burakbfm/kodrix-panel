import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewLessonPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    async function createLesson(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            redirect("/login");
        }

        const lessonData = {
            lesson_number: parseInt(formData.get("lesson_number") as string),
            title: formData.get("title") as string,
            description: formData.get("description") as string || null,
            content: formData.get("content") as string || null,
            duration_minutes: parseInt(formData.get("duration_minutes") as string) || 45,
            order: parseInt(formData.get("order") as string) || 0,
            created_by: user.id,
        };

        const { error } = await supabase
            .from("lessons")
            .insert([lessonData]);

        if (error) {
            console.error("Error creating lesson:", error);
            return;
        }

        redirect("/admin/lessons");
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/admin/lessons"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Ders Taslakları
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Yeni Ders Oluştur
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Ders içeriğini ve materyallerini ekle

                    yin
                </p>
            </div>

            {/* Form */}
            <form action={createLesson} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">

                    {/* Lesson Number & Order */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="lesson_number" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Ders Numarası *
                            </label>
                            <input
                                type="number"
                                id="lesson_number"
                                name="lesson_number"
                                required
                                min="1"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                                placeholder="Örn: 1"
                            />
                        </div>

                        <div>
                            <label htmlFor="order" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Sıralama
                            </label>
                            <input
                                type="number"
                                id="order"
                                name="order"
                                min="0"
                                defaultValue="0"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Derslerin gösterim sırası</p>
                        </div>
                    </div>

                    {/* Lesson Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ders Başlığı *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            maxLength={255}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            placeholder="Örn: Python'a Giriş"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label htmlFor="duration_minutes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Tahmini Süre (dakika)
                        </label>
                        <input
                            type="number"
                            id="duration_minutes"
                            name="duration_minutes"
                            min="1"
                            defaultValue="45"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            placeholder="45"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                            placeholder="Dersin kısa açıklaması..."
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label htmlFor="content" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ders İçeriği
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            rows={12}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none font-mono text-sm"
                            placeholder="Ders içeriğini buraya yazın (Markdown desteklenir)..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Markdown formatında yazabilirsiniz</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/admin/lessons"
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                        Ders Oluştur
                    </button>
                </div>
            </form>
        </div>
    );
}
