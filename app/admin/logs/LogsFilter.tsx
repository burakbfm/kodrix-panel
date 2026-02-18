"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar, Loader2 } from "lucide-react";
import { ACTION_CONFIG } from "./config";

export function LogsFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentAction = searchParams.get("action") || "";
    const currentSearch = searchParams.get("search") || "";
    const currentStartDate = searchParams.get("start_date") || "";
    const currentEndDate = searchParams.get("end_date") || "";

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get("search") as string;
        const startDate = formData.get("start_date") as string;
        const endDate = formData.get("end_date") as string;

        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (search) params.set("search", search);
            else params.delete("search");

            if (startDate) params.set("start_date", startDate);
            else params.delete("start_date");

            if (endDate) params.set("end_date", endDate);
            else params.delete("end_date");

            // Always reset to page 1 on search
            params.set("page", "1");

            router.push(`/admin/logs?${params.toString()}`);
        });
    };

    const handleActionClick = (action: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (action && currentAction !== action) {
                params.set("action", action);
            } else {
                params.delete("action");
            }

            params.set("page", "1");
            router.push(`/admin/logs?${params.toString()}`);
        });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        name="search"
                        defaultValue={currentSearch}
                        placeholder="Kullanıcı, hata, detay ara..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                    />
                </div>

                {/* Start Date */}
                <div className="relative min-w-[160px]">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="date"
                        name="start_date"
                        defaultValue={currentStartDate}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition cursor-pointer"
                    />
                </div>

                {/* End Date */}
                <div className="relative min-w-[160px]">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="date"
                        name="end_date"
                        defaultValue={currentEndDate}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition cursor-pointer"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-bold shadow-lg hover:shadow-xl transition whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isPending ? "Yükleniyor" : "Filtrele"}
                </button>
            </form>

            {/* Action Filters */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => handleActionClick("")}
                    disabled={isPending}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${!currentAction
                        ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"}`}
                >
                    Tümü
                </button>
                {Object.keys(ACTION_CONFIG).map((action) => {
                    const config = ACTION_CONFIG[action];
                    const isActive = currentAction === action;
                    return (
                        <button
                            key={action}
                            onClick={() => handleActionClick(action)}
                            disabled={isPending}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"}`}
                        >
                            <config.icon className={`w-4 h-4 ${isActive ? "text-white" : config.color}`} />
                            {config.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
