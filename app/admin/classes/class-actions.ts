"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAssignment(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const classId = formData.get("class_id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dueDate = formData.get("due_date") as string;
    const startDate = formData.get("start_date") as string;
    const maxScore = parseInt(formData.get("max_score") as string) || 100;
    const attachmentsJson = formData.get("attachments") as string;
    let attachments = [];

    try {
        if (attachmentsJson) {
            attachments = JSON.parse(attachmentsJson);
        }
    } catch (e) {
        console.error("Attachment parse error:", e);
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from("class_assignments")
        .insert({
            class_id: classId,
            title,
            description: description || null,
            due_date: dueDate || null,
            start_date: startDate || null,
            max_score: maxScore,
            created_by: user?.id,
            attachments: attachments
        });

    if (error) {
        console.error("Ödev oluşturma hatası:", error);
        throw new Error("Ödev oluşturulamadı");
    }

    revalidatePath(`/admin/classes/${classId}`);

}

export async function deleteAssignment(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const assignmentId = formData.get("assignment_id") as string;
    const classId = formData.get("class_id") as string;

    const { error } = await supabase
        .from("class_assignments")
        .delete()
        .eq("id", assignmentId);

    if (error) {
        console.error("Ödev silme hatası:", error);
        throw new Error("Ödev silinemedi");
    }

    revalidatePath(`/admin/classes/${classId}`);
}

export async function removeStudent(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const enrollmentId = formData.get("enrollment_id") as string;
    const classId = formData.get("class_id") as string;

    const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId);

    if (error) {
        console.error("Öğrenci silme hatası:", error);
        throw new Error("Öğrenci silinemedi");
    }

    revalidatePath(`/admin/classes/${classId}`);
}

export async function deleteQuizAssignment(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const classQuizId = formData.get("class_quiz_id") as string;
    const classId = formData.get("class_id") as string;

    const { error } = await supabase
        .from("class_quizzes")
        .delete()
        .eq("id", classQuizId);

    if (error) {
        console.error("Quiz ataması silme hatası:", error);
        throw new Error("Quiz ataması silinemedi");
    }

    revalidatePath(`/admin/classes/${classId}`);
}

export async function toggleLessonActive(formData: FormData) {
    const supabase = await createClient();
    const lessonId = formData.get("lesson_id") as string;
    const currentStatus = formData.get("current_status") === "true";

    await supabase
        .from("class_lessons")
        .update({ is_active: !currentStatus })
        .eq("id", lessonId);

    const classId = formData.get("class_id") as string;
    revalidatePath(`/admin/classes/${classId}`);
}

export async function updateLessonDetails(formData: FormData) {
    const supabase = await createClient();
    const lessonId = formData.get("lesson_id") as string;
    const classId = formData.get("class_id") as string;

    const updates: any = {};
    const meetingLink = formData.get("meeting_link");
    const teacherNotes = formData.get("teacher_notes");
    const lessonDate = formData.get("lesson_date");
    const lessonTime = formData.get("lesson_time");

    if (meetingLink !== null) updates.meeting_link = meetingLink || null;
    if (teacherNotes !== null) updates.teacher_notes = teacherNotes || null;
    if (lessonDate !== null) updates.lesson_date = lessonDate || null;
    if (lessonTime !== null) updates.lesson_time = lessonTime || null;

    const { error } = await supabase
        .from("class_lessons")
        .update(updates)
        .eq("id", lessonId);

    if (error) {
        console.error("Ders güncelleme hatası:", error);
    }

    revalidatePath(`/admin/classes/${classId}`);
}

export async function removeProgram(formData: FormData) {
    const supabase = await createClient();
    const programId = formData.get("program_id") as string;
    const classId = formData.get("class_id") as string;

    // Delete all class_lessons first
    await supabase
        .from("class_lessons")
        .delete()
        .eq("class_id", classId);

    // Then remove the class_programs entry
    await supabase
        .from("class_programs")
        .delete()
        .eq("id", programId);

    revalidatePath(`/admin/classes/${classId}`);
}

export async function assignQuiz(formData: FormData) {
    const supabase = await createClient();
    const classId = formData.get("class_id") as string;

    if (!classId) throw new Error("Class ID is required");

    const quizData = {
        class_id: classId,
        quiz_id: formData.get("quiz_id") as string,
        lesson_id: (formData.get("lesson_id") as string) || null,
        is_active: formData.get("is_active") === "true",
        start_date: (formData.get("start_date") as string) || null,
        end_date: (formData.get("end_date") as string) || null,
    };

    const { error } = await supabase.from("class_quizzes").insert(quizData);

    if (error) {
        console.error("Quiz atama hatası:", error);
    }

    revalidatePath(`/admin/classes/${classId}`);
}
