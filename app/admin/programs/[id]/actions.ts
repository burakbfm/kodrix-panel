"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function addModule(formData: FormData) {
    const supabase = await createClient();
    const programId = formData.get("program_id") as string;

    // Get current modules to calculate order
    const { data: modules } = await supabase
        .from("modules")
        .select("order")
        .eq("program_id", programId);

    const maxOrder = modules && modules.length > 0
        ? Math.max(...modules.map(m => m.order || 0))
        : 0;

    const moduleData = {
        program_id: programId,
        title: formData.get("module_title") as string,
        description: formData.get("module_description") as string,
        order: maxOrder + 1,
    };

    const { error } = await supabase.from("modules").insert(moduleData);

    if (error) {
        console.error("Modül ekleme hatası:", error);
        throw new Error(`Modül eklenirken hata: ${error.message}`);
    }

    revalidatePath(`/admin/programs/${programId}`);
}

export async function deleteModuleInternal(formData: FormData) {
    const moduleId = formData.get("module_id") as string;
    // We need programId to revalidate path. 
    // Usually we might need to fetch it or pass it.
    // For now assuming the page revalidates.
    // ... logic ...
    // Actually the page handles delete with a separate component DeleteModuleButton. 
    // We only need to export addModule for the new form.
}
