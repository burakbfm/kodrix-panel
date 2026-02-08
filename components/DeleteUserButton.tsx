"use client";

import { Trash2 } from "lucide-react";
import { deleteUser } from "@/app/admin/actions";
import { useState } from "react";

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!confirm(`"${userName}" kullanıcısını silmek istediğine emin misin?`)) {
            return;
        }

        setIsPending(true);
        const formData = new FormData();
        formData.append("userId", userId);

        await deleteUser(formData);
        setIsPending(false);
    };

    return (
        <form onSubmit={handleDelete}>
            <button
                type="submit"
                disabled={isPending}
                className="p-2 hover:bg-red-500/20 text-red-500 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Kullanıcıyı Sil"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </form>
    );
}
