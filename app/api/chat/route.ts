import { createClient } from "@/lib/supabase/server";
import { google } from "@ai-sdk/google";
import { streamText, createUIMessageStreamResponse, UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const supabase = await createClient();

    // Auth check
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const botSlug = body.botSlug;
    const conversationId = body.conversationId;
    const uiMessages: UIMessage[] = body.messages || [];

    // Get bot info
    const { data: bot } = await supabase
        .from("ai_bots")
        .select("*")
        .eq("slug", botSlug)
        .eq("is_active", true)
        .single();

    if (!bot) {
        return new Response("Bot bulunamadı veya aktif değil", { status: 404 });
    }

    // Save user message to DB
    if (conversationId && uiMessages.length > 0) {
        const lastMsg = uiMessages[uiMessages.length - 1];
        if (lastMsg.role === "user") {
            const textParts = lastMsg.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("");
            if (textParts) {
                await supabase.from("ai_messages").insert({
                    conversation_id: conversationId,
                    role: "user",
                    content: textParts,
                });
            }
        }
    }

    // Convert UIMessages to model messages for streamText
    const modelMessages = uiMessages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join(""),
    }));

    // Stream AI response
    const result = streamText({
        model: google(bot.model || "gemini-2.0-flash"),
        system: bot.system_prompt,
        messages: modelMessages,
        onFinish: async ({ text }) => {
            if (conversationId && text) {
                await supabase.from("ai_messages").insert({
                    conversation_id: conversationId,
                    role: "assistant",
                    content: text,
                });
                await supabase
                    .from("ai_conversations")
                    .update({ updated_at: new Date().toISOString() })
                    .eq("id", conversationId);
            }
        },
    });

    return result.toUIMessageStreamResponse();
}
