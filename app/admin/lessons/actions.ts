"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Define the attachment type
interface FileAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
    category?: 'document' | 'slide';
}

export async function createProgramLesson(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const moduleId = formData.get("module_id") as string;
    const programId = formData.get("program_id") as string;

    // Parse attachments from JSON string
    const attachmentsJson = formData.get("attachments") as string;
    let attachments: FileAttachment[] = [];
    try {
        attachments = attachmentsJson ? JSON.parse(attachmentsJson) : [];
        console.log("Parsed attachments:", attachments);
    } catch (e) {
        console.error("Error parsing attachments:", e);
    }

    const lessonData = {
        module_id: moduleId,
        lesson_number: parseInt(formData.get("lesson_number") as string),
        title: formData.get("title") as string,
        description: formData.get("description") as string || null,
        content: formData.get("content") as string || null,
        duration_minutes: parseInt(formData.get("duration_minutes") as string) || 45,
        order: parseInt(formData.get("order") as string) || 0,
        video_url: formData.get("video_url") as string || null,
        meeting_link: formData.get("meeting_link") as string || null,
        attachments: attachments, // Save the JSON array of file metadata
        teacher_content: formData.get("teacher_content") as string || null, // Teacher-only notes
        created_by: user.id,
    };

    const { error } = await supabase
        .from("lessons")
        .insert([lessonData]);

    if (error) {
        console.error("Error creating lesson:", error);
        throw new Error(`Ders oluşturulurken hata: ${error.message}`);
    }

    revalidatePath(`/admin/programs/${programId}`);
    redirect(`/admin/programs/${programId}`);
}

export async function updateProgramLesson(formData: FormData) {
    const supabase = await createClient();

    const lessonId = formData.get("lesson_id") as string;
    const programId = formData.get("program_id") as string;

    // Parse attachments
    const attachmentsJson = formData.get("attachments") as string;
    let attachments: FileAttachment[] = [];
    try {
        attachments = attachmentsJson ? JSON.parse(attachmentsJson) : [];
        console.log("Parsed attachments (Update):", attachments);
    } catch (e) {
        console.error("Error parsing attachments:", e);
    }

    const updates = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || null,
        content: formData.get("content") as string || null,
        duration_minutes: parseInt(formData.get("duration_minutes") as string) || 45,
        order: parseInt(formData.get("order") as string) || 0,
        video_url: formData.get("video_url") as string || null,
        meeting_link: formData.get("meeting_link") as string || null,
        attachments: attachments,
        teacher_content: formData.get("teacher_content") as string || null,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("lessons")
        .update(updates)
        .eq("id", lessonId);

    if (error) {
        console.error("Error updating lesson:", error);
        throw new Error("Ders güncellenirken hata oluştu");
    }

    revalidatePath(`/admin/programs/${programId}`);
    revalidatePath(`/admin/lessons/${lessonId}/edit`);
    redirect(`/admin/programs/${programId}`);
}

export async function deleteProgramLesson(lessonId: string, programId: string) {
    const supabase = await createClient();

    // 1. Delete associated files from storage (optional but recommended)
    // Fetch lesson to get attachments
    const { data: lesson } = await supabase
        .from("lessons")
        .select("attachments")
        .eq("id", lessonId)
        .single();

    if (lesson && lesson.attachments) {
        // If we want to clean up storage, we would do it here.
        // For now, let's keep it simple and just delete the record.
        // Orphaned files can be cleaned up by a cron job or manual script.
    }

    // 2. Delete the lesson record
    const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);

    if (error) {
        console.error("🔥 Error deleting lesson:", error);
        console.error("Details:", error.details, error.message, error.hint);
        throw new Error(`Silme hatası: ${error.message}`);
    }

    revalidatePath(`/admin/programs/${programId}`);
}
