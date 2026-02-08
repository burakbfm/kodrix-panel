"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProgram } from "@/app/admin/actions"; // We'll create this

interface DeleteProgramButtonProps {
    programId: string;
}

export function DeleteProgramButton({ programId }: DeleteProgramButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Bu programı TAMAMEN silmek istediğinize emin misiniz? Tüm modüller ve dersler silinecektir!")) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteProgram(programId);
        } catch (error) {
            console.error("Error deleting program:", error);
            alert("Program silinirken bir hata oluştu.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            title="Programı Sil"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    );
}
