"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, DollarSign, BookOpen, LogOut, CreditCard, User, GraduationCap, FileText, Settings, Sparkles, Bot, MessageCircle, Activity } from "lucide-react";
import { SidebarLogo } from "@/components/SidebarLogo";

type Role = "admin" | "teacher" | "student";

interface SidebarProps {
    role: Role;
    userName?: string;
    userEmail?: string;
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
    const pathname = usePathname();

    const menuConfig = {
        admin: [
            { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
            { href: "/admin/classes", label: "Sınıflar", icon: BookOpen },
            { href: "/admin/programs", label: "Programlar", icon: GraduationCap },
            { href: "/admin/quizzes", label: "Quizler", icon: FileText },
            { href: "/admin/users", label: "Kullanıcılar", icon: Users },
            { href: "/admin/finance", label: "Finans", icon: DollarSign },
            { href: "/admin/ai", label: "Yapay Zekalar", icon: Sparkles },
            { href: "/admin/ai-settings", label: "AI Yönetimi", icon: Bot },
            { href: "/admin/messages", label: "Mesajlar", icon: MessageCircle },
            { href: "/admin/logs", label: "Loglar", icon: Activity },
        ],
        teacher: [
            { href: "/teacher", label: "Genel Bakış", icon: LayoutDashboard },
            { href: "/teacher/classes", label: "Sınıflarım", icon: BookOpen },
            { href: "/teacher/ai", label: "Yapay Zekalar", icon: Sparkles },
            { href: "/teacher/messages", label: "Mesajlar", icon: MessageCircle },
            { href: "/teacher/profile", label: "Profilim", icon: User },
        ],
        student: [
            { href: "/student", label: "Derslerim", icon: LayoutDashboard },
            { href: "/student/ai", label: "Yapay Zekalar", icon: Sparkles },
            { href: "/student/messages", label: "Mesajlar", icon: MessageCircle },
            { href: "/student/payments", label: "Ödemelerim", icon: CreditCard },
            { href: "/student/profile", label: "Profilim", icon: User },
        ],
    };

    const profileHref = role === "admin" ? "/admin/profile" : role === "teacher" ? "/teacher/profile" : "/student/profile";
    const menuItems = menuConfig[role] || [];
    const displayName = userName || userEmail || "Kullanıcı";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <aside className="w-64 bg-white/80 dark:bg-black/40 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 shadow-xl shadow-black/5">

            {/* LOGO AREA */}
            <div className="h-20 flex items-center justify-center border-b border-gray-100 dark:border-white/5 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-transparent">
                <SidebarLogo />
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? "bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-orange-500 text-white shadow-lg shadow-kodrix-purple/30 dark:shadow-amber-500/20 translate-x-1"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] transition-transform duration-700 ease-in-out ${isActive ? "" : "group-hover:translate-x-[200%]"}`} />
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                            <span className="font-medium tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 space-y-2">
                {/* Account Card */}
                <Link href={profileHref} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                        {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-kodrix-purple dark:group-hover:text-amber-400 transition-colors">{displayName}</p>
                        {userEmail && userName && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                        )}
                    </div>
                    <Settings className="w-4 h-4 text-gray-400 group-hover:text-kodrix-purple dark:group-hover:text-amber-400 transition-colors shrink-0 group-hover:rotate-90 duration-300" />
                </Link>

                {/* Logout */}
                <form action="/auth/signout" method="post">
                    <button
                        type="submit"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all w-full text-left group border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                    >
                        <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium">Çıkış Yap</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
