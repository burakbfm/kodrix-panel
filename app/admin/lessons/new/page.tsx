import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewLessonClient from "./NewLessonClient";

interface PageProps {
    searchParams: Promise<{
        moduleId?: string;
        programId?: string;
    }>;
}

export default async function NewLessonPage({ searchParams }: PageProps) {
    const { moduleId, programId } = await searchParams;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    if (!moduleId || !programId) {
        // Optional: Redirect or show error if parameters are missing, 
        // but Client component handles the error UI.
    }

    return <NewLessonClient moduleId={moduleId || ""} programId={programId || ""} userId={user.id} />;
}
