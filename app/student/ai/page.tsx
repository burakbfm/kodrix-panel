import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bot, MessageCircle, Brain, BookOpen, Sparkles, ArrowRight } from "lucide-react";

const BOT_ICONS: Record<string, { emoji: string; gradient: string; shadow: string }> = {
    purple: {
        emoji: "💜",
        gradient: "from-purple-500 to-violet-600",
        shadow: "shadow-purple-500/25",
    },
    blue: {
        emoji: "📚",
        gradient: "from-blue-500 to-cyan-600",
        shadow: "shadow-blue-500/25",
    },
    amber: {
        emoji: "🌟",
        gradient: "from-amber-400 to-orange-500",
        shadow: "shadow-amber-500/25",
    },
};

export default async function AIPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    // Get user profile for role check
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // Get active bots
    const { data: bots } = await supabase
        .from("ai_bots")
        .select("*")
        .eq("is_active", true)
        .order("created_at");

    // Get recent conversations for this user
    const { data: conversations } = await supabase
        .from("ai_conversations")
        .select("*, ai_bots(name, slug, avatar_emoji, avatar_color)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

    const rolePath = profile?.role === "admin" ? "admin" : profile?.role === "teacher" ? "teacher" : "student";

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-purple-700 dark:from-violet-700 dark:to-purple-900 p-10 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <Sparkles className="w-10 h-10 text-purple-200" />
                        Yapay Zeka Asistanları
                    </h1>
                    <p className="text-purple-200 text-lg">
                        Öğrenme yolculuğunda sana yardımcı olacak KodriX yapay zekaları
                    </p>
                </div>
            </div>

            {/* Bot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(bots || []).map((bot: any) => {
                    const style = BOT_ICONS[bot.avatar_color] || BOT_ICONS.purple;
                    return (
                        <Link
                            key={bot.id}
                            href={`/${rolePath}/ai/${bot.slug}`}
                            className="group relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-8 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${style.gradient} opacity-[0.07] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.15] transition-opacity`}></div>

                            {/* Avatar */}
                            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${style.gradient} ${style.shadow} shadow-xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                {bot.avatar_emoji}
                            </div>

                            {/* Info */}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {bot.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 leading-relaxed">
                                {bot.description}
                            </p>

                            {/* CTA */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                                <span className="text-xs font-bold text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                                    Sohbet Başlat
                                </span>
                                <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.gradient} ${style.shadow} shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Recent Conversations */}
            {conversations && conversations.length > 0 && (
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-xl">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-500" />
                        Son Sohbetlerin
                    </h2>
                    <div className="space-y-3">
                        {conversations.map((conv: any) => {
                            const botInfo = conv.ai_bots;
                            const style = BOT_ICONS[botInfo?.avatar_color] || BOT_ICONS.purple;
                            return (
                                <Link
                                    key={conv.id}
                                    href={`/${rolePath}/ai/${botInfo?.slug}?conversation=${conv.id}`}
                                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-lg shrink-0`}>
                                        {botInfo?.avatar_emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                            {conv.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {botInfo?.name} · {new Date(conv.updated_at).toLocaleDateString("tr-TR")}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors shrink-0" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
