import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Supabase oturumunu kapat
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  
  // Login sayfasına geri gönder
  return NextResponse.redirect(new URL("/login", req.url));
}