import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessagingApp } from "@/components/MessagingApp";

export default async function MessagesPage() {
    const supabase = await createClient();

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

    // Get rooms the user belongs to
    const { data: memberships } = await supabase
        .from("chat_members")
        .select("room_id")
        .eq("user_id", user.id);

    const roomIds = memberships?.map((m) => m.room_id) || [];

    let rooms: any[] = [];
    if (roomIds.length > 0) {
        const { data: roomData } = await supabase
            .from("chat_rooms")
            .select("*")
            .in("id", roomIds)
            .order("updated_at", { ascending: false });

        rooms = roomData || [];
    }

    // Get all members + profiles for these rooms
    let roomMembers: Record<string, any[]> = {};
    if (roomIds.length > 0) {
        const { data: members } = await supabase
            .from("chat_members")
            .select("room_id, user_id")
            .in("room_id", roomIds);

        if (members) {
            const allUserIds = [...new Set(members.map((m) => m.user_id))];
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, email, role")
                .in("id", allUserIds);

            for (const member of members) {
                if (!roomMembers[member.room_id]) roomMembers[member.room_id] = [];
                const p = profiles?.find((pr) => pr.id === member.user_id);
                if (p) roomMembers[member.room_id].push(p);
            }
        }
    }

    // Get last message per room
    let lastMessages: Record<string, any> = {};
    for (const roomId of roomIds) {
        const { data: msgs } = await supabase
            .from("chat_messages")
            .select("content, created_at, sender_id")
            .eq("room_id", roomId)
            .order("created_at", { ascending: false })
            .limit(1);

        if (msgs && msgs.length > 0) {
            lastMessages[roomId] = msgs[0];
        }
    }

    // Get potential users for new chats
    let availableUsers: any[] = [];
    if (profile?.role === "admin") {
        const { data } = await supabase.from("profiles").select("id, full_name, email, role").neq("id", user.id);
        availableUsers = data || [];
    } else if (profile?.role === "teacher") {
        const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", user.id);
        const classIds = classes?.map((c) => c.id) || [];

        let studentIds: string[] = [];
        if (classIds.length > 0) {
            const { data: enrollments } = await supabase.from("enrollments").select("user_id").in("class_id", classIds);
            studentIds = enrollments?.map((e) => e.user_id) || [];
        }

        const { data: teachers } = await supabase.from("profiles").select("id, full_name, email, role").eq("role", "teacher").neq("id", user.id);

        let students: any[] = [];
        if (studentIds.length > 0) {
            const { data } = await supabase.from("profiles").select("id, full_name, email, role").in("id", studentIds);
            students = data || [];
        }

        availableUsers = [...(teachers || []), ...students];
    } else {
        const { data: myEnrollments } = await supabase.from("enrollments").select("class_id").eq("user_id", user.id);
        const myClassIds = myEnrollments?.map((e) => e.class_id) || [];

        let classmateIds: string[] = [];
        let teacherIds: string[] = [];

        if (myClassIds.length > 0) {
            const { data: classmates } = await supabase.from("enrollments").select("user_id").in("class_id", myClassIds).neq("user_id", user.id);
            classmateIds = [...new Set(classmates?.map((e) => e.user_id) || [])];

            const { data: classes } = await supabase.from("classes").select("teacher_id").in("id", myClassIds);
            teacherIds = classes?.map((c) => c.teacher_id).filter(Boolean) || [];
        }

        const allIds = [...new Set([...classmateIds, ...teacherIds])];
        if (allIds.length > 0) {
            const { data } = await supabase.from("profiles").select("id, full_name, email, role").in("id", allIds);
            availableUsers = data || [];
        }
    }

    // Build enriched rooms array for client
    const enrichedRooms = rooms.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        class_id: room.class_id,
        members: roomMembers[room.id] || [],
        lastMessage: lastMessages[room.id] || null,
    }));

    return (
        <div className="p-4">
            <MessagingApp
                currentUserId={user.id}
                rolePath={rolePath}
                initialRooms={enrichedRooms}
                availableUsers={availableUsers}
            />
        </div>
    );
}
