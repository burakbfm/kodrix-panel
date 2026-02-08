"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteModule } from "@/app/admin/actions"; // We'll create this

interface DeleteModuleButtonProps {
    programId: string;
    moduleId: string;
}

export function DeleteModuleButton({ programId, moduleId }: DeleteModuleButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Bu modülü silmek istediğinize emin misiniz? İçindeki tüm dersler de silinecektir!")) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteModule(programId, moduleId);
        } catch (error) {
            console.error("Error deleting module:", error);
            alert("Modül silinirken bir hata oluştu.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition"
            title="Modülü Sil"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    );
}
