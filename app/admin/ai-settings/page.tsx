import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Bot, Power, PowerOff, Save, Sparkles, Edit, Settings } from "lucide-react";

export default async function AISettingsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    // Admin check
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") redirect("/");

    // Get all bots (including inactive)
    const { data: bots } = await supabase
        .from("ai_bots")
        .select("*")
        .order("created_at");

    // Server actions
    async function toggleBot(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const botId = formData.get("bot_id") as string;
        const isActive = formData.get("is_active") === "true";

        await supabase
            .from("ai_bots")
            .update({ is_active: !isActive, updated_at: new Date().toISOString() })
            .eq("id", botId);

        revalidatePath("/admin/ai-settings");
    }

    async function updateBot(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const botId = formData.get("bot_id") as string;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const systemPrompt = formData.get("system_prompt") as string;
        const model = formData.get("model") as string;
        const provider = formData.get("provider") as string;

        await supabase
            .from("ai_bots")
            .update({
                name,
                description,
                system_prompt: systemPrompt,
                model,
                provider,
                updated_at: new Date().toISOString(),
            })
            .eq("id", botId);

        revalidatePath("/admin/ai-settings");
    }

    const GRADIENT_MAP: Record<string, string> = {
        purple: "from-purple-500 to-violet-600",
        blue: "from-blue-500 to-cyan-600",
        amber: "from-amber-400 to-orange-500",
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-purple-700 dark:from-violet-700 dark:to-purple-900 p-10 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <Settings className="w-10 h-10 text-purple-200" />
                        AI Bot Yönetimi
                    </h1>
                    <p className="text-purple-200 text-lg">
                        Yapay zeka asistanlarını yönetin, aktif/pasif yapın ve ayarlarını düzenleyin.
                    </p>
                </div>
            </div>

            {/* Bot Cards */}
            <div className="space-y-6">
                {(bots || []).map((bot: any) => {
                    const gradient = GRADIENT_MAP[bot.avatar_color] || GRADIENT_MAP.purple;
                    return (
                        <div
                            key={bot.id}
                            className={`bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border ${bot.is_active
                                ? "border-gray-200 dark:border-white/10"
                                : "border-red-200 dark:border-red-500/20 opacity-75"
                                } p-8 shadow-xl transition-all`}
                        >
                            <div className="flex items-start gap-6 mb-8">
                                {/* Avatar */}
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-lg shrink-0`}>
                                    {bot.avatar_emoji}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{bot.name}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${bot.is_active
                                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"
                                            }`}>
                                            {bot.is_active ? "Aktif" : "Pasif"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{bot.description}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/5 text-gray-500 px-2.5 py-1 rounded-lg">
                                            {bot.provider}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/5 text-gray-500 px-2.5 py-1 rounded-lg">
                                            {bot.model}
                                        </span>
                                    </div>
                                </div>

                                {/* Toggle Button */}
                                <form action={toggleBot}>
                                    <input type="hidden" name="bot_id" value={bot.id} />
                                    <input type="hidden" name="is_active" value={String(bot.is_active)} />
                                    <button
                                        type="submit"
                                        className={`p-3 rounded-2xl transition-all ${bot.is_active
                                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20"
                                            : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-100 dark:border-green-500/20"
                                            }`}
                                        title={bot.is_active ? "Pasife Al" : "Aktif Et"}
                                    >
                                        {bot.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                                    </button>
                                </form>
                            </div>

                            {/* Edit Form */}
                            <form action={updateBot} className="space-y-4">
                                <input type="hidden" name="bot_id" value={bot.id} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">İsim</label>
                                        <input type="text" name="name" defaultValue={bot.name}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Açıklama</label>
                                        <input type="text" name="description" defaultValue={bot.description || ""}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Provider</label>
                                        <select name="provider" defaultValue={bot.provider}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition text-sm">
                                            <option value="google">Google Gemini</option>
                                            <option value="groq">Groq</option>
                                            <option value="huggingface">HuggingFace</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Model</label>
                                        <input type="text" name="model" defaultValue={bot.model}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">System Prompt</label>
                                    <textarea name="system_prompt" defaultValue={bot.system_prompt} rows={4}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition text-sm resize-none" />
                                </div>

                                <div className="flex justify-end">
                                    <button type="submit"
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all text-sm">
                                        <Save className="w-4 h-4" />
                                        Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
