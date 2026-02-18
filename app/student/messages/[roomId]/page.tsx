import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatRoomClient } from "@/components/ChatRoomClient";

interface Props {
    params: Promise<{ roomId: string }>;
}

export default async function ChatRoomPage({ params }: Props) {
    const supabase = await createClient();
    const { roomId } = await params;

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

    const rolePath = profile?.role === "admin" ? "admin" : profile?.role === "teacher" ? "teacher" : "student";

    // Get room
    const { data: room } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

    if (!room) redirect(`/${rolePath}/messages`);

    // Verify membership (admin bypasses)
    if (profile?.role !== "admin") {
        const { data: membership } = await supabase
            .from("chat_members")
            .select("id")
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .single();

        if (!membership) redirect(`/${rolePath}/messages`);
    }

    // Get members with profiles
    const { data: memberships } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("room_id", roomId);

    const memberIds = memberships?.map((m) => m.user_id) || [];
    let members: any[] = [];
    if (memberIds.length > 0) {
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .in("id", memberIds);
        members = profiles || [];
    }

    // Get messages
    const { data: messages } = await supabase
        .from("chat_messages")
        .select("id, content, sender_id, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

    // Room display name
    let roomName = room.name;
    if (!roomName && room.type !== "class") {
        const others = members.filter((m) => m.id !== user.id);
        roomName = others.map((m) => m.full_name || m.email).join(", ") || "Sohbet";
    }

    return (
        <div className="p-4 md:p-8">
            <ChatRoomClient
                roomId={roomId}
                roomName={roomName || "Sohbet"}
                roomType={room.type}
                currentUserId={user.id}
                initialMessages={messages || []}
                members={members}
                rolePath={rolePath}
            />
        </div>
    );
}
