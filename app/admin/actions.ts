"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"; // Yeni dosyamız
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

// --- MERKEZİ KULLANICI EKLEME (Öğrenci & Öğretmen) ---
export async function createSystemUser(formData: FormData) {
  const supabaseAdmin = createAdminClient();

  const role = formData.get("role") as "student" | "teacher";
  const fullName = formData.get("fullName") as string;
  const password = formData.get("password") as string || "123456";
  
  // Öğrenciyse Okul No, Öğretmense E-posta alacağız
  const identifier = formData.get("identifier") as string; 
  
  let email = "";
  let schoolNumber = null;

  // Role göre e-posta ayarla
  if (role === "student") {
    schoolNumber = identifier;
    email = `${identifier}@kodrix.net`; // Öğrenciye sahte mail
  } else {
    email = identifier; // Öğretmenin gerçek maili
  }

  // 1. Auth Kullanıcısı Oluştur
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: role }
  });

  if (authError) {
    console.error("Kullanıcı oluşturma hatası:", authError.message);
    // Hata yönetimi burada yapılabilir
    return;
  }

  if (authUser.user) {
    // 2. Profil Tablosuna İşle
    await supabaseAdmin.from("profiles").upsert({
       id: authUser.user.id,
       email: email,
       school_number: schoolNumber, // Öğretmense NULL gider, sorun yok
       role: role,
       // full_name: fullName // Eğer tablonda varsa aç
    });
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

// --- KULLANICI SİLME ---
export async function deleteUser(formData: FormData) {
    const supabaseAdmin = createAdminClient();
    const userId = formData.get("userId") as string;
    
    // Auth'dan sil (Profil tablosundan otomatik silinir - Cascade varsa)
    await supabaseAdmin.auth.admin.deleteUser(userId);
    
    // Garanti olsun diye profilden de silelim
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    revalidatePath("/admin/users");
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

// --- DERS GÜNCELLEME (YENİ) ---
export async function updateLesson(formData: FormData) {
  const supabase = await createClient();
  
  const lessonId = formData.get("lessonId") as string;
  const classId = formData.get("classId") as string;
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const meetLink = formData.get("meetLink") as string;
  const videoUrl = formData.get("videoUrl") as string;

  // 1. Güncellenecek verileri hazırla
  const updates: any = { 
    title, 
    description, 
    meet_link: meetLink, 
    video_url: videoUrl 
  };

  // 2. Eğer YENİ bir dosya seçildiyse, onu da yükle ve güncelle
  const file = formData.get("file") as File;
  
  if (file && file.size > 0) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("lesson-files")
      .upload(fileName, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from("lesson-files")
        .getPublicUrl(fileName);
      
      updates.file_url = publicUrl; // Yeni linki güncelleme listesine ekle
    }
  }

  // 3. Veritabanını güncelle
  const { error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", lessonId);

  if (error) console.error("Güncelleme hatası:", error);
  
  revalidatePath(`/admin/classes/${classId}`);
  redirect(`/admin/classes/${classId}`);
}

// --- SIRALAMA DEĞİŞTİRME (YENİ) ---
export async function moveLesson(formData: FormData) {
  const supabase = await createClient();
  const lessonId = formData.get("lessonId") as string;
  const classId = formData.get("classId") as string;
  const direction = formData.get("direction") as "up" | "down";
  const currentOrder = parseInt(formData.get("currentOrder") as string);

  // Yer değiştireceği hedef sırayı belirle
  const targetOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

  // 1. Hedef sırada oturan dersi bul (Onu bizim yerimize kaydıracağız)
  const { data: neighborLesson } = await supabase
    .from("lessons")
    .select("id, order_index")
    .eq("class_id", classId)
    .eq("order_index", targetOrder)
    .single();

  if (neighborLesson) {
    // Komşuyu bizim yerimize al
    await supabase.from("lessons").update({ order_index: currentOrder }).eq("id", neighborLesson.id);
    // Bizi komşunun yerine al
    await supabase.from("lessons").update({ order_index: targetOrder }).eq("id", lessonId);
  } else {
    // Eğer komşu yoksa (boşluğa denk geldiysek), direkt sıramızı değiştir
    await supabase.from("lessons").update({ order_index: targetOrder }).eq("id", lessonId);
  }

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