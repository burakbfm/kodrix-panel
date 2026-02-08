import { createClient } from "@/lib/supabase/server";
import { FinancePageClient } from "./FinancePageClient";

export const revalidate = 0;

export default async function FinancePage() {
    const supabase = await createClient();

    // 1. Fetch Students (Profiles)
    const { data: students } = await supabase
        .from("profiles")
        .select("id, email, full_name, school_number")
        .eq("role", "student");

    // 2. Fetch Teachers (Profiles)
    const { data: teachers } = await supabase
        .from("profiles")
        .select("id, email, full_name, subject_field")
        .eq("role", "teacher");

    // 3. Fetch All Payments (Agreements)
    const { data: payments } = await supabase
        .from("payments")
        .select("*");

    // 4. Fetch Expenses
    const { data: expenses } = await supabase
        .from("expenses")
        .select("*, profiles:teacher_id(full_name)")
        .order("payment_date", { ascending: false });

    // 5. Fetch Monthly Stats (for Chart)
    const { data: monthlyStats } = await supabase
        .rpc("get_monthly_finance_stats");

    return (
        <FinancePageClient
            students={students || []}
            teachers={teachers || []}
            payments={payments || []}
            expenses={expenses || []}
            monthlyStats={monthlyStats || []}
        />
    );
}
