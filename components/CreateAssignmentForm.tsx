"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { createAssignment } from "@/app/admin/classes/class-actions";
import FileUpload from "@/components/FileUpload";
import { SubmitButton } from "@/components/SubmitButton";

interface CreateAssignmentFormProps {
    classId: string;
}

export default function CreateAssignmentForm({ classId }: CreateAssignmentFormProps) {
    const [files, setFiles] = useState<any[]>([]);

    // We need to wrap the server action to include files
    const handleSubmit = async (formData: FormData) => {
        // Append files as JSON string
        formData.append("attachments", JSON.stringify(files));
        await createAssignment(formData);

        // Reset files after successful submission (though form reset might need more work if not fully controlled)
        // ideally we reset state here. But server action revalidates path, so page might refresh?
        // Actually, for better UX with server actions, we might want to use a ref or controlled inputs if we want to clear them.
        // For now, let's rely on standard form submission behavior + state reset.
        setFiles([]);

        // Reset the form
        const form = document.getElementById("create-assignment-form") as HTMLFormElement;
        if (form) form.reset();
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Ödev Oluştur
            </h3>
            <form id="create-assignment-form" action={handleSubmit} className="space-y-6">
                <input type="hidden" name="class_id" value={classId} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ödev Başlığı *</label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="Örn: Hafta 1 - Proje Ödevi"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maksimum Puan</label>
                        <input
                            type="number"
                            name="max_score"
                            defaultValue={100}
                            min={1}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple outline-none transition"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                    <textarea
                        name="description"
                        rows={3}
                        placeholder="Ödev detaylarını yazın..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-kodrix-purple outline-none transition"
                    />
                </div>

                {/* File Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dosya Ekleri</label>
                    <FileUpload
                        bucket="assignment-files"
                        path={`assignments/${classId}/${Date.now()}`}
                        onFilesChange={setFiles}
                        maxSizeMB={20}
                        maxFiles={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Öğrenciler için kaynak dosyalar ekleyebilirsiniz (PDF, Resim, Zip vb.)
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlangıç Tarihi</label>
                        <input
                            type="datetime-local"
                            name="start_date"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bitiş Tarihi</label>
                        <input
                            type="datetime-local"
                            name="due_date"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple outline-none transition"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <SubmitButton
                        className="px-6 py-2.5 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                        loadingText="Oluşturuluyor..."
                    >
                        <Plus className="w-4 h-4" />
                        Ödev Oluştur
                    </SubmitButton>
                </div>
            </form>
        </div>
    );
}
