"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, Clock, Target, Edit, CheckCircle2, AlertCircle, BrainCircuit, ArrowRight, Plus } from "lucide-react";
import DeleteQuizButton from "@/app/admin/quizzes/DeleteQuizButton";
import { approveQuiz } from "@/app/admin/quizzes/actions";

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    time_limit_minutes: number | null;
    passing_score: number | null;
    created_at: string;
    question_count: number;
    status: string; // 'published' | 'pending' | 'draft'
    created_by_profile?: {
        full_name: string;
    };
}

interface QuizListProps {
    quizzes: Quiz[];
}

export default function QuizList({ quizzes }: QuizListProps) {
    const [activeTab, setActiveTab] = useState<"published" | "pending">("published");
    const [isPending, startTransition] = useTransition();

    const filteredQuizzes = quizzes.filter(q => {
        if (activeTab === "published") return q.status === "published";
        if (activeTab === "pending") return q.status === "pending";
        return true;
    });

    const pendingCount = quizzes.filter(q => q.status === "pending").length;

    const handleApprove = (quizId: string) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("quiz_id", quizId);
            await approveQuiz(formData);
        });
    };

    const difficultyColors = {
        easy: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
        medium: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
        hard: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl w-fit border border-gray-200 dark:border-white/5">
                <button
                    onClick={() => setActiveTab("published")}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "published"
                        ? "bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                >
                    Yayınlananlar
                </button>
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "pending"
                        ? "bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                >
                    Onay Bekleyenler
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 text-xs">
                            {pendingCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Grid */}
            {filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="group relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-6 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-500/10 transition-colors"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        <BrainCircuit className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/quizzes/${quiz.id}`}
                                            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 border border-transparent hover:border-gray-100 dark:hover:border-white/10"
                                            title="Düzenle"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                    {quiz.title}
                                </h3>

                                {quiz.description && (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                        {quiz.description}
                                    </p>
                                )}

                                {!quiz.description && <div className="min-h-[40px] mb-4"></div>}

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${difficultyColors[quiz.difficulty as keyof typeof difficultyColors]?.replace("bg-", "bg-opacity-50 dark:bg-opacity-10 border-") ||
                                            "border-yellow-200 bg-yellow-50 text-yellow-700"
                                            }`}
                                    >
                                        {quiz.difficulty === "easy"
                                            ? "Kolay"
                                            : quiz.difficulty === "hard"
                                                ? "Zor"
                                                : "Orta"}
                                    </span>

                                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5">
                                        {quiz.question_count} Soru
                                    </span>

                                    {quiz.time_limit_minutes && (
                                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {quiz.time_limit_minutes} dk
                                        </span>
                                    )}
                                </div>

                                {/* Author info if available */}
                                {quiz.created_by_profile && (
                                    <div className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                            {(quiz.created_by_profile.full_name || "?").charAt(0)}
                                        </div>
                                        {quiz.created_by_profile.full_name || "İsimsiz"}
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-medium">
                                    {new Date(quiz.created_at).toLocaleDateString("tr-TR")}
                                </span>

                                {activeTab === "pending" ? (
                                    <button
                                        onClick={() => handleApprove(quiz.id)}
                                        disabled={isPending}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition shadow-lg shadow-green-500/20"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Onayla
                                    </button>
                                ) : (
                                    <Link
                                        href={`/admin/quizzes/${quiz.id}`}
                                        className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-bold text-sm flex items-center gap-1"
                                    >
                                        Detaylar <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-gray-50/50 dark:bg-white/5">
                    {activeTab === "pending" ? (
                        <>
                            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Bekleyen quiz yok
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Harika! Tüm quizler incelendi ve onaylandı.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Henüz yayınlanmış quiz yok
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                                İlk quizinizi oluşturarak başlayın
                            </p>
                            <Link
                                href="/admin/quizzes/new"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all font-bold"
                            >
                                <Plus className="w-5 h-5" />
                                Quiz Oluştur
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
