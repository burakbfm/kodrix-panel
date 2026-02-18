import { createAdminClient } from "@/lib/supabase/admin";

export async function logSystemAction(
    userId: string | null,
    action: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
) {
    try {
        // We use createAdminClient to ensure logs are always written regardless of user permissions
        const admin = createAdminClient();

        await admin.from("system_logs").insert({
            user_id: userId,
            action,
            details,
            ip_address: ipAddress || "unknown",
            user_agent: userAgent || "unknown",
        });
    } catch (error) {
        console.error("Failed to log system action:", error);
        // Don't throw, logging should not break the main flow
    }
}

/**
 * Log an error to system_logs
 */
export async function logError(
    userId: string | null,
    error: Error | unknown,
    context: Record<string, any> = {}
) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    await logSystemAction(
        userId,
        "error",
        {
            message: errorMessage,
            stack: errorStack,
            ...context,
        }
    );
}
