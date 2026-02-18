import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Activity, LogIn, AlertTriangle, ChevronLeft, ChevronRight
} from "lucide-react";
import { ACTION_CONFIG } from "./config";
import { LogsFilter } from "./LogsFilter";

export default async function LogsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; action?: string; search?: string; start_date?: string; end_date?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/");

    const page = parseInt(params.page || "1");
    const perPage = 100;
    const offset = (page - 1) * perPage;
    const actionFilter = params.action || "";
    const searchQuery = params.search || "";
    const startDate = params.start_date || "";
    const endDate = params.end_date || "";

    // Build query
    let query = supabase
        .from("system_logs")
        .select("*, profiles:user_id(full_name, email, role)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + perPage - 1);

    if (actionFilter) {
        query = query.eq("action", actionFilter);
    }

    if (startDate) {
        query = query.gte("created_at", startDate + "T00:00:00Z");
    }

    if (endDate) {
        query = query.lte("created_at", endDate + "T23:59:59Z");
    }

    const { data: logs, count } = await query;

    // Filter by search (client-side for user name/email)
    let filteredLogs = logs || [];
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredLogs = filteredLogs.filter((log: any) => {
            const userName = log.profiles?.full_name?.toLowerCase() || "";
            const userEmail = log.profiles?.email?.toLowerCase() || "";
            const details = JSON.stringify(log.details || {}).toLowerCase();
            return userName.includes(q) || userEmail.includes(q) || details.includes(q) || log.action.includes(q);
        });
    }

    const totalPages = Math.ceil((count || 0) / perPage);

    // Stats
    const today = new Date().toISOString().split("T")[0];
    const { count: todayLogins } = await supabase
        .from("system_logs")
        .select("id", { count: "exact", head: true })
        .eq("action", "login")
        .gte("created_at", today);

    const { count: todayErrors } = await supabase
        .from("system_logs")
        .select("id", { count: "exact", head: true })
        .eq("action", "error")
        .gte("created_at", today);

    const { count: totalLogs } = await supabase
        .from("system_logs")
        .select("id", { count: "exact", head: true });

    const stats = [
        { label: "Toplam Kayıt", value: totalLogs || 0, icon: Activity, gradient: "from-indigo-500 to-blue-600" },
        { label: "Bugün Giriş", value: todayLogins || 0, icon: LogIn, gradient: "from-green-500 to-emerald-600" },
        { label: "Bugün Hata", value: todayErrors || 0, icon: AlertTriangle, gradient: "from-red-500 to-rose-600" },
    ];

    // Build filter URL helper for pagination
    const buildFilterUrl = (newPage: number) => {
        const urlParams = new URLSearchParams();
        if (newPage > 1) urlParams.set("page", String(newPage));
        if (actionFilter) urlParams.set("action", actionFilter);
        if (searchQuery) urlParams.set("search", searchQuery);
        if (startDate) urlParams.set("start_date", startDate);
        if (endDate) urlParams.set("end_date", endDate);
        const query = urlParams.toString();
        return query ? `/admin/logs?${query}` : `/admin/logs`;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 to-gray-900 dark:from-slate-900 dark:to-gray-950 p-10 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <Activity className="w-10 h-10 text-amber-400" />
                        Sistem Logları
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Kullanıcı aktiviteleri, hatalar ve sistem olayları
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString("tr-TR")}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters (Client Component) */}
            <LogsFilter />

            {/* Logs Table */}
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-20">
                        <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Henüz log kaydı yok</p>
                        <p className="text-sm text-gray-400 mt-1">Kullanıcı aktiviteleri burada görünecek</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Zaman</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Kullanıcı</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Aksiyon</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Detaylar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log: any) => {
                                    const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.system;
                                    const Icon = config.icon;
                                    const userProfile = log.profiles as any;
                                    const details = log.details || {};
                                    const time = new Date(log.created_at);

                                    return (
                                        <tr key={log.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {time.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {userProfile ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                            {(userProfile.full_name || userProfile.email || "?")[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {userProfile.full_name || "İsimsiz"}
                                                            </p>
                                                            <p className="text-xs text-gray-400">{userProfile.email}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sistem</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${config.gradient} text-white shadow-sm`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 min-w-[200px]">
                                                {Object.keys(details).length > 0 ? (
                                                    <div className="space-y-0.5 max-w-md">
                                                        {Object.entries(details).map(([key, value]) => (
                                                            <p key={key} className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>{" "}
                                                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                                            </p>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Toplam {count?.toLocaleString("tr-TR")} kayıt, sayfa {page}/{totalPages}
                        </p>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <a
                                    href={buildFilterUrl(page - 1)}
                                    className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </a>
                            )}
                            {page < totalPages && (
                                <a
                                    href={buildFilterUrl(page + 1)}
                                    className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
