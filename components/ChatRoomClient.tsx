"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, User, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatMessage {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

interface MemberProfile {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
}

interface ChatRoomClientProps {
    roomId: string;
    roomName: string;
    roomType: string;
    currentUserId: string;
    initialMessages: ChatMessage[];
    members: MemberProfile[];
    rolePath: string;
}

export function ChatRoomClient({
    roomId,
    roomName,
    roomType,
    currentUserId,
    initialMessages,
    members,
    rolePath,
}: ChatRoomClientProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const memberMap = useCallback(() => {
        const map: Record<string, MemberProfile> = {};
        members.forEach((m) => (map[m.id] = m));
        return map;
    }, [members])();

    const GRADIENT_MAP: Record<string, string> = {
        class: "from-blue-500 to-cyan-600",
        direct: "from-purple-500 to-violet-600",
        teacher_student: "from-teal-500 to-emerald-600",
    };
    const gradient = GRADIENT_MAP[roomType] || GRADIENT_MAP.direct;

    // Realtime subscription
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`chat:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.find((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto focus
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Send message
    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const text = input.trim();
        setInput("");
        setSending(true);

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        try {
            const supabase = createClient();
            await supabase.from("chat_messages").insert({
                room_id: roomId,
                sender_id: currentUserId,
                content: text,
            });

            // Update room timestamp
            await supabase
                .from("chat_rooms")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", roomId);
        } catch (error) {
            console.error("Send error:", error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    // Group messages by date
    const groupByDate = (msgs: ChatMessage[]) => {
        const groups: Record<string, ChatMessage[]> = {};
        msgs.forEach((msg) => {
            const date = new Date(msg.created_at).toLocaleDateString("tr-TR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const groupedMessages = groupByDate(messages);

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border-b border-gray-200 dark:border-white/10 rounded-t-3xl">
                <Link
                    href={`/${rolePath}/messages`}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
                    {roomType === "class" ? (
                        <Users className="w-6 h-6 text-white" />
                    ) : (
                        <User className="w-6 h-6 text-white" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg truncate">{roomName}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {members.length} üye
                    </p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1 bg-gray-50/50 dark:bg-black/10">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl mb-6 shadow-xl`}>
                            💬
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sohbet başlasın!</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">İlk mesajını gönder</p>
                    </div>
                )}

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 bg-gray-200/80 dark:bg-white/10 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400">
                                {date}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {msgs.map((msg, i) => {
                                const isMe = msg.sender_id === currentUserId;
                                const sender = memberMap[msg.sender_id];
                                const prevMsg = msgs[i - 1];
                                const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                const time = new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                                    >
                                        {/* Avatar */}
                                        {!isMe && showAvatar ? (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm text-[10px] font-bold text-white">
                                                {(sender?.full_name || "?")[0].toUpperCase()}
                                            </div>
                                        ) : !isMe ? (
                                            <div className="w-8 shrink-0" />
                                        ) : null}

                                        <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                                            {!isMe && showAvatar && (
                                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5 ml-1">
                                                    {sender?.full_name || sender?.email || "Kullanıcı"}
                                                </span>
                                            )}
                                            <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMe
                                                ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-tr-md shadow-lg"
                                                : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/10 rounded-tl-md shadow-sm"
                                                }`}>
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 ${isMe ? "text-indigo-200" : "text-gray-400"}`}>{time}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border-t border-gray-200 dark:border-white/10 rounded-b-3xl">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Mesajını yaz..."
                            rows={1}
                            className="w-full resize-none rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-5 py-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
                            style={{ minHeight: "48px", maxHeight: "120px" }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        className={`p-3.5 rounded-2xl transition-all duration-200 shrink-0 ${input.trim() && !sending
                            ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                            : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {sending ? (
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
