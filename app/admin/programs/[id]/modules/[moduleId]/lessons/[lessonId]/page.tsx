import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Link as LinkIcon, Clock, BookOpen } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string; moduleId: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: PageProps) {
    const { id: programId, moduleId, lessonId } = await params;
    const supabase = await createClient();

    // Get current user and check if teacher or admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const canEdit = profile?.role === 'admin' || profile?.role === 'teacher';

    // Fetch lesson with module and program info
    const { data: lesson } = await supabase
        .from("lessons")
        .select(`
      *,
      module:modules!inner(
        id,
        title,
        order,
        program:programs!inner(
          id,
          title
        )
      )
    `)
        .eq("id", lessonId)
        .single();

    if (!lesson) {
        notFound();
    }

    async function updateLesson(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            redirect("/login");
        }

        const updates = {
            title: formData.get("title") as string,
            description: formData.get("description") as string || null,
            content: formData.get("content") as string || null,
            meeting_link: formData.get("meeting_link") as string || null,
            duration_minutes: parseInt(formData.get("duration_minutes") as string) || 45,
            updated_at: new Date().toISOString(),
        };

        await supabase
            .from("lessons")
            .update(updates)
            .eq("id", lessonId);

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
                    {lesson.module.program.title}
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-purple-600 dark:text-amber-600 bg-purple-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                                Modül {lesson.module.order}: {lesson.module.title}
                            </span>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                                Ders {lesson.lesson_number}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {lesson.title}
                        </h1>
                        {lesson.description && (
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                {lesson.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Süre</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {lesson.duration_minutes} dakika
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Sıra</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {lesson.order}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <LinkIcon className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Katılım Linki</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {lesson.meeting_link ? '✅' : '❌'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            {canEdit && (
                <form action={updateLesson} className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                            <Edit className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Ders Bilgilerini Düzenle
                            </h2>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Ders Başlığı *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                defaultValue={lesson.title}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
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
                                defaultValue={lesson.description || ''}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                            />
                        </div>

                        {/* Meeting Link - Highlighted for Teachers */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 p-4 rounded-lg border border-purple-200 dark:border-amber-700">
                            <label htmlFor="meeting_link" className="block text-sm font-semibold text-purple-900 dark:text-amber-300 mb-2">
                                📹 Katılım Linki (Zoom, Meet, Teams)
                            </label>
                            <input
                                type="url"
                                id="meeting_link"
                                name="meeting_link"
                                defaultValue={lesson.meeting_link || ''}
                                className="w-full px-4 py-3 rounded-lg border border-purple-300 dark:border-amber-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-amber-400 focus:border-transparent transition outline-none"
                                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                            />
                            <p className="text-xs text-purple-700 dark:text-amber-400 mt-2">
                                💡 Bu linki öğrenciler görecek. Yayınlamadan önce güncelleyebilirsiniz.
                            </p>
                        </div>

                        {/* Duration */}
                        <div>
                            <label htmlFor="duration_minutes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Süre (Dakika)
                            </label>
                            <input
                                type="number"
                                id="duration_minutes"
                                name="duration_minutes"
                                min="1"
                                defaultValue={lesson.duration_minutes}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
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
                                rows={10}
                                defaultValue={lesson.content || ''}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none font-mono text-sm"
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
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </form>
            )}

            {/* Read-only view for non-editors */}
            {!canEdit && lesson.content && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Ders İçeriği
                    </h2>
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                        {lesson.content}
                    </pre>
                </div>
            )}
        </div>
    );
}
