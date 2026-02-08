import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, CreditCard, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarLogo } from "@/components/SidebarLogo";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .single();

    // Security: Only student (and maybe admin)
    if (profile?.role !== "student" && profile?.role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

            {/* SIDEBAR */}
            <aside className="w-64 bg-kodrix-purple dark:bg-amber-500 flex flex-col fixed inset-y-0 left-0 z-50 transition-colors duration-300">

                {/* LOGO AREA */}
                <div className="h-24 flex items-center justify-center border-b border-white/10 dark:border-black/5">
                    <SidebarLogo />
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2">

                    <Link href="/student" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 dark:text-gray-900/80 hover:bg-white/10 dark:hover:bg-black/5 hover:text-white dark:hover:text-gray-900 transition group">
                        <LayoutDashboard className="w-5 h-5 text-amber-400 dark:text-kodrix-purple" />
                        <span className="font-medium">Derslerim</span>
                    </Link>

                    <Link href="/student/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 dark:text-gray-900/80 hover:bg-white/10 dark:hover:bg-black/5 hover:text-white dark:hover:text-gray-900 transition group">
                        <CreditCard className="w-5 h-5 text-amber-400 dark:text-kodrix-purple" />
                        <span className="font-medium">Ödemelerim</span>
                    </Link>

                    <Link href="/student/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 dark:text-gray-900/80 hover:bg-white/10 dark:hover:bg-black/5 hover:text-white dark:hover:text-gray-900 transition group">
                        <User className="w-5 h-5 text-amber-400 dark:text-kodrix-purple" />
                        <span className="font-medium">Profilim</span>
                    </Link>

                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-white/10 dark:border-black/5">
                    <form action="/auth/sign-out" method="post">
                        <button
                            type="submit"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 dark:text-gray-900/70 hover:bg-white/10 dark:hover:bg-black/5 hover:text-white dark:hover:text-gray-900 transition w-full text-left"
                        >
                            <LogOut className="w-5 h-5 text-amber-400 dark:text-kodrix-purple" />
                            <span className="font-medium">Çıkış Yap</span>
                        </button>
                    </form>
                </div>
            </aside >

            {/* MAIN CONTENT AREA */}
            < div className="flex-1 flex flex-col overflow-hidden ml-64" >

                {/* TOP HEADER */}
                < header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 transition-colors" >
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Öğrenci Paneli
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
