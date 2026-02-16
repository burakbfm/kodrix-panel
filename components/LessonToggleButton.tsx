"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface LessonToggleButtonProps {
    isActive: boolean;
    lessonId: string;
    classId: string;
    toggleAction: (formData: FormData) => Promise<void>;
}

export default function LessonToggleButton({
    isActive,
    lessonId,
    classId,
    toggleAction,
}: LessonToggleButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const formData = new FormData();
        formData.append("lesson_id", lessonId);
        formData.append("class_id", classId);
        formData.append("current_status", String(isActive));

        startTransition(async () => {
            await toggleAction(formData);
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition min-w-[120px] justify-center ${isActive
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                    : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                } ${isPending ? "opacity-70 cursor-wait" : ""}`}
        >
            {isPending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="animate-pulse">İşleniyor...</span>
                </>
            ) : isActive ? (
                <>
                    <EyeOff className="w-4 h-4" /> Pasife Al
                </>
            ) : (
                <>
                    <Eye className="w-4 h-4" /> Aktif Et
                </>
            )}
        </button>
    );
}
