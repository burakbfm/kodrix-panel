import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zupobcfxflxbmykehhxj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cG9iY2Z4Zmx4Ym15a2VoaHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk2ODQxNywiZXhwIjoyMDg1NTQ0NDE3fQ.ZUzAjSWdeBVlK2L6Iq1mizNi5VrxeWKKe03ROZ4Ljmw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const classId = 'd7adc4d5-548c-4ef6-9f64-48b0f7c2ab64';
    console.log(`Checking enrollments for class: ${classId}`);

    const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("class_id", classId);

    if (enrollError) {
        console.error("Enrollment Error:", enrollError);
        return;
    }

    console.log(`Found ${enrollments?.length} enrollments.`);

    if (enrollments && enrollments.length > 0) {
        const userIds = enrollments.map(e => e.user_id);
        console.log("User IDs:", userIds);

        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

        if (profileError) {
            console.error("Profile Error:", profileError);
        } else {
            console.log(`Found ${profiles?.length} profiles.`);
            profiles?.forEach(p => console.log(` - ${p.full_name} (${p.email})`));
            // Check specific user role
            console.log("\n--- User Check ---");
            const email = "202401@kodrix.net";
            const { data: userProfile, error: userError } = await supabase
                .from("profiles")
                .select("*")
                .eq("email", email)
                .single();

            if (userError) {
                console.error("User Profile Error:", userError.message);
            } else {
                console.log("User Found:", userProfile);
                console.log("Role:", userProfile.role);
            }
        }
    }

    // Check Policies
    console.log("\n--- Policies ---");
    const { data: policies, error: policyError } = await supabase
        .from("pg_policies")
        .select("*")
        .in("tablename", ["enrollments", "profiles"]);

    if (policyError) {
        // System tables might not be accessible even with service role via Data API depending on config
        // But let's try.
        console.error("Policy Fetch Error:", policyError.message);
    } else {
        console.log("Policies found:", policies?.length);
        policies?.forEach(p => console.log(`Table: ${p.tablename}, Policy: ${p.policyname}, Cmd: ${p.cmd}`));
    }
}

run();
