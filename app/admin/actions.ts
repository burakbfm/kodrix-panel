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

  // Yeni alanlar (Phase 1)
  const parentName = formData.get("parentName") as string | null;
  const parentPhone = formData.get("parentPhone") as string | null;
  const subjectField = formData.get("subjectField") as string | null;

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
    return;
  }

  if (authUser.user) {
    // 2. Profil Tablosuna İşle (Phase 1: Yeni alanlarla birlikte)
    await supabaseAdmin.from("profiles").upsert({
      id: authUser.user.id,
      email: email,
      school_number: schoolNumber,
      role: role,
      full_name: fullName,
      parent_name: role === "student" ? parentName : null,
      parent_phone: role === "student" ? parentPhone : null,
      subject_field: role === "teacher" ? subjectField : null,
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

// Updated to handle both contexts if needed, but for now we focus on programs revalidation
// If classId is present, we revalidate class, otherwise program.
// But wait, the previous deleteLesson was for CLASSES.
// We need a NEW action for PROGRAM LESSONS to avoid breaking existing class functionality?
// The user has 'programs' and 'classes'.
// Let's modify deleteLesson to handle both or clean it up.
// Actually, I'll rename the argument to be more generic 'parentId' logic or create deleteProgramLesson.

export async function deleteLesson(programId: string, lessonId: string) { // Changed signature!
  const supabase = await createClient();

  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

  if (error) console.log("Ders silme hatası:", error);
  revalidatePath(`/admin/programs/${programId}`);
}

// ============================================
// PAYMENT MANAGEMENT ACTIONS (Phase 1)
// ============================================

export async function createPaymentAgreement(formData: FormData) {
  const supabase = await createClient();

  const studentId = formData.get("studentId") as string;
  const agreedAmount = parseFloat(formData.get("agreedAmount") as string);
  const notes = formData.get("notes") as string;
  const title = formData.get("title") as string; // Yeni alan

  const { error } = await supabase.from("payments").insert([{
    student_id: studentId,
    agreed_amount: agreedAmount,
    paid_amount: 0,
    notes: notes,
    title: title || "Genel Anlaşma", // Varsayılan değer
  }]);

  if (error) {
    console.error("Ödeme anlaşması oluşturma hatası:", error);
  }

  revalidatePath("/admin/finance");
  revalidatePath(`/admin/finance/${studentId}`);
  redirect(`/admin/finance/${studentId}`);
}

export async function addPaymentTransaction(formData: FormData) {
  const supabase = await createClient();

  const paymentId = formData.get("paymentId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paymentDate = formData.get("paymentDate") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const notes = formData.get("notes") as string;
  const studentId = formData.get("studentId") as string; // For revalidation

  // Get current user (admin) for tracking
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Transaction kaydet
  const { error: txError } = await supabase.from("payment_transactions").insert([{
    payment_id: paymentId,
    amount: amount,
    payment_date: paymentDate,
    payment_method: paymentMethod,
    notes: notes,
    created_by: user?.id,
  }]);

  if (txError) {
    console.error("Ödeme kayıt hatası:", txError);
    return;
  }

  // 2. Ana ödeme kaydındaki (payments table) paid_amount'u güncelleme (TRIGGER update_payment_balance TARAFINDAN YAPILIYOR)
  // Manuel güncelleme çift sayıma neden olduğu için kaldırıldı.

  revalidatePath("/admin/finance");
  revalidatePath(`/admin/finance/${studentId}`);
}

export async function updatePaymentAgreement(formData: FormData) {
  const supabase = await createClient();

  const paymentId = formData.get("paymentId") as string;
  const agreedAmount = parseFloat(formData.get("agreedAmount") as string);
  const notes = formData.get("notes") as string;
  const title = formData.get("title") as string; // Yeni alan
  const studentId = formData.get("studentId") as string;

  const { error } = await supabase
    .from("payments")
    .update({
      agreed_amount: agreedAmount,
      notes: notes,
      title: title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (error) {
    console.error("Ödeme güncelleme hatası:", error);
  }

  revalidatePath("/admin/finance");
  revalidatePath(`/admin/finance/${studentId}`);
}

export async function deletePaymentTransaction(formData: FormData) {
  const supabase = await createClient();

  const transactionId = formData.get("transactionId") as string;
  const studentId = formData.get("studentId") as string;

  const { error } = await supabase
    .from("payment_transactions")
    .delete()
    .eq("id", transactionId);

  if (error) {
    console.error("Ödeme silme hatası:", error);
  }

  revalidatePath("/admin/finance");
  revalidatePath(`/admin/finance/${studentId}`);
}

// ============================================
// EXPENSE MANAGEMENT ACTIONS (Phase 1.7)
// ============================================

export async function createExpense(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paymentDate = formData.get("paymentDate") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const teacherId = formData.get("teacherId") as string | null;

  const { error } = await supabase.from("expenses").insert([{
    title,
    amount,
    payment_date: paymentDate,
    category,
    description,
    teacher_id: teacherId || null,
  }]);

  if (error) {
    console.error("Gider ekleme hatası:", error);
  }

  revalidatePath("/admin/finance");
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient();
  const expenseId = formData.get("expenseId") as string;

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    console.error("Gider silme hatası:", error);
  }

  revalidatePath("/admin/finance");
}

// ============================================
// PROGRAM & MODULE MANAGEMENT (NEW)
// ============================================

export async function deleteProgram(programId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("programs").delete().eq("id", programId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function deleteModule(programId: string, moduleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/programs/${programId}`);
}