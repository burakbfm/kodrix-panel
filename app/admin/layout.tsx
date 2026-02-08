import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Security check: Is the user an admin?
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

            {/* UNIFIED SIDEBAR */}
            <Sidebar role="admin" />

            {/* MAIN CONTENT AREA */}
            < div className="flex-1 flex flex-col overflow-hidden ml-64" >

                {/* TOP HEADER */}
                < header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 transition-colors" >
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Admin Panel
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hoş geldiniz, {profile?.full_name || profile?.email}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </header >

                {/* PAGE CONTENT */}
                < main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors" >
                    {children}
                </main >
            </div >
        </div >
    );
}
