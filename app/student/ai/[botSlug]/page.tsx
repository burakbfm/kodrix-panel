import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AIChatWindow } from "@/components/AIChatWindow";

interface Props {
    params: Promise<{ botSlug: string }>;
    searchParams: Promise<{ conversation?: string }>;
}

export default async function BotChatPage({ params, searchParams }: Props) {
    const supabase = await createClient();
    const { botSlug } = await params;
    const { conversation: existingConvId } = await searchParams;

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    // Get user role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const rolePath = profile?.role === "admin" ? "admin" : profile?.role === "teacher" ? "teacher" : "student";

    // Get bot
    const { data: bot } = await supabase
        .from("ai_bots")
        .select("*")
        .eq("slug", botSlug)
        .eq("is_active", true)
        .single();

    if (!bot) {
        redirect(`/${rolePath}/ai`);
    }

    // Get or create conversation
    let conversationId = existingConvId;
    let initialMessages: { role: "user" | "assistant"; content: string }[] = [];

    if (existingConvId) {
        // Load existing conversation messages
        const { data: messages } = await supabase
            .from("ai_messages")
            .select("role, content")
            .eq("conversation_id", existingConvId)
            .order("created_at", { ascending: true });

        initialMessages = (messages || []).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));
    } else {
        // Create a new conversation
        const { data: newConv } = await supabase
            .from("ai_conversations")
            .insert({
                user_id: user.id,
                bot_id: bot.id,
                title: `${bot.name} ile Sohbet`,
            })
            .select("id")
            .single();

        conversationId = newConv?.id;
    }

    return (
        <div className="p-4 md:p-8">
            <AIChatWindow
                bot={{
                    id: bot.id,
                    name: bot.name,
                    slug: bot.slug,
                    avatar_emoji: bot.avatar_emoji,
                    avatar_color: bot.avatar_color,
                    description: bot.description,
                }}
                conversationId={conversationId!}
                initialMessages={initialMessages}
                rolePath={rolePath}
            />
        </div>
    );
}
