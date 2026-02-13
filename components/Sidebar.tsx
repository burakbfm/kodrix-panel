"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, DollarSign, BookOpen, LogOut, CreditCard, User, GraduationCap, FileText } from "lucide-react";
import { SidebarLogo } from "@/components/SidebarLogo";

type Role = "admin" | "teacher" | "student";

interface SidebarProps {
    role: Role;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();

    // Define menu items for each role
    const menuConfig = {
        admin: [
            { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
            { href: "/admin/classes", label: "Sınıflar", icon: BookOpen },
            { href: "/admin/programs", label: "Programlar", icon: GraduationCap },
            { href: "/admin/quizzes", label: "Quizler", icon: FileText },
            { href: "/admin/users", label: "Kullanıcılar", icon: Users },
            { href: "/admin/finance", label: "Finans", icon: DollarSign },
        ],
        teacher: [
            { href: "/teacher", label: "Genel Bakış", icon: LayoutDashboard },
            { href: "/teacher/classes", label: "Sınıflarım", icon: BookOpen },
            { href: "/teacher/profile", label: "Profilim", icon: User },
        ],
        student: [
            { href: "/student", label: "Derslerim", icon: LayoutDashboard },
            { href: "/student/payments", label: "Ödemelerim", icon: CreditCard },
            { href: "/student/profile", label: "Profilim", icon: User },
        ],
    };

    const menuItems = menuConfig[role] || [];

    return (
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed inset-y-0 left-0 z-50 transition-colors duration-300">

            {/* LOGO AREA */}
            <div className="h-20 flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
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
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? "bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 shadow-md shadow-kodrix-purple/20 dark:shadow-amber-500/20 font-semibold"
                                : "text-gray-500 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-amber-500/10 hover:text-kodrix-purple dark:hover:text-amber-500 hover:translate-x-1"
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-white dark:text-gray-900" : "text-gray-400 dark:text-gray-500 group-hover:text-kodrix-purple dark:group-hover:text-amber-500"}`} />
                            <span className="font-medium">{item.label}</span>

                            {/* Active Indicator Pillar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white/20 dark:bg-black/10 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <form action="/auth/signout" method="post">
                    <button
                        type="submit"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 dark:hover:text-red-400 transition-all w-full text-left group"
                    >
                        <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
                        <span className="font-medium">Çıkış Yap</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
