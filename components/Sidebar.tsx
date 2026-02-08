"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, DollarSign, BookOpen, LogOut, CreditCard, User, GraduationCap } from "lucide-react";
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
            { href: "/admin/classes", label: "Sınıflar & Dersler", icon: BookOpen },
            { href: "/admin/programs", label: "Programlar", icon: GraduationCap },
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
        <aside className="w-64 bg-kodrix-purple dark:bg-amber-500 flex flex-col fixed inset-y-0 left-0 z-50 transition-colors duration-300">

            {/* LOGO AREA */}
            <div className="h-24 flex items-center justify-center border-b border-white/10 dark:border-black/5">
                <SidebarLogo />
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition group ${isActive
                                ? "bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white shadow-lg shadow-purple-500/20 dark:shadow-amber-500/20 scale-105 font-bold"
                                : "text-white/80 dark:text-gray-900/80 hover:bg-white/10 dark:hover:bg-black/5 hover:text-white dark:hover:text-gray-900"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-amber-400 dark:text-kodrix-purple"}`} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-white/10 dark:border-black/5">
                <form action="/auth/signout" method="post">
                    <button
                        type="submit"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 dark:text-gray-900/70 hover:bg-white/10 dark:hover:bg-black/5 hover:text-white dark:hover:text-gray-900 transition w-full text-left"
                    >
                        <LogOut className="w-5 h-5 text-amber-400 dark:text-kodrix-purple" />
                        <span className="font-medium">Çıkış Yap</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
