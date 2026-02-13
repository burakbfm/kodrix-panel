"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import IconPicker from "@/components/IconPicker";

interface FileAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
}

export default function NewProgramPageClient({ userId }: { userId: string }) {
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [selectedIcon, setSelectedIcon] = useState("code");
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);

            const programData = {
                title: formData.get("title") as string,
                description: (formData.get("description") as string) || null,
                total_lessons: parseInt(formData.get("total_lessons") as string) || 0,
                total_modules: parseInt(formData.get("total_modules") as string) || 0,
                duration_weeks: parseInt(formData.get("duration_weeks") as string) || null,
                icon: selectedIcon, // Save selected icon
                attachments: attachments, // Save uploaded files metadata
                created_by: userId,
            };

            const { data, error } = await supabase
                .from("programs")
                .insert([programData])
                .select()
                .single();

            if (error) {
                console.error("Error creating program:", error);
                alert("Program oluşturulurken hata oluştu!");
                return;
            }

            router.push(`/admin/programs/${data.id}`);
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
                    href="/admin/programs"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Programlar
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Yeni Program Oluştur
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Eğitim programı oluşturun, sonra modül ve dersler ekleyin
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-8 shadow-sm">
                    {/* Program Title */}
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Program Adı *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            maxLength={255}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            placeholder="Örn: Frontend Geliştirme Eğitimi"
                        />
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label
                                htmlFor="total_modules"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Toplam Modül Sayısı
                            </label>
                            <input
                                type="number"
                                id="total_modules"
                                name="total_modules"
                                min="0"
                                defaultValue="0"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                                placeholder="5"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="total_lessons"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Toplam Ders Sayısı
                            </label>
                            <input
                                type="number"
                                id="total_lessons"
                                name="total_lessons"
                                min="0"
                                defaultValue="0"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                                placeholder="32"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="duration_weeks"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Süre (Hafta)
                            </label>
                            <input
                                type="number"
                                id="duration_weeks"
                                name="duration_weeks"
                                min="1"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                                placeholder="12"
                            />
                        </div>
                    </div>

                    {/* Icon Picker */}
                    <IconPicker selectedIcon={selectedIcon} onSelect={setSelectedIcon} />

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
                            rows={5}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                            placeholder="Programın detaylı açıklaması..."
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Program Ek Dosyaları
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            PDF, DOC, PPT, resim dosyaları ekleyebilirsiniz
                        </p>
                        <FileUpload
                            bucket="program-files"
                            path={crypto.randomUUID()} // Temporary ID, will be replaced on create
                            existingFiles={attachments}
                            onFilesChange={setAttachments}
                            maxSizeMB={50}
                            allowedTypes={["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "png", "jpg", "jpeg", "zip"]}
                            maxFiles={10}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/admin/programs"
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Oluşturuluyor..." : "Program Oluştur"}
                    </button>
                </div>
            </form>
        </div>
    );
}
