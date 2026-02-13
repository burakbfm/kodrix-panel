import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import NewLessonClient from "./NewLessonClient";

interface PageProps {
    params: Promise<{ id: string; moduleId: string }>;
}

export default async function NewLessonPage({ params }: PageProps) {
    const { id: programId, moduleId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch program and module info
    const { data: program } = await supabase
        .from("programs")
        .select("title")
        .eq("id", programId)
        .single();

    const { data: module } = await supabase
        .from("modules")
        .select("title, order")
        .eq("id", moduleId)
        .single();

    if (!program || !module) {
        notFound();
    }

    // Get lesson count for order
    const { count } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId);

    return (
        <NewLessonClient
            programId={programId}
            moduleId={moduleId}
            programTitle={program.title}
            moduleTitle={module.title}
            moduleOrder={module.order}
            nextLessonNumber={(count || 0) + 1}
        />
    );
}
