"use client";

import { Trash2 } from "lucide-react";
import { useTransition, useState } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface RemoveProgramButtonProps {
    programId: string;
    classId: string;
    onRemove: (formData: FormData) => Promise<void>;
}

export function RemoveProgramButton({ programId, classId, onRemove }: RemoveProgramButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("program_id", programId);
            formData.append("class_id", classId);
            await onRemove(formData);
            setShowConfirm(false);
        });
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                title="Programı Kaldır"
            >
                <Trash2 className="w-5 h-5" />
            </button>

            <DeleteConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Programı Kaldır"
                message="Bu programı kaldırmak istediğinize emin misiniz? Sınıfa tanımlı tüm dersler silinecektir. Bu işlem geri alınamaz."
                isPending={isPending}
            />
        </>
    );
}
