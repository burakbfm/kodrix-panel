"use client";

import { Trash2 } from "lucide-react";
import { deleteQuizAssignment } from "@/app/admin/classes/class-actions";
import { useState, useTransition } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface DeleteQuizButtonProps {
    classQuizId: string;
    classId: string;
}

export default function DeleteQuizButton({ classQuizId, classId }: DeleteQuizButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("class_quiz_id", classQuizId);
            formData.append("class_id", classId);
            await deleteQuizAssignment(formData);
            setIsOpen(false);
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={isPending}
                className="text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                title="Atamayı Kaldır"
            >
                <Trash2 className="w-4 h-4" />
                Kaldır
            </button>

            <DeleteConfirmDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={handleDelete}
                title="Quizi Kaldır"
                message="Bu quizi sınıftan kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz."
                isPending={isPending}
            />
        </>
    );
}
