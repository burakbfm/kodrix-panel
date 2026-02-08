-- Ders Yönetim Sistemi - Mevcut Tabloları Temizleme
-- ÖNCE BU DOSYAYI ÇALIŞTIRIN!

-- Politikaları kaldır (varsa)
DROP POLICY IF EXISTS "Herkes dersleri görebilir" ON lessons;
DROP POLICY IF EXISTS "Sadece adminler ders oluşturabilir" ON lessons;
DROP POLICY IF EXISTS "Sadece adminler ders güncelleyebilir" ON lessons;
DROP POLICY IF EXISTS "Sadece adminler ders silebilir" ON lessons;
DROP POLICY IF EXISTS "Herkes materyalleri görebilir" ON lesson_materials;
DROP POLICY IF EXISTS "Sadece adminler materyal ekleyebilir" ON lesson_materials;
DROP POLICY IF EXISTS "Sadece adminler materyal güncelleyebilir" ON lesson_materials;
DROP POLICY IF EXISTS "Sadece adminler materyal silebilir" ON lesson_materials;
DROP POLICY IF EXISTS "Adminler ve öğretmenler sınıf derslerini görebilir" ON class_lessons;
DROP POLICY IF EXISTS "Sadece adminler sınıf dersi atayabilir" ON class_lessons;
DROP POLICY IF EXISTS "Adminler ve ilgili öğretmen güncelleyebilir" ON class_lessons;
DROP POLICY IF EXISTS "Sadece adminler sınıf dersi silebilir" ON class_lessons;
DROP POLICY IF EXISTS "Öğrenciler kendi ilerlemelerini görebilir" ON student_lesson_progress;
DROP POLICY IF EXISTS "Öğrenciler kendi ilerlemelerini güncelleyebilir" ON student_lesson_progress;
DROP POLICY IF EXISTS "İlgili kullanıcılar ödevleri görebilir" ON lesson_assignments;
DROP POLICY IF EXISTS "Öğretmenler ödev oluşturabilir" ON lesson_assignments;
DROP POLICY IF EXISTS "Öğrenciler kendi gönderimlerini görebilir" ON student_submissions;
DROP POLICY IF EXISTS "Öğrenciler ödev gönderebilir" ON student_submissions;

-- Tabloları sil (CASCADE ile bağımlılıkları da siler)
DROP TABLE IF EXISTS student_submissions CASCADE;
DROP TABLE IF EXISTS lesson_assignments CASCADE;
DROP TABLE IF EXISTS student_lesson_progress CASCADE;
DROP TABLE IF EXISTS class_lessons CASCADE;
DROP TABLE IF EXISTS lesson_materials CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
