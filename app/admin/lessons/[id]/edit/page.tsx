import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditLessonClient from "./EditLessonClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get lesson
  const { data: lesson } = await supabase
    .from("lessons")
    .select(`
            *,
            module:modules (
                program_id
            )
        `)
    .eq("id", id)
    .single();

  if (!lesson) {
    notFound();
  }

  // Transform data to match client props if needed or pass directly
  // Since module is joined, we can extract program_id
  const programId = lesson.module?.program_id;

  if (!programId) {
    // Fallback or error if data integrity is bad
    return <div>Hata: Ders bir programa bağlı değil.</div>;
  }

  return <EditLessonClient lesson={lesson} programId={programId} />;
}