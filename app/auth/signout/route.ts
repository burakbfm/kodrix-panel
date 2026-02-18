import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { logSystemAction } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Get user before signout
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await logSystemAction(user.id, "logout");
  }

  // Supabase oturumunu kapat
  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  // Login sayfasına geri gönder
  return NextResponse.redirect(new URL("/login", req.url));
}