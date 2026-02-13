"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAssignment(formData: FormData) {
    const supabase = await createClient();
    const classId = formData.get("class_id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dueDate = formData.get("due_date") as string;
    const maxScore = parseInt(formData.get("max_score") as string) || 100;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from("class_assignments")
        .insert({
            class_id: classId,
            title,
            description: description || null,
            due_date: dueDate || null,
            max_score: maxScore,
            created_by: user?.id,
        });

    if (error) {
        console.error("Ödev oluşturma hatası:", error);
        throw new Error("Ödev oluşturulamadı");
    }

    revalidatePath(`/admin/classes/${classId}`);
    return { success: true };
}

export async function deleteAssignment(formData: FormData) {
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
    return { success: true };
}
