"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Info, GraduationCap, Lock, FileText, MonitorPlay } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { createProgramLesson } from "@/app/admin/lessons/actions";
import MarkdownEditor from "@/components/MarkdownEditor";

interface NewLessonClientProps {
    moduleId?: string;
    programId?: string;
    userId: string;
}

interface FileAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
    category?: 'document' | 'slide';
}

export default function NewLessonClient({ moduleId, programId, userId }: NewLessonClientProps) {
    // Generate distinct UUIDs once for this session
    const [slidesPath] = useState(() => `${crypto.randomUUID()}/slides`);
    const [docsPath] = useState(() => `${crypto.randomUUID()}/docs`);

    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');

    // Content States
    const [documents, setDocuments] = useState<FileAttachment[]>([]); // Teacher Docs
    const [slides, setSlides] = useState<FileAttachment[]>([]);       // Student Slides

    // Not strictly needed for NewLesson since state starts empty, but good practice if we ever pre-fill


    const [content, setContent] = useState("");         // Student Content
    const [teacherContent, setTeacherContent] = useState(""); // Teacher Content (Private)

    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(formData: FormData) {
        setSubmitting(true);

        // Merge attachments with categories
        const allAttachments = [
            ...documents.map(f => ({ ...f, category: 'document' })),
            ...slides.map(f => ({ ...f, category: 'slide' }))
        ];

        // Add file attachments as JSON string
        formData.append("attachments", JSON.stringify(allAttachments));

        // Add content manually
        formData.set("content", content);
        formData.set("teacher_content", teacherContent);

        try {
            await createProgramLesson(formData);
        } catch (error: any) {
            // Ignore redirect errors which are actually successful navigations
            if (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT') || error.digest?.includes('NEXT_REDIRECT')) {
                return;
            }
            console.error("Submit error:", error);
            alert(`Bir hata oluştu: ${error.message || "Bilinmeyen hata"}`);
            setSubmitting(false);
        }
    }

    if (!moduleId || !programId) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Hata: Modül veya Program ID eksik.</p>
                <Link href="/admin/programs" className="text-kodrix-purple hover:underline mt-2 inline-block">
                    Programlara Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href={`/admin/programs/${programId}`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Programa Dön
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Yeni Ders Oluştur
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Ders içeriğini ve materyallerini ekleyin
                </p>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <input type="hidden" name="module_id" value={moduleId} />
                <input type="hidden" name="program_id" value={programId} />

                {/* Common Info Section (Always Visible) */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        Genel Bilgiler
                    </h3>

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
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
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
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>

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
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            placeholder="Örn: Python'a Giriş"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab('student')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'student'
                            ? "bg-white dark:bg-gray-700 text-kodrix-purple dark:text-amber-500 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Öğrenci Görünümü
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('teacher')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'teacher'
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-200 dark:ring-amber-800"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Lock className="w-4 h-4" />
                        Öğretmen Görünümü (Özel)
                    </button>
                </div>

                {/* STUDENT TAB CONTENT */}
                <div className={activeTab === 'student' ? 'block' : 'hidden'}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-8 shadow-sm">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                                    placeholder="45"
                                />
                            </div>
                        </div>
                        <label htmlFor="video_url" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Video Linki (YouTube)
                        </label>
                        <input
                            type="url"
                            id="video_url"
                            name="video_url"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            placeholder="https://youtube.com/..."
                        />
                        <div className="md:col-span-2">
                            <label htmlFor="meeting_link" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Canlı Ders / Toplantı Linki (Opsiyonel)
                            </label>
                            <input
                                type="url"
                                id="meeting_link"
                                name="meeting_link"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                                placeholder="Zoom / Google Meet vb. (Sınıf programında da ayarlanabilir)"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Kısa Açıklama
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none resize-none"
                                placeholder="Ders listesinde görünecek kısa açıklama..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Ders İçeriği (Öğrenci)
                            </label>
                            <MarkdownEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Dersin ana içeriği, kod örnekleri ve notlar..."
                                rows={10}
                            />
                        </div>

                        {/* Student Attachments */}
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                            <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <MonitorPlay className="w-4 h-4 text-blue-500" />
                                Öğrenci Materyalleri
                            </h3>
                            <div className="space-y-3">
                                <label className="block text-sm text-gray-600 dark:text-gray-400">
                                    Sunumlar, Slaytlar ve Kod Dosyaları
                                </label>
                                <FileUpload
                                    bucket="lesson-files"
                                    path={slidesPath}
                                    existingFiles={slides}
                                    onFilesChange={(files: any[]) => setSlides(files)}
                                    maxSizeMB={50}
                                    allowedTypes={["ppt", "pptx", "pdf", "zip", "png", "jpg"]}
                                    maxFiles={5}
                                    inputId="student-upload-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TEACHER TAB CONTENT */}
                <div className={activeTab === 'teacher' ? 'block' : 'hidden'}>
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-8 space-y-8 shadow-sm">

                        <div className="bg-amber-100 dark:bg-amber-900/40 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
                            <Lock className="w-5 h-5 flex-shrink-0" />
                            <p>
                                <strong>Gizli Alan:</strong> Buraya eklediğiniz içerik ve dosyalar <u>sadece öğretmenler</u> tarafından görüntülenebilir. Öğrenciler bu alanı göremez.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Öğretmen Notları & Planlama
                            </label>
                            <MarkdownEditor
                                value={teacherContent}
                                onChange={setTeacherContent}
                                placeholder="Müfredat notları, ders işleniş planı, cevap anahtarları..."
                                rows={10}
                                className="border-amber-200 dark:border-amber-800"
                            />
                        </div>

                        {/* Teacher Attachments */}
                        <div className="border-t border-amber-200 dark:border-amber-800/50 pt-6">
                            <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-600" />
                                Öğretmen Materyalleri
                            </h3>
                            <div className="space-y-3">
                                <label className="block text-sm text-gray-600 dark:text-gray-400">
                                    Müfredat Dokümanları, Sınav Hazırlıkları, Kaynaklar
                                </label>
                                <FileUpload
                                    bucket="lesson-files"
                                    path={docsPath}
                                    existingFiles={documents}
                                    onFilesChange={(files: any[]) => setDocuments(files)}
                                    maxSizeMB={50}
                                    allowedTypes={["pdf", "doc", "docx", "zip", "xlsx"]}
                                    maxFiles={10}
                                    inputId="teacher-upload-input"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Link
                        href={`/admin/programs/${programId}`}
                        className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-kodrix-purple to-purple-800 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-xl hover:shadow-lg hover:shadow-kodrix-purple/20 hover:scale-[1.02] transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {submitting ? "Kaydediliyor..." : "Dersi Kaydet"}
                    </button>
                </div>
            </form>
        </div>
    );
}
