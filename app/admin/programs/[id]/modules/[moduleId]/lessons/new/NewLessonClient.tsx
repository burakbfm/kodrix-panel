"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FileUpload from "@/components/FileUpload";

interface FileAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
}

interface NewLessonClientProps {
    programId: string;
    moduleId: string;
    programTitle: string;
    moduleTitle: string;
    moduleOrder: number;
    nextLessonNumber: number;
}

export default function NewLessonClient({
    programId,
    moduleId,
    programTitle,
    moduleTitle,
    moduleOrder,
    nextLessonNumber,
}: NewLessonClientProps) {
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);

            const lessonData = {
                module_id: moduleId,
                lesson_number: parseInt(formData.get("lesson_number") as string),
                title: formData.get("title") as string,
                description: (formData.get("description") as string) || null,
                content: (formData.get("content") as string) || null,
                meeting_link: (formData.get("meeting_link") as string) || null,
                duration_minutes: parseInt(formData.get("duration_minutes") as string) || 45,
                order: parseInt(formData.get("order") as string) || 0,
                attachments: attachments, // Save uploaded files
            };

            const { data, error } = await supabase
                .from("lessons")
                .insert([lessonData])
                .select()
                .single();

            if (error) {
                console.error("Error creating lesson:", error);
                alert("Ders oluşturulurken hata oluştu!");
                return;
            }

            router.push(`/admin/programs/${programId}`);
            router.refresh();
        } catch (error) {
            console.error("Submit error:", error);
            alert("Bir hata oluştu!");
        } finally {
            setSubmitting(false);
        }
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
                    {programTitle}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Yeni Ders Ekle
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Modül {moduleOrder}: {moduleTitle}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                    {/* Lesson Number and Order */}
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
                                defaultValue={nextLessonNumber}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                                placeholder="1"
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
                                defaultValue={nextLessonNumber}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                                placeholder="1"
                            />
                        </div>
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
                            maxLength={255}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            placeholder="Örn: Değişkenler ve Veri Tipleri"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Kısa Açıklama
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                            placeholder="Kısa açıklama..."
                        />
                    </div>

                    {/* Meeting Link */}
                    <div>
                        <label htmlFor="meeting_link" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ders Linki 🔗
                        </label>
                        <input
                            type="url"
                            id="meeting_link"
                            name="meeting_link"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Zoom, Google Meet, Teams vb. toplantı linki
                        </p>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ders Dosyaları
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            PDF, PPT, kod dosyaları ekleyebilirsiniz. Bu dosyalar sınıfa program atandığında kopyalanır.
                        </p>
                        <FileUpload
                            bucket="lesson-files"
                            path={`lessons/${crypto.randomUUID()}`}
                            existingFiles={attachments}
                            onFilesChange={setAttachments}
                            maxSizeMB={50}
                            allowedTypes={["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "py", "js", "html", "css", "java", "cpp", "zip", "png", "jpg", "jpeg"]}
                            maxFiles={10}
                        />
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
                            defaultValue="45"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            placeholder="45"
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
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none font-mono text-sm"
                            placeholder="Ders içeriği, video linkler, materyaller..."
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
                        disabled={submitting}
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Kaydediliyor..." : "Dersi Kaydet"}
                    </button>
                </div>
            </form>
        </div>
    );
}
