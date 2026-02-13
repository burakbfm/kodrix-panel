"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface DeleteModuleButtonProps {
    moduleId: string;
    moduleTitle: string;
    deleteAction: (formData: FormData) => Promise<void>;
}

export default function DeleteModuleButton({ moduleId, moduleTitle, deleteAction }: DeleteModuleButtonProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        const formData = new FormData();
        formData.append("module_id", moduleId);

        startTransition(async () => {
            try {
                await deleteAction(formData);
                setShowDeleteDialog(false);
            } catch (error) {
                console.error("Silme hatası:", error);
                alert("Silme işlemi başarısız oldu.");
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition disabled:opacity-50"
                title="Sil"
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
                title="Modülü Sil"
                message={`"${moduleTitle}" modülünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve modüldeki tüm dersler de silinecektir.`}
                isPending={isPending}
            />
        </>
    );
}
