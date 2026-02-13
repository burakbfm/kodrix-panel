"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, Clock, Target, Edit, CheckCircle2, AlertCircle } from "lucide-react";
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
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab("published")}
                    className={`pb-3 px-1 text-sm font-semibold transition relative ${activeTab === "published"
                        ? "text-kodrix-purple dark:text-amber-500"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                >
                    Yayınlananlar
                    {activeTab === "published" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kodrix-purple dark:bg-amber-500 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`pb-3 px-1 text-sm font-semibold transition relative flex items-center gap-2 ${activeTab === "pending"
                        ? "text-kodrix-purple dark:text-amber-500"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                >
                    Onay Bekleyenler
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                            {pendingCount}
                        </span>
                    )}
                    {activeTab === "pending" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kodrix-purple dark:bg-amber-500 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Grid */}
            {filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center shadow-md shadow-purple-500/20 dark:shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6 text-white dark:text-gray-900" />
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/quizzes/${quiz.id}`}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-kodrix-purple dark:hover:text-amber-500"
                                        title="Düzenle"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition-colors">
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
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${difficultyColors[quiz.difficulty as keyof typeof difficultyColors]?.replace("bg-", "bg-opacity-10 border-") ||
                                        "border-yellow-200 bg-yellow-50 text-yellow-700"
                                        }`}
                                >
                                    {quiz.difficulty === "easy"
                                        ? "Kolay"
                                        : quiz.difficulty === "hard"
                                            ? "Zor"
                                            : "Orta"}
                                </span>

                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                    {quiz.question_count} Soru
                                </span>

                                {quiz.time_limit_minutes && (
                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {quiz.time_limit_minutes} dk
                                    </span>
                                )}
                            </div>

                            {/* Author info if available */}
                            {quiz.created_by_profile && (
                                <div className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                    {quiz.created_by_profile.full_name}
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-medium">
                                    {new Date(quiz.created_at).toLocaleDateString("tr-TR")}
                                </span>

                                {activeTab === "pending" ? (
                                    <button
                                        onClick={() => handleApprove(quiz.id)}
                                        disabled={isPending}
                                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1 transition shadow-lg shadow-green-500/20"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Onayla
                                    </button>
                                ) : (
                                    <Link
                                        href={`/admin/quizzes/${quiz.id}`}
                                        className="text-kodrix-purple dark:text-amber-500 hover:text-purple-700 dark:hover:text-amber-400 font-semibold text-sm flex items-center gap-1"
                                    >
                                        Detaylar →
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    {activeTab === "pending" ? (
                        <>
                            <CheckCircle2 className="w-16 h-16 mx-auto text-green-100 dark:text-green-900/20 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Bekleyen quiz yok
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Harika! Tüm quizler incelendi ve onaylandı.
                            </p>
                        </>
                    ) : (
                        <>
                            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Henüz yayınlanmış quiz yok
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                İlk quizinizi oluşturarak başlayın
                            </p>
                            <Link
                                href="/admin/quizzes/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
                            >
                                <div className="w-5 h-5"><div className="w-0.5 h-full mx-auto bg-current rotate-90" /><div className="h-0.5 w-full my-auto bg-current -rotate-90" /></div> {/* Custom Plus Icon because imports might be finicky here, or easier just reuse Plus from lucide */}
                                Quiz Oluştur
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
