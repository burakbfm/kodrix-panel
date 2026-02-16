"use client";

import Link from "next/link";
import { BookOpen, Edit, Trash2, Layers, Clock, ArrowRight } from "lucide-react";
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
            className="group relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-500/10 transition-colors"></div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${programIcon!.colors.light} dark:bg-gradient-to-br dark:${programIcon!.colors.dark} flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                        {programIcon!.emoji}
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/admin/programs/${program.id}`}
                            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-teal-600 dark:hover:text-amber-400 border border-transparent hover:border-gray-100 dark:hover:border-white/10"
                            title="Düzenle"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={isPending}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition disabled:opacity-50 text-gray-400 hover:text-red-500 border border-transparent hover:border-red-100 dark:hover:border-red-900/10"
                            title="Sil"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-emerald-400 transition-colors">
                    {program.title}
                </h3>

                {program.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                        {program.description}
                    </p>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300">
                        <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
                        <span>{program.module_count} Modül</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300">
                        <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
                        <span>{program.lesson_count} Ders</span>
                    </div>
                    {program.total_duration_minutes > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
                            <span>
                                {totalHours > 0 && `${totalHours}s `}
                                {totalMinutes > 0 && `${totalMinutes}dk`}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <Link
                href={`/admin/programs/${program.id}`}
                className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center group/link mt-auto"
            >
                <span className="text-xs text-gray-400 font-medium group-hover/link:text-teal-600 dark:group-hover/link:text-emerald-400 transition-colors">
                    Program Detayları
                </span>
                <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover/link:bg-teal-50 dark:group-hover/link:bg-emerald-500/20 group-hover/link:text-teal-600 dark:group-hover/link:text-emerald-400 transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                </span>
            </Link>

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
