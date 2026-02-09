"use client";

import { Trash2 } from "lucide-react";
import { deleteClass } from "@/app/admin/actions";
import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

interface DeleteClassButtonProps {
    classId: string;
    className: string;
}

export function DeleteClassButton({ classId, className }: DeleteClassButtonProps) {
    const [isPending, setIsPending] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async () => {
        setIsPending(true);
        const formData = new FormData();
        formData.append("classId", classId);

        await deleteClass(formData);
        setIsPending(false);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={isPending}
                className="bg-red-50 dark:bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-500 hover:text-white px-4 py-3 rounded-lg transition border border-red-200 dark:border-red-500/20 hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sınıfı Sil"
            >
                <Trash2 className="w-5 h-5" />
            </button>

            <ConfirmModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDelete}
                title="Sınıfı Sil"
                message={`"${className}" sınıfını silmek istediğine emin misin? Bu işlem geri alınamaz.`}
                confirmText="Evet, Sil"
                cancelText="İptal"
                isDangerous={true}
            />
        </>
    );
}
