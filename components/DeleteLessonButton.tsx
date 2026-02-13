"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteProgramLesson } from "@/app/admin/lessons/actions";

interface DeleteLessonButtonProps {
    lessonId: string;
    programId: string;
    lessonTitle: string;
}

export default function DeleteLessonButton({ lessonId, programId, lessonTitle }: DeleteLessonButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    async function handleDelete() {
        setIsDeleting(true);
        try {
            await deleteProgramLesson(lessonId, programId);
            setShowConfirm(false);
            // Router refresh or revalidate is handled by the server action
        } catch (error) {
            console.error("Delete error:", error);
            alert("Silme işlemi başarısız oldu.");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                title="Dersi Sil"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <DeleteConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Dersi Sil"
                message={`"${lessonTitle}" adlı dersi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                isPending={isDeleting}
            />
        </>
    );
}
