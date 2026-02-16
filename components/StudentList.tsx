"use client";

import { useState, Fragment } from "react";
import { Trash2, ChevronDown, ChevronUp, FileText, CheckCircle, Clock } from "lucide-react";
import StudentAttendanceGrid from "@/components/StudentAttendanceGrid";
import { removeStudent } from "@/app/admin/classes/class-actions";

interface StudentListProps {
    classId: string;
    students: any[];
    classLessons: any[];
    classAssignments: any[];
    classQuizzes: any[];
    allAttendance: any[];
    allAssignmentSubmissions: any[];
    allQuizSubmissions: any[];
}

export default function StudentList({
    classId,
    students,
    classLessons,
    classAssignments,
    classQuizzes,
    allAttendance,
    allAssignmentSubmissions,
    allQuizSubmissions
}: StudentListProps) {
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

    const toggleExpand = (studentId: string) => {
        if (expandedStudentId === studentId) {
            setExpandedStudentId(null);
        } else {
            setExpandedStudentId(studentId);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Öğrenci</th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Okul No</th>
                        <th className="text-center px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Katılım Durumu</th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">E-posta</th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Kayıt Tarihi</th>
                        <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {students.map((enrollment: any) => {
                        const studentId = enrollment.user_id;
                        const isExpanded = expandedStudentId === studentId;

                        // Calculate Stats
                        const studentAttendance = allAttendance.filter(a => a.student_id === studentId && a.status === 'present');
                        const attendedCount = studentAttendance.length;
                        const totalLessons = classLessons.filter(l => l.is_active).length;

                        const studentAssignments = allAssignmentSubmissions.filter(s => s.student_id === studentId);
                        const completedAssignments = studentAssignments.length;
                        const totalAssignments = classAssignments.length;

                        const studentQuizzes = allQuizSubmissions.filter(s => s.student_id === studentId);
                        const solvedQuizzes = studentQuizzes.length;
                        const totalQuizzes = classQuizzes.length;

                        // Average Score Calculation
                        let totalScore = 0;
                        let countScores = 0;

                        // Assignment Scores (normalized to 100 if possible, but let's assume raw averages if max_score varies)
                        studentAssignments.forEach((sub: any) => {
                            if (sub.score !== null && sub.score !== undefined) {
                                // Find assignment max score
                                const assign = classAssignments.find(a => a.id === sub.assignment_id);
                                const max = assign?.max_score || 100;
                                totalScore += (sub.score / max) * 100;
                                countScores++;
                            }
                        });

                        // Quiz Scores
                        studentQuizzes.forEach((sub: any) => {
                            if (sub.score !== null && sub.score !== undefined) {
                                // Find quiz passing score or max? Quizzes usually have points per question.
                                // Assuming 100 for now or finding quiz max points is hard without fetching structure.
                                // Let's just average the raw score if it's out of 100, or just sum them.
                                // For now, let's assume quiz score is percent or standard 100.
                                totalScore += sub.score;
                                countScores++;
                            }
                        });

                        const averageScore = countScores > 0 ? Math.round(totalScore / countScores) : 0;

                        return (
                            <Fragment key={enrollment.id}>
                                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${isExpanded ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center font-bold text-white dark:text-gray-900 text-sm">
                                                {enrollment.student?.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {enrollment.student?.full_name || "İsimsiz"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                                        {enrollment.student?.school_number || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <StudentAttendanceGrid
                                                lessons={classLessons?.filter(l => l.is_active).map(l => ({ id: l.id, title: l.title, date: l.lesson_date })) || []}
                                                attendance={allAttendance?.filter(a => a.student_id === enrollment.user_id) || []}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                                        {enrollment.student?.email || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                                        {enrollment.created_at
                                            ? new Date(enrollment.created_at).toLocaleDateString("tr-TR")
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <form action={removeStudent}>
                                                <input type="hidden" name="enrollment_id" value={enrollment.id} />
                                                <input type="hidden" name="class_id" value={classId} />
                                                <button
                                                    type="submit"
                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title="Öğrenciyi Çıkar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </form>
                                            <button
                                                onClick={() => toggleExpand(studentId)}
                                                className={`p-2 rounded-lg transition ${isExpanded ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                                                title="Detayları Gör"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-gray-50 dark:bg-gray-800/30">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                {/* Attendance Stats */}
                                                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                                            <CheckCircle className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Katılım</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                        {attendedCount} <span className="text-sm text-gray-400 font-normal">/ {classLessons.length}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 mt-3 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-green-500 h-full rounded-full"
                                                            style={{ width: `${Math.min(100, (attendedCount / Math.max(1, classLessons.length)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Assignments Stats */}
                                                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Ödevler</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                        {completedAssignments} <span className="text-sm text-gray-400 font-normal">/ {totalAssignments}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 mt-3 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-blue-500 h-full rounded-full"
                                                            style={{ width: `${Math.min(100, (completedAssignments / Math.max(1, totalAssignments)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Quizzes Stats */}
                                                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                                            <Clock className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Quizler</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                        {solvedQuizzes} <span className="text-sm text-gray-400 font-normal">/ {totalQuizzes}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 mt-3 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-purple-500 h-full rounded-full"
                                                            style={{ width: `${Math.min(100, (solvedQuizzes / Math.max(1, totalQuizzes)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Performance Score */}
                                                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                                                            <CheckCircle className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Ortalama Puan</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                        {averageScore}
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 mt-3 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-orange-500 h-full rounded-full"
                                                            style={{ width: `${Math.min(100, averageScore)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
