"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { BookOpen, Trash2, Edit } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface ModuleCardProps {
    module: any;
    moduleIndex: number;
    programId: string;
}

export default function ModuleCard({ module, moduleIndex, programId }: ModuleCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleDelete = () => {
        if (formRef.current) {
            setIsDeleting(true);
            formRef.current.submit();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-kodrix-purple/10 dark:bg-amber-500/10 text-kodrix-purple dark:text-amber-500 font-bold">
                        {moduleIndex + 1}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {module.title}
                        </h3>
                        {module.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {module.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Link
                        href={`/admin/programs/${programId}/modules/${module.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold flex items-center gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        Dersler
                    </Link>

                    <Link
                        href={`/admin/programs/${programId}/modules/${module.id}/edit`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        title="Düzenle"
                    >
                        <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </Link>

                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition disabled:opacity-50"
                        title="Sil"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Lessons List */}
            {module.lessons && module.lessons.length > 0 ? (
                <div className="mt-4 space-y-2 pl-11">
                    {module.lessons.map((lesson: any, lessonIndex: number) => (
                        <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {lessonIndex + 1}.
                            </span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                {lesson.title}
                            </span>
                            {lesson.duration_minutes && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                    {lesson.duration_minutes} dk
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 pl-11">
                    Bu modülde henüz ders yok
                </p>
            )}

            {/* Hidden deletion form - must be outside dialog to work */}
            <form
                ref={formRef}
                action={`/admin/programs/${programId}`}
                method="POST"
                className="hidden"
            >
                <input type="hidden" name="_action" value="delete_module" />
                <input type="hidden" name="module_id" value={module.id} />
            </form>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Modülü Sil"
                message={`"${module.title}" modülünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve modüldeki tüm dersler de silinecektir.`}
                isPending={isDeleting}
            />
        </div>
    );
}
