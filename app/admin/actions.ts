"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- SINIF İŞLEMLERİ (ESKİLER) ---

export async function createClass(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  
  const { error } = await supabase.from("classes").insert([{ name }]);
  if (error) console.error("Sınıf ekleme hatası:", error);
  revalidatePath("/admin/classes");
}

export async function deleteClass(formData: FormData) {
    const supabase = await createClient();
    const classId = formData.get("classId") as string;
    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) console.error("Silme hatası:", error);
    revalidatePath("/admin/classes");
}

// --- YENİ EKLENENLER: DERS İŞLEMLERİ ---

export async function createLesson(formData: FormData) {
  const supabase = await createClient();

  const classId = formData.get("classId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const meetLink = formData.get("meetLink") as string;
  const videoUrl = formData.get("videoUrl") as string;
  
  // DOSYA YÜKLEME İŞLEMİ BURADA BAŞLIYOR
  const file = formData.get("file") as File;
  let fileUrl = null;

  if (file && file.size > 0) {
    // Dosya ismini benzersiz yap (çakışmasın diye tarih ekliyoruz)
    const fileName = `${Date.now()}-${file.name}`;
    
    // Supabase Storage'a yükle
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("lesson-files") // Oluşturduğumuz bucket adı
      .upload(fileName, file);

    if (uploadError) {
      console.error("Dosya yükleme hatası:", uploadError);
      // Hata olsa bile dersi oluşturmaya devam etsin mi? Şimdilik devam etsin.
    } else {
      // Yükleme başarılıysa, herkese açık linki al
      const { data: { publicUrl } } = supabase
        .storage
        .from("lesson-files")
        .getPublicUrl(fileName);
        
      fileUrl = publicUrl;
    }
  }

  // Veritabanına kaydet (file_url ile birlikte)
  const { error } = await supabase.from("lessons").insert([{
    class_id: classId,
    title,
    description,
    meet_link: meetLink,
    video_url: videoUrl,
    file_url: fileUrl, // <-- Yeni sütunumuz
    is_active: false
  }]);

  if (error) console.log("Ders ekleme hatası:", error);

  revalidatePath(`/admin/classes/${classId}`);
}

export async function toggleLessonStatus(formData: FormData) {
  const supabase = await createClient();
  const lessonId = formData.get("lessonId") as string;
  const currentStatus = formData.get("currentStatus") === "true"; // Şu an açık mı?
  const classId = formData.get("classId") as string; // Sayfayı yenilemek için lazım

  // Durumu tersine çevir (Açıksa kapat, kapalıysa aç)
  const { error } = await supabase
    .from("lessons")
    .update({ is_active: !currentStatus })
    .eq("id", lessonId);

  if (error) console.log("Güncelleme hatası:", error);

  revalidatePath(`/admin/classes/${classId}`);
}

export async function deleteLesson(formData: FormData) {
  const supabase = await createClient();
  const lessonId = formData.get("lessonId") as string;
  const classId = formData.get("classId") as string;

  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

  if (error) console.log("Ders silme hatası:", error);
  revalidatePath(`/admin/classes/${classId}`);
}