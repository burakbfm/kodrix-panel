"use client";

import { useState } from "react";
import { Calendar, Save, X } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";
import { createAssignment } from "@/app/admin/classes/class-actions";
// Note: We might need to ensure this action file exists or export it from a general place.
// I'll assume usage of the existing server actions pattern in ClassDetailPage or separate actions file.
// For now, I'll define the props to accept an onSubmit or use server action directly.

interface CreateAssignmentFormProps {
    classId: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CreateAssignmentForm({ classId, onCancel, onSuccess }: CreateAssignmentFormProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [maxScore, setMaxScore] = useState(100);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            alert("Lütfen bir başlık giriniz.");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("class_id", classId);
            formData.append("title", title);
            formData.append("description", description);
            if (dueDate) formData.append("due_date", new Date(dueDate).toISOString());
            formData.append("max_score", maxScore.toString());

            // Call the server action directly or via prop? 
            // Better to import it here if possible, but let's use the pattern of calling it from the props or directly importing if I can confirm location.
            // I'll dynamically import or expect it to be passed? 
            // Simpler: I'll assume createAssignment is available in the actions file I'm about to create/modify.

            const { createAssignment } = await import("@/app/admin/classes/class-actions");
            await createAssignment(formData);

            onSuccess();
        } catch (error) {
            console.error("Assignment create error:", error);
            alert("Ödev oluşturulurken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Yeni Ödev Oluştur</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Başlık *
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Örn: Hafta 1 Projesi"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Açıklama (Markdown Destekli)
                </label>
                <MarkdownEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Ödev detaylarını buraya yazın..."
                    rows={6}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Teslim Tarihi
                    </label>
                    <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Maksimum Puan
                    </label>
                    <input
                        type="number"
                        value={maxScore}
                        onChange={(e) => setMaxScore(parseInt(e.target.value))}
                        min="0"
                        max="1000"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                    />
                </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        "Oluşturuluyor..."
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Ödevi Oluştur
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
