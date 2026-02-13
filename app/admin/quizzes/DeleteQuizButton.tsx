"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteQuiz } from "@/app/admin/actions"; // We'll verify this action exists or create it

interface DeleteQuizButtonProps {
    quizId: string;
    quizTitle: string;
}

export default function DeleteQuizButton({ quizId, quizTitle }: DeleteQuizButtonProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append("quizId", quizId);
                await deleteQuiz(formData);
                setShowDeleteDialog(false);
            } catch (error) {
                console.error("Quiz silme hatası:", error);
                alert("Quiz silinirken bir hata oluştu.");
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                title="Quizi Sil"
                type="button"
            >
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Trash2 className="w-4 h-4" />
                )}
            </button>

            <DeleteConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Quizi Sil"
                message={`"${quizTitle}" başlıklı quizi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                isPending={isPending}
            />
        </>
    );
}
