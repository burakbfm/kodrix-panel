"use client";

import { Trash2, FileText, Calendar, CheckCircle, Clock } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useTransition, useState } from "react";
import { deleteAssignment } from "@/app/admin/classes/class-actions";
import LessonAttachments from "@/components/LessonAttachments";

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    max_score: number;
    submission_count?: number;
    created_at: string;
    attachments?: any;
}

interface ClassAssignmentsProps {
    classId: string;
    assignments: Assignment[];
}

export default function ClassAssignments({ classId, assignments }: ClassAssignmentsProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!deleteId) return;
        startTransition(async () => {
            const formData = new FormData();
            formData.append("assignment_id", deleteId);
            formData.append("class_id", classId);
            await deleteAssignment(formData);
            setDeleteId(null);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ödevler Listesi</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Toplam {assignments.length} ödev</p>
                </div>
            </div>

            {assignments.length > 0 ? (
                <div className="grid gap-4">
                    {assignments.map((assignment) => {
                        const isExpired = assignment.due_date && new Date(assignment.due_date) < new Date();

                        return (
                            <div
                                key={assignment.id}
                                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-4 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="bg-orange-100 dark:bg-orange-900/20 p-2.5 rounded-lg text-orange-600 dark:text-orange-400 mt-1">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {assignment.title}
                                                </h3>
                                                {assignment.description && (
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 mb-2">
                                                        {assignment.description}
                                                    </p>
                                                )}
                                                {assignment.due_date && (
                                                    <div className={`flex items-center gap-1.5 text-xs font-medium mt-0.5 ${isExpired ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                                                        }`}>
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(assignment.due_date).toLocaleDateString("tr-TR", {
                                                            day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                                                        })}
                                                        {isExpired && " (Süresi Doldu)"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats chips */}
                                        <div className="flex items-center gap-3 pl-14 flex-wrap">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                {assignment.submission_count || 0} Gönderim
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                                                Max Puan: {assignment.max_score}
                                            </span>
                                        </div>

                                        {/* Attachments */}
                                        {assignment.attachments && (
                                            <div className="pl-14 mt-4">
                                                <LessonAttachments attachments={assignment.attachments} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 md:pl-0">
                                        <button
                                            onClick={() => setDeleteId(assignment.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            title="Ödevi Sil"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Henüz ödev yok</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Yukarıdaki formu kullanarak ilk ödevi oluşturun
                    </p>
                </div>
            )}

            <DeleteConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Ödevi Sil"
                message="Bu ödevi ve tüm öğrenci gönderimlerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                isPending={isPending}
            />
        </div>
    );
}
