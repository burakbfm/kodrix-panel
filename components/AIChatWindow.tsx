"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { UIMessage } from "ai";

interface AIChatWindowProps {
    bot: {
        id: string;
        name: string;
        slug: string;
        avatar_emoji: string;
        avatar_color: string;
        description?: string;
    };
    conversationId: string;
    initialMessages?: { role: "user" | "assistant"; content: string }[];
    rolePath: string;
}

const GRADIENT_MAP: Record<string, string> = {
    purple: "from-purple-500 to-violet-600",
    blue: "from-blue-500 to-cyan-600",
    amber: "from-amber-400 to-orange-500",
};

// Helper: extract text from UIMessage parts
function getMessageText(message: UIMessage): string {
    return message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
}

export function AIChatWindow({ bot, conversationId, initialMessages = [], rolePath }: AIChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [inputValue, setInputValue] = useState("");

    // Convert initial messages to UIMessage format
    const convertedInitialMessages: UIMessage[] = initialMessages.map((m, i) => ({
        id: `init-${i}`,
        role: m.role,
        parts: [{ type: "text" as const, text: m.content }],
    }));

    const { messages, sendMessage, status, setMessages } = useChat({
        id: conversationId,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: {
                botSlug: bot.slug,
                conversationId,
            },
        }),
        messages: convertedInitialMessages,
    });

    const gradient = GRADIENT_MAP[bot.avatar_color] || GRADIENT_MAP.purple;
    const isLoading = status === "submitted" || status === "streaming";

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Handle send
    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return;
        sendMessage({ text: inputValue.trim() });
        setInputValue("");
        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    // Quick suggestion handler
    const insertSuggestion = (text: string) => {
        setInputValue(text);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto">
            {/* Chat Header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border-b border-gray-200 dark:border-white/10 rounded-t-3xl">
                <Link
                    href={`/${rolePath}/ai`}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                    {bot.avatar_emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg">{bot.name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{bot.description}</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/50 dark:bg-black/10">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center text-5xl mb-6 shadow-xl`}>
                            {bot.avatar_emoji}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {bot.name} ile Sohbet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm leading-relaxed">
                            {bot.description || "Merhaba! Sana nasıl yardımcı olabilirim?"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-6 justify-center">
                            {bot.slug === "feride" && ["Bugün kendimi kötü hissediyorum", "Arkadaşlarımla sorun yaşıyorum", "Sınavlardan çok stres oluyorum"].map((q) => (
                                <button key={q} onClick={() => insertSuggestion(q)}
                                    className="px-4 py-2 text-xs font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all">
                                    {q}
                                </button>
                            ))}
                            {bot.slug === "metin" && ["Matematik ödevimde yardıma ihtiyacım var", "Python kodlama hakkında sorum var", "Fen bilgisi konusunu anlamıyorum"].map((q) => (
                                <button key={q} onClick={() => insertSuggestion(q)}
                                    className="px-4 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all">
                                    {q}
                                </button>
                            ))}
                            {bot.slug === "rabia" && ["Bugün neler yaptığımı anlatayım!", "Bana bir bilmece sor", "Motivasyona ihtiyacım var 💪"].map((q) => (
                                <button key={q} onClick={() => insertSuggestion(q)}
                                    className="px-4 py-2 text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message) => {
                    const text = getMessageText(message);
                    if (!text) return null;
                    return (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            {message.role === "assistant" ? (
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg shrink-0 shadow-md`}>
                                    {bot.avatar_emoji}
                                </div>
                            ) : (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-500 dark:to-gray-700 flex items-center justify-center shrink-0 shadow-md">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${message.role === "user"
                                    ? "bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white rounded-tr-md shadow-lg"
                                    : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/10 rounded-tl-md shadow-sm"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap break-words">{text}</div>
                            </div>
                        </div>
                    );
                })}

                {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg shrink-0 shadow-md`}>
                            {bot.avatar_emoji}
                        </div>
                        <div className="bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-md px-5 py-3.5 shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border-t border-gray-200 dark:border-white/10 rounded-b-3xl">
                <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`${bot.name}'e bir mesaj yaz...`}
                            rows={1}
                            className="w-full resize-none rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-5 py-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-500 outline-none transition-all placeholder-gray-400"
                            style={{ minHeight: "48px", maxHeight: "120px" }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !inputValue.trim()}
                        className={`p-3.5 rounded-2xl transition-all duration-200 shrink-0 ${inputValue.trim() && !isLoading
                            ? `bg-gradient-to-r ${gradient} text-white shadow-lg hover:shadow-xl hover:scale-105`
                            : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                    Shift+Enter ile yeni satır · Enter ile gönder
                </p>
            </div>
        </div>
    );
}
