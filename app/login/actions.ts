"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logSystemAction } from "@/lib/logger";

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // Formdan gelen verileri al
  const schoolNumber = formData.get("schoolNumber") as string;
  const password = formData.get("password") as string;

  // Okul numarasını email formatına çevir (Hile burada!)
  const email = `${schoolNumber}@kodrix.net`;

  // Supabase ile giriş yapmayı dene
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Hata varsa geri dön
    return { error: "Giriş başarısız! Numara veya şifre yanlış." };
  }

  // Log login action
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await logSystemAction(user.id, "login", { method: "email" });
  }

  // Başarılıysa anasayfaya yönlendir
  revalidatePath("/", "layout");
  redirect("/");
}