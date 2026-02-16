import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle, XCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import SubmitAttendanceButton from "@/components/SubmitAttendanceButton";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ lesson_id?: string }>;
}

export default async function TakeAttendancePage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { lesson_id } = await searchParams;
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

    // Get lessons for this class
    const { data: lessons } = await supabase
        .from("class_lessons")
        .select("*")
        .eq("class_id", id)
        .order("lesson_date", { ascending: false });

    // Get enrolled students
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*")
        .eq("class_id", id);

    let students: any[] = [];
    if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map((e) => e.user_id);
        const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", studentIds);

        students = enrollments.map((enrollment) => ({
            ...enrollment,
            student: profiles?.find((p) => p.id === enrollment.user_id),
        }));
    }

    async function saveAttendance(formData: FormData) {
        "use server";
        const supabase = await createClient();

        const date = formData.get("date") as string;
        const notes = formData.get("notes") as string;
        const selectedLessonId = formData.get("lesson_id") as string;

        // Get all student attendance statuses
        const attendanceRecords = [];
        for (const student of students) {
            const status = formData.get(`status_${student.user_id}`) as string;
            if (status) {
                attendanceRecords.push({
                    class_id: id,
                    student_id: student.user_id,
                    date: date,
                    status: status,
                    notes: notes || null,
                    lesson_id: selectedLessonId || null,
                });
            }
        }

        if (attendanceRecords.length === 0) {
            return;
        }

        const { error } = await supabase
            .from("attendance")
            .upsert(attendanceRecords, {
                onConflict: 'lesson_id, student_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error("Yoklama kaydetme hatası:", error);
            return;
        }

        revalidatePath(`/admin/classes/${id}?tab=attendance`);
        revalidatePath(`/admin/classes/${id}?tab=lessons`);
        redirect(`/admin/classes/${id}?tab=attendance`);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/admin/classes/${id}?tab=attendance`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Geri Dön
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Yoklama Al
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {classData.name} sınıfı için yoklama kaydı oluşturun
                </p>
            </div>

            <form action={saveAttendance} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                    {/* Date */}
                    <div>
                        <label
                            htmlFor="date"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Tarih *
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            required
                            defaultValue={new Date().toISOString().split("T")[0]}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        />
                    </div>

                    {/* Lesson Selection */}
                    <div>
                        <label
                            htmlFor="lesson_id"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Ders (İsteğe Bağlı)
                        </label>
                        <select
                            id="lesson_id"
                            name="lesson_id"
                            defaultValue={lesson_id || ""}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                        >
                            <option value="">Seçiniz (Genel Yoklama)</option>
                            {lessons?.map((lesson: any) => (
                                <option key={lesson.id} value={lesson.id}>
                                    {new Date(lesson.lesson_date).toLocaleDateString("tr-TR")} - {lesson.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label
                            htmlFor="notes"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Notlar (isteğe bağlı)
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            placeholder="Ders hakkında notlar..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Student Attendance */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            Öğrenci Yoklaması ({students.length})
                        </h2>
                    </div>

                    {students.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                            {students.map((enrollment) => (
                                <div
                                    key={enrollment.user_id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center font-semibold text-white dark:text-gray-900">
                                                {enrollment.student?.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {enrollment.student?.full_name || "İsimsiz"}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {enrollment.student?.school_number || enrollment.student?.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Attendance Status */}
                                        <div className="flex gap-2">
                                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-500/10 cursor-pointer hover:bg-green-100 dark:hover:bg-green-500/20 transition">
                                                <input
                                                    type="radio"
                                                    name={`status_${enrollment.user_id}`}
                                                    value="present"
                                                    defaultChecked
                                                    className="w-4 h-4 text-green-500 focus:ring-2 focus:ring-green-500"
                                                />
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                                    Geldi
                                                </span>
                                            </label>

                                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-500/10 cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/20 transition">
                                                <input
                                                    type="radio"
                                                    name={`status_${enrollment.user_id}`}
                                                    value="absent"
                                                    className="w-4 h-4 text-red-500 focus:ring-2 focus:ring-red-500"
                                                />
                                                <XCircle className="w-5 h-5 text-red-500" />
                                                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                                                    Gelmedi
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-gray-600 dark:text-gray-400">
                                Bu sınıfta kayıtlı öğrenci yok
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {students.length > 0 && (
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={`/admin/classes/${id}?tab=attendance`}
                            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                        >
                            İptal
                        </Link>
                        <SubmitAttendanceButton />
                    </div>
                )}
            </form>
        </div>
    );
}
