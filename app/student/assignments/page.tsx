import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Clock, CheckCircle, XCircle, Upload } from "lucide-react";

export default async function StudentAssignmentsPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Lütfen giriş yapın</div>;
    }

    // Get student's classes
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("class_id, classes(id, name)")
        .eq("user_id", user.id);

    const classIds = enrollments?.map(e => e.class_id) || [];

    // Get assignments for these classes
    const { data: assignments } = await supabase
        .from("class_assignments")
        .select(`
      *,
      class:classes(id, name),
      lesson:class_lessons(id, title)
    `)
        .in("class_id", classIds)
        .eq("is_active", true)
        .order("due_date", { ascending: true });

    // For each assignment, check if student has submitted
    const assignmentsWithStatus = await Promise.all(
        (assignments || []).map(async (assignment) => {
            const { data: submission } = await supabase
                .from("class_assignment_submissions")
                .select("*")
                .eq("assignment_id", assignment.id)
                .eq("student_id", user.id)
                .single();

            const now = new Date();
            const dueDate = new Date(assignment.due_date);
            const isOverdue = now > dueDate;
            const timeRemaining = dueDate.getTime() - now.getTime();
            const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            return {
                ...assignment,
                submission,
                is_overdue: isOverdue,
                days_remaining: daysRemaining,
                hours_remaining: hoursRemaining,
                status: submission
                    ? submission.score !== null && submission.score !== undefined
                        ? "graded"
                        : "submitted"
                    : isOverdue
                        ? "overdue"
                        : "not_submitted",
            };
        })
    );

    // Group by class
    const assignmentsByClass = assignmentsWithStatus.reduce((acc: any, assignment) => {
        const className = assignment.class?.name || "Diğer";
        if (!acc[className]) {
            acc[className] = [];
        }
        acc[className].push(assignment);
        return acc;
    }, {});

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Ödevlerim
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Ödevlerinizi görüntüleyin ve teslim edin
                </p>
            </div>

            {/* Assignments by Class */}
            {Object.keys(assignmentsByClass).length > 0 ? (
                Object.entries(assignmentsByClass).map(([className, assignments]: [string, any]) => (
                    <div key={className} className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {className}
                        </h2>

                        <div className="grid gap-4">
                            {assignments.map((assignment: any) => {
                                const statusColors = {
                                    not_submitted: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
                                    submitted: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
                                    graded: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
                                    overdue: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
                                };

                                return (
                                    <div
                                        key={assignment.id}
                                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                        {assignment.title}
                                                    </h3>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[assignment.status as keyof typeof statusColors]
                                                            }`}
                                                    >
                                                        {assignment.status === "not_submitted"
                                                            ? "Teslim Edilmedi"
                                                            : assignment.status === "submitted"
                                                                ? "Teslim Edildi"
                                                                : assignment.status === "graded"
                                                                    ? "Notlandırıldı"
                                                                    : "Süre ​​Doldu"}
                                                    </span>

                                                    {assignment.is_overdue && !assignment.submission && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                                                            SÜRESI DOLDU
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                    {assignment.description}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        Son: {new Date(assignment.due_date).toLocaleString("tr-TR")}
                                                    </div>

                                                    {!assignment.is_overdue && assignment.status === "not_submitted" && (
                                                        <div className="text-orange-600 dark:text-orange-400 font-semibold">
                                                            {assignment.days_remaining > 0
                                                                ? `${assignment.days_remaining} gün ${assignment.hours_remaining} saat kaldı`
                                                                : `${assignment.hours_remaining} saat kaldı`}
                                                        </div>
                                                    )}

                                                    <div>📊 {assignment.max_points} puan</div>

                                                    {assignment.lesson && (
                                                        <div>📚 {assignment.lesson.title}</div>
                                                    )}

                                                    <div className="text-xs">
                                                        Teslim Tipi:{" "}
                                                        {assignment.submission_type === "file"
                                                            ? "Dosya"
                                                            : assignment.submission_type === "text"
                                                                ? "Yazı"
                                                                : "Dosya veya Yazı"}
                                                    </div>
                                                </div>

                                                {assignment.submission && (
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Teslim: {new Date(assignment.submission.submitted_at).toLocaleString("tr-TR")}
                                                        </div>

                                                        {assignment.submission.score !== null && assignment.submission.score !== undefined && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                    Puan:
                                                                </span>
                                                                <span className="px-3 py-1 rounded-full bg-blue-500 text-white font-bold">
                                                                    {assignment.submission.score}/{assignment.max_points}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                {assignment.status === "not_submitted" && !assignment.is_overdue && (
                                                    <Link
                                                        href={`/student/assignments/${assignment.id}`}
                                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
                                                    >
                                                        <Upload className="w-5 h-5" />
                                                        Teslim Et
                                                    </Link>
                                                )}

                                                {assignment.status === "submitted" && (
                                                    <Link
                                                        href={`/student/assignments/${assignment.id}/feedback`}
                                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
                                                    >
                                                        Detayları Gör
                                                    </Link>
                                                )}

                                                {assignment.status === "graded" && (
                                                    <Link
                                                        href={`/student/assignments/${assignment.id}/feedback`}
                                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
                                                    >
                                                        Notu Gör
                                                    </Link>
                                                )}

                                                {assignment.status === "overdue" && (
                                                    <button
                                                        disabled
                                                        className="px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed font-semibold"
                                                    >
                                                        Süresi Doldu
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Henüz ödev atanmamış
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Öğretmeniniz ödev atadığında burada görünecek
                    </p>
                </div>
            )}
        </div>
    );
}
