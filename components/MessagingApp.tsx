"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Send, Loader2, User, Users, MessageCircle, Plus,
    Search, Paperclip, X, FileText, Image as ImageIcon, File
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { startDirectChat } from "@/app/admin/actions";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─────── Types ───────
interface ChatMessage {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
}

interface MemberProfile {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
}

interface RoomInfo {
    id: string;
    name: string | null;
    type: string;
    class_id: string | null;
}

interface AvailableUser {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
}

interface MessagingAppProps {
    currentUserId: string;
    rolePath: string;
    initialRooms: (RoomInfo & {
        members: MemberProfile[];
        lastMessage?: { content: string; sender_id: string; created_at: string } | null;
    })[];
    availableUsers: AvailableUser[];
}

// ─────── Main Component ───────
export function MessagingApp({ currentUserId, rolePath, initialRooms, availableUsers }: MessagingAppProps) {
    const [rooms, setRooms] = useState(initialRooms);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatSearch, setNewChatSearch] = useState("");
    const [loadingRoom, setLoadingRoom] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const GRADIENT_MAP: Record<string, string> = {
        class: "from-blue-500 to-cyan-600",
        direct: "from-purple-500 to-violet-600",
        teacher_student: "from-teal-500 to-emerald-600",
    };

    // ─── Realtime subscription (Broadcast - bypasses RLS) ───
    useEffect(() => {
        if (!activeRoomId) return;

        const supabase = createClient();

        // Cleanup previous channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`chat-${activeRoomId}`, {
                config: { broadcast: { self: false } }, // Don't echo back to sender
            })
            .on("broadcast", { event: "new_message" }, (payload) => {
                const newMsg = payload.payload as ChatMessage;
                setMessages((prev) => {
                    if (prev.find((m) => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                // Update room's last message in sidebar
                setRooms((prev) =>
                    prev.map((r) =>
                        r.id === activeRoomId
                            ? {
                                ...r,
                                lastMessage: {
                                    content: newMsg.content,
                                    sender_id: newMsg.sender_id,
                                    created_at: newMsg.created_at,
                                },
                            }
                            : r
                    )
                );
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeRoomId]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when room changes
    useEffect(() => {
        if (activeRoomId) inputRef.current?.focus();
    }, [activeRoomId]);

    // ─── Load room messages ───
    const loadRoom = async (roomId: string) => {
        setLoadingRoom(true);
        setActiveRoomId(roomId);
        setFile(null);

        const supabase = createClient();

        // Load messages
        const { data: msgs } = await supabase
            .from("chat_messages")
            .select("id, content, sender_id, created_at, file_url, file_name, file_type")
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

        setMessages(msgs || []);

        // Load members
        const { data: memberData } = await supabase
            .from("chat_members")
            .select("user_id")
            .eq("room_id", roomId);

        const memberIds = memberData?.map((m) => m.user_id) || [];
        if (memberIds.length > 0) {
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, email, role")
                .in("id", memberIds);
            setMembers(profiles || []);
        }

        setLoadingRoom(false);
    };

    // ─── Send message ───
    const handleSend = async () => {
        if ((!input.trim() && !file) || sending || !activeRoomId) return;

        const text = input.trim();
        setInput("");
        setSending(true);

        if (inputRef.current) inputRef.current.style.height = "auto";

        try {
            const supabase = createClient();
            let fileUrl: string | null = null;
            let fileName: string | null = null;
            let fileType: string | null = null;

            // Upload file if present
            if (file) {
                setUploading(true);
                const path = `chat/${activeRoomId}/${Date.now()}-${file.name}`;

                const { error: uploadError } = await supabase.storage
                    .from("chat-files")
                    .upload(path, file);

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from("chat-files")
                        .getPublicUrl(path);
                    fileUrl = urlData.publicUrl;
                    fileName = file.name;
                    fileType = file.type;
                }
                setUploading(false);
                setFile(null);
            }

            const msgContent = text || (fileName ? `📎 ${fileName}` : "");
            const now = new Date().toISOString();

            // 1. Optimistic: Show message instantly for sender
            const optimisticId = `temp-${Date.now()}`;
            const optimisticMsg: ChatMessage = {
                id: optimisticId,
                content: msgContent,
                sender_id: currentUserId,
                created_at: now,
                file_url: fileUrl,
                file_name: fileName,
                file_type: fileType,
            };
            setMessages((prev) => [...prev, optimisticMsg]);

            // Update sidebar last message
            setRooms((prev) =>
                prev.map((r) =>
                    r.id === activeRoomId
                        ? { ...r, lastMessage: { content: msgContent, sender_id: currentUserId, created_at: now } }
                        : r
                )
            );

            // 2. Insert to DB
            const { data: inserted } = await supabase.from("chat_messages").insert({
                room_id: activeRoomId,
                sender_id: currentUserId,
                content: msgContent,
                file_url: fileUrl,
                file_name: fileName,
                file_type: fileType,
            }).select("id, content, sender_id, created_at, file_url, file_name, file_type").single();

            // 3. Replace optimistic message with real one
            if (inserted) {
                setMessages((prev) => prev.map((m) => m.id === optimisticId ? inserted : m));

                // 4. Broadcast to other users in the room
                channelRef.current?.send({
                    type: "broadcast",
                    event: "new_message",
                    payload: inserted,
                });
            }

            // 5. Update room timestamp
            await supabase
                .from("chat_rooms")
                .update({ updated_at: now })
                .eq("id", activeRoomId);
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

    // ─── File select ───
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 10 * 1024 * 1024) {
            toast.error("Dosya boyutu 10MB'dan büyük olamaz!");
            return;
        }
        setFile(f);
        toast.success(`📎 ${f.name} eklendi`);
    };

    // ─── Start new chat ───
    const handleNewChat = async (targetUser: AvailableUser) => {
        setShowNewChat(false);
        setLoadingRoom(true);
        try {
            const roomId = await startDirectChat(targetUser.id);
            // Check if this room is already in the list (existing chat)
            const existingRoom = rooms.find((r) => r.id === roomId);
            if (existingRoom) {
                toast.info(`${targetUser.full_name || targetUser.email} ile zaten sohbetiniz var`);
            } else {
                setRooms((prev) => [
                    {
                        id: roomId,
                        name: null,
                        type: "direct",
                        class_id: null,
                        members: [
                            { id: currentUserId, full_name: "", email: "", role: "" },
                            targetUser,
                        ],
                        lastMessage: null,
                    },
                    ...prev,
                ]);
                toast.success("Yeni sohbet başlatıldı! 🎉");
            }
            loadRoom(roomId);
        } catch (err: any) {
            console.error("New chat error:", err);
            toast.error(err?.message || "Sohbet başlatılamadı");
            setLoadingRoom(false);
        }
    };

    // ─── Helpers ───
    const getDisplayName = (room: typeof rooms[0]) => {
        if (room.name) return room.name;
        const others = room.members.filter((m) => m.id !== currentUserId);
        return others.map((m) => m.full_name || m.email).join(", ") || "Sohbet";
    };

    const filteredRooms = rooms.filter((r) => {
        if (!searchQuery) return true;
        const name = getDisplayName(r).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    const filteredNewUsers = availableUsers.filter((u) => {
        const name = (u.full_name || u.email).toLowerCase();
        return name.includes(newChatSearch.toLowerCase());
    });

    const activeRoom = rooms.find((r) => r.id === activeRoomId);
    const memberMap: Record<string, MemberProfile> = {};
    members.forEach((m) => (memberMap[m.id] = m));

    const groupByDate = (msgs: ChatMessage[]) => {
        const groups: Record<string, ChatMessage[]> = {};
        msgs.forEach((msg) => {
            const date = new Date(msg.created_at).toLocaleDateString("tr-TR", {
                day: "2-digit", month: "long", year: "numeric",
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const roleLabels: Record<string, string> = { student: "Öğrenci", teacher: "Öğretmen", admin: "Admin" };

    // ─── Render file attachment in message ───
    const renderFileAttachment = (msg: ChatMessage) => {
        if (!msg.file_url) return null;
        const isImage = msg.file_type?.startsWith("image/");
        return (
            <div className="mt-2">
                {isImage ? (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                        <img
                            src={msg.file_url}
                            alt={msg.file_name || "Resim"}
                            className="max-w-[240px] max-h-[180px] rounded-xl object-cover border border-white/20 hover:opacity-90 transition"
                        />
                    </a>
                ) : (
                    <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs"
                    >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate">{msg.file_name || "Dosya"}</span>
                    </a>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] max-w-7xl mx-auto rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-gray-950">
            {/* ════════ LEFT PANEL: Chat List ════════ */}
            <div className="w-[340px] shrink-0 border-r border-gray-200 dark:border-white/10 flex flex-col bg-white/80 dark:bg-white/[0.02]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                            Mesajlar
                        </h2>
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white flex items-center justify-center hover:scale-110 transition-all shadow-md"
                            title="Yeni Sohbet"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Sohbet ara..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Room List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredRooms.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">Henüz sohbet yok</p>
                        </div>
                    ) : (
                        filteredRooms.map((room) => {
                            const isActive = room.id === activeRoomId;
                            const gradient = GRADIENT_MAP[room.type] || GRADIENT_MAP.direct;
                            const displayName = getDisplayName(room);

                            return (
                                <button
                                    key={room.id}
                                    onClick={() => loadRoom(room.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${isActive
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 border-r-2 border-indigo-500"
                                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
                                        {room.type === "class" ? (
                                            <Users className="w-5 h-5 text-white" />
                                        ) : (
                                            <User className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`font-bold text-sm truncate ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                                                {displayName}
                                            </p>
                                            {room.lastMessage && (
                                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                                    {new Date(room.lastMessage.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            )}
                                        </div>
                                        {room.lastMessage ? (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {room.lastMessage.content}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic mt-0.5">Henüz mesaj yok</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ════════ RIGHT PANEL: Active Chat ════════ */}
            <div className="flex-1 flex flex-col">
                {!activeRoomId ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-5xl mb-6 shadow-xl">
                            💬
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mesajlarına Hoş Geldin</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                            Sol panelden bir sohbet seç veya yeni bir sohbet başlat
                        </p>
                    </div>
                ) : loadingRoom ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.02]">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${GRADIENT_MAP[activeRoom?.type || "direct"]} flex items-center justify-center shadow-md shrink-0`}>
                                {activeRoom?.type === "class" ? (
                                    <Users className="w-5 h-5 text-white" />
                                ) : (
                                    <User className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                                    {activeRoom ? getDisplayName(activeRoom) : "Sohbet"}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {members.length} üye
                                </p>
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-gray-50/50 dark:bg-black/10">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <p className="text-gray-400 text-sm">İlk mesajını gönder! 👋</p>
                                </div>
                            )}

                            {Object.entries(groupByDate(messages)).map(([date, msgs]) => (
                                <div key={date}>
                                    <div className="flex items-center justify-center my-4">
                                        <span className="px-3 py-1 bg-gray-200/80 dark:bg-white/10 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {date}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {msgs.map((msg, i) => {
                                            const isMe = msg.sender_id === currentUserId;
                                            const sender = memberMap[msg.sender_id];
                                            const prevMsg = msgs[i - 1];
                                            const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                            const time = new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

                                            return (
                                                <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                                    {!isMe && showAvatar ? (
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm text-[10px] font-bold text-white">
                                                            {(sender?.full_name || "?")[0].toUpperCase()}
                                                        </div>
                                                    ) : !isMe ? (
                                                        <div className="w-8 shrink-0" />
                                                    ) : null}

                                                    <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                        {!isMe && showAvatar && (
                                                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5 ml-1">
                                                                {sender?.full_name || sender?.email || "Kullanıcı"}
                                                            </span>
                                                        )}
                                                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMe
                                                            ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-tr-md shadow-lg"
                                                            : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/10 rounded-tl-md shadow-sm"
                                                            }`}>
                                                            {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                                                            {renderFileAttachment(msg)}
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

                        {/* File preview */}
                        {file && (
                            <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-500/10 border-t border-gray-200 dark:border-white/10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                    {file.type.startsWith("image/") ? (
                                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <File className="w-4 h-4 text-indigo-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                </div>
                                <button onClick={() => setFile(null)} className="p-1 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.02]">
                            <div className="flex items-end gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition text-gray-500 hover:text-indigo-500 shrink-0"
                                    title="Dosya ekle (maks 10MB)"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                />
                                <div className="flex-1">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={handleTextareaChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Mesajını yaz..."
                                        rows={1}
                                        className="w-full resize-none rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition placeholder-gray-400"
                                        style={{ minHeight: "44px", maxHeight: "120px" }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || uploading || (!input.trim() && !file)}
                                    className={`p-3 rounded-xl transition-all duration-200 shrink-0 ${(input.trim() || file) && !sending
                                        ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                                        : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    {sending || uploading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ════════ NEW CHAT MODAL ════════ */}
            {showNewChat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowNewChat(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/10 flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-t-3xl">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-500" />
                                Yeni Sohbet Başlat
                            </h2>
                            <button onClick={() => setShowNewChat(false)} className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:scale-110 transition-all shadow-sm">✕</button>
                        </div>
                        <div className="p-4 border-b border-gray-100 dark:border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={newChatSearch}
                                    onChange={(e) => setNewChatSearch(e.target.value)}
                                    placeholder="İsim veya e-posta ara..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredNewUsers.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-8">Kullanıcı bulunamadı</p>
                            ) : (
                                filteredNewUsers.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleNewChat(u)}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md text-sm font-bold text-white">
                                            {(u.full_name || u.email)[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 truncate">
                                                {u.full_name || u.email}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">{roleLabels[u.role] || u.role}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
