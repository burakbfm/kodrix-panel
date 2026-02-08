"use client";

import { Trash2 } from "lucide-react";
import { deletePaymentTransaction } from "@/app/admin/actions";
import { useState } from "react";

interface DeleteTransactionButtonProps {
    transactionId: string;
    studentId: string;
}

export function DeleteTransactionButton({ transactionId, studentId }: DeleteTransactionButtonProps) {
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?')) {
            return;
        }

        setIsPending(true);
        const formData = new FormData();
        formData.append("transactionId", transactionId);
        formData.append("studentId", studentId);

        await deletePaymentTransaction(formData);
        setIsPending(false);
    };

    return (
        <form onSubmit={handleDelete} className="inline">
            <button
                type="submit"
                disabled={isPending}
                className="p-2 hover:bg-red-500/20 text-red-500 rounded transition disabled:opacity-50"
                title="Ödemeyi Sil"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </form>
    );
}
