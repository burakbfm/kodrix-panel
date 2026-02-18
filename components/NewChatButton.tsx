"use client";

import { useState } from "react";
import { Plus, Search, User, Users, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { startDirectChat } from "@/app/admin/actions";

interface UserInfo {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
}

interface NewChatButtonProps {
    availableUsers: UserInfo[];
    currentUserId: string;
    rolePath: string;
}

export function NewChatButton({ availableUsers, currentUserId, rolePath }: NewChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const filtered = availableUsers.filter((u) => {
        const name = (u.full_name || u.email).toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const roleIcons: Record<string, any> = {
        student: User,
        teacher: GraduationCap,
        admin: Users,
    };

    const roleLabels: Record<string, string> = {
        student: "Öğrenci",
        teacher: "Öğretmen",
        admin: "Admin",
    };

    const handleStartChat = async (targetUser: UserInfo) => {
        setLoading(true);
        try {
            const roomId = await startDirectChat(targetUser.id);
            router.push(`/${rolePath}/messages/${roomId}`);
        } catch (error) {
            console.error("Chat creation error:", error);
            alert("Sohbet oluşturulamadı. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-indigo-700 rounded-2xl hover:bg-indigo-50 hover:scale-[1.02] transition-all duration-200 font-bold whitespace-nowrap shadow-lg"
            >
                <Plus className="w-5 h-5" />
                Yeni Sohbet
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/10 flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-t-3xl">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-500" />
                                Yeni Sohbet Başlat
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:scale-110 transition-all shadow-sm">
                                ✕
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-gray-100 dark:border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="İsim veya e-posta ara..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {filtered.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-8">Kullanıcı bulunamadı</p>
                            ) : (
                                filtered.map((u) => {
                                    const Icon = roleIcons[u.role] || User;
                                    return (
                                        <button
                                            key={u.id}
                                            onClick={() => handleStartChat(u)}
                                            disabled={loading}
                                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group disabled:opacity-50"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                    {u.full_name || u.email}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {roleLabels[u.role] || u.role}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
