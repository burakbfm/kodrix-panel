"use client";

import Link from "next/link";
import { BookOpen, Edit, Trash2, Layers, Clock } from "lucide-react";
import { useState, useTransition } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { PROGRAM_ICONS } from "@/components/IconPicker";

interface ProgramCardProps {
    program: any;
    deleteAction: (formData: FormData) => Promise<void>;
}

export default function ProgramCard({ program, deleteAction }: ProgramCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        const formData = new FormData();
        formData.append("program_id", program.id);

        startTransition(() => {
            deleteAction(formData);
            setShowDeleteDialog(false);
        });
    };

    // Get icon from database or use default
    const programIcon = PROGRAM_ICONS.find(icon => icon.id === program.icon) || PROGRAM_ICONS.find(icon => icon.id === "code");

    // Calculate total duration in hours
    const totalHours = program.total_duration_minutes
        ? Math.floor(program.total_duration_minutes / 60)
        : 0;
    const totalMinutes = program.total_duration_minutes
        ? program.total_duration_minutes % 60
        : 0;

    return (
        <div
            className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:border-kodrix-purple/30 dark:hover:border-amber-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className="flex items-start justify-between mb-5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${programIcon!.colors.light} dark:bg-gradient-to-br dark:${programIcon!.colors.dark} flex items-center justify-center text-3xl shadow-sm group-hover:shadow-md transition-shadow`}>
                    {programIcon!.emoji}
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/admin/programs/${program.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-purple-600 dark:hover:text-amber-400"
                        title="Düzenle"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isPending}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50 text-gray-400 hover:text-red-500"
                        title="Sil"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-amber-400 transition-colors">
                {program.title}
            </h3>

            {program.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                    {program.description}
                </p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-gray-700">
                    <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                    <span className="text-gray-600 dark:text-gray-300">{program.module_count} Modül</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-gray-700">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                    <span className="text-gray-600 dark:text-gray-300">{program.lesson_count} Ders</span>
                </div>
                {program.total_duration_minutes > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-gray-700">
                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                            {totalHours > 0 && `${totalHours}s `}
                            {totalMinutes > 0 && `${totalMinutes}dk`}
                        </span>
                    </div>
                )}
                {program.duration_weeks && (
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-gray-700">
                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                        <span className="text-gray-600 dark:text-gray-300">{program.duration_weeks} hafta</span>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Son güncelleme: Bugün</span>
                <Link
                    href={`/admin/programs/${program.id}`}
                    className="text-sm font-semibold text-purple-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                    Detaylar <span className="text-lg leading-none">→</span>
                </Link>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Programı Sil"
                message={`"${program.title}" programını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve programdaki tüm modüller ve dersler de silinecektir.`}
                isPending={isPending}
            />
        </div>
    );
}
