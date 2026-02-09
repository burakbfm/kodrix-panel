import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, Upload } from "lucide-react";
import { revalidatePath } from "next/cache";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AssignmentsPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get class
    const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

    if (!classData) {
        notFound();
    }

    // Get class assignments
    const { data: assignments } = await supabase
        .from("class_assignments")
        .select(`
      *,
      lesson:class_lessons(id, title, lesson_date),
      created_by_profile:profiles!class_assignments_created_by_fkey(id, full_name)
    `)
        .eq("class_id", id)
        .order("due_date", { ascending: false });

    // Get lessons for selection
    const { data: lessons } = await supabase
        .from("class_lessons")
        .select("*")
        .eq("class_id", id)
        .order("lesson_date", { ascending: false });

    // Get enrolled students count
    const { count: studentCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", id);

    // For each assignment, get submission count
    const assignmentsWithStats = await Promise.all(
        (assignments || []).map(async (assignment) => {
            const { count: submissionCount } = await supabase
                .from("class_assignment_submissions")
                .select("*", { count: "exact", head: true })
                .eq("assignment_id", assignment.id);

            return {
                ...assignment,
                submission_count: submissionCount || 0,
                total_students: studentCount || 0,
            };
        })
    );

    async function createAssignment(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const assignmentData = {
            class_id: id,
            lesson_id: (formData.get("lesson_id") as string) || null,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            due_date: formData.get("due_date") as string,
            max_points: parseInt(formData.get("max_points") as string) || 100,
            is_active: formData.get("is_active") === "true",
            allow_late_submission: formData.get("allow_late_submission") === "true",
        };

        const { error } = await supabase.from("class_assignments").insert(assignmentData);

        if (error) {
            console.error("Ödev oluşturma hatası:", error);
            return;
        }

        revalidatePath(`/admin/classes/${id}/assignments`);
        redirect(`/admin/classes/${id}/assignments`);
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/admin/classes/${id}?tab=overview`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Sınıf Detayı
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Ödev Yönetimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {classData.name} sınıfı için ödev oluşturun ve yönetin
                </p>
            </div>

            {/* Create New Assignment */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Yeni Ödev Oluştur
                </h2>
                <form action={createAssignment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ödev Başlığı *
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="Örn: Python Fonksiyonları Ödevi"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Açıklama *
                        </label>
                        <textarea
                            name="description"
                            required
                            rows={4}
                            placeholder="Ödev açıklaması, talimatlar, beklentiler..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Ders (İsteğe Bağlı)
                            </label>
                            <select
                                name="lesson_id"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            >
                                <option value="">Seçiniz...</option>
                                {lessons?.map((lesson: any) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        {new Date(lesson.lesson_date).toLocaleDateString("tr-TR")} - {lesson.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Teslim Tarihi *
                            </label>
                            <input
                                type="datetime-local"
                                name="due_date"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Maksimum Puan
                            </label>
                            <input
                                type="number"
                                name="max_points"
                                defaultValue={100}
                                min={1}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                value="true"
                                defaultChecked
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                            />
                            <label htmlFor="is_active" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Öğrenciler görebilsin (aktif)
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="allow_late_submission"
                                name="allow_late_submission"
                                value="true"
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple focus:ring-2 focus:ring-kodrix-purple"
                            />
                            <label htmlFor="allow_late_submission" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Geç teslime izin ver
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ödev Oluştur
                    </button>
                </form>
            </div>

            {/* Assignments List */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Ödevler
                </h2>

                {assignmentsWithStats && assignmentsWithStats.length > 0 ? (
                    <div className="grid gap-4">
                        {assignmentsWithStats.map((assignment: any) => {
                            const submissionRate =
                                assignment.total_students > 0
                                    ? (assignment.submission_count / assignment.total_students) * 100
                                    : 0;

                            const isOverdue = new Date(assignment.due_date) < new Date();

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
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.is_active
                                                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                        }`}
                                                >
                                                    {assignment.is_active ? "Aktif" : "Pasif"}
                                                </span>
                                                {isOverdue && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                                                        Süresi Doldu
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                {assignment.description}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="text-gray-600 dark:text-gray-400">
                                                    📅 Teslim: {new Date(assignment.due_date).toLocaleString("tr-TR")}
                                                </div>

                                                <div className="text-gray-600 dark:text-gray-400">
                                                    📊 {assignment.max_points} puan
                                                </div>

                                                {assignment.lesson && (
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        📚 {assignment.lesson.title}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                        Teslim:
                                                    </span>
                                                    <span className="px-3 py-1 rounded-full bg-blue-500 text-white font-bold text-sm">
                                                        {assignment.submission_count}/{assignment.total_students}
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        ({Math.round(submissionRate)}%)
                                                    </span>
                                                </div>

                                                {assignment.allow_late_submission && (
                                                    <div className="text-sm text-green-600 dark:text-green-400">
                                                        ✓ Geç teslim kabul edilir
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Link
                                            href={`/admin/classes/${id}/assignments/${assignment.id}`}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm"
                                        >
                                            Teslimler
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Henüz ödev oluşturulmamış
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
