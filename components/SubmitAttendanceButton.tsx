"use client";

import { useFormStatus } from "react-dom";
import { Save, Loader2 } from "lucide-react";

export default function SubmitAttendanceButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100"
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kaydediliyor...
                </>
            ) : (
                <>
                    <Save className="w-5 h-5" />
                    Yoklamayı Kaydet
                </>
            )}
        </button>
    );
}
