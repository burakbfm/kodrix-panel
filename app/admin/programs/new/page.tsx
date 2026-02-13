import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewProgramClient from "./NewProgramClient";

export default async function NewProgramPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return <NewProgramClient userId={user.id} />;
}
