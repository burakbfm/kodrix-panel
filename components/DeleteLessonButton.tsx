"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteLesson } from "@/app/admin/actions";

interface DeleteLessonButtonProps {
    programId: string;
    classId?: string; // Optional because we use this in programs too
    lessonId: string;
}

export function DeleteLessonButton({ programId, lessonId }: DeleteLessonButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Link tıklamasını engelle

        if (!confirm("⚠️ Bu dersi silmek istediğinize emin misiniz?")) {
            return;
        }

        setIsDeleting(true);
        try {
            // We need a specific action for deleting program lessons if logic differs, 
            // but generic remove row is fine.
            // However, deleteLesson in actions.ts expects classId currently for revalidation.
            // We should create a specifically tailored action or update the existing one.
            // Let's call a new wrapper action to avoid confusion.
            await deleteLesson(programId, lessonId);
        } catch (error) {
            console.error("Error deleting lesson:", error);
            alert("Ders silinirken bir hata oluştu.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition ml-2"
            title="Dersi Sil"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
