import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AddStudentsClient from "./AddStudentsClient";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AddStudentsPage({ params }: PageProps) {
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

    // Get all students
    const { data: allStudents } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("full_name");

    // Get already enrolled students
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("class_id", id);

    const enrolledIds = new Set(enrollments?.map((e) => e.user_id) || []);
    const availableStudents = (allStudents || []).filter((s) => !enrolledIds.has(s.id));

    return (
        <AddStudentsClient
            classId={id}
            className={classData.name}
            availableStudents={availableStudents}
        />
    );
}
