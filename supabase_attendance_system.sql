-- ============================================
-- KODRIX LMS - ATTENDANCE & CLASS MANAGEMENT SYSTEM
-- ============================================
-- Bu dosya yoklama, sınıf yönetimi ve öğrenci değerlendirme sistemini ekler
-- Çalıştırmadan önce supabase_new_structure.sql'in çalıştırılmış olduğundan emin olun

-- ============================================
-- 1. CLASS SCHEDULES (Ders Takvimi)
-- ============================================
-- Her dersin ne zaman işleneceğini takip eder

CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    class_program_id UUID REFERENCES class_programs(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'postponed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- İndeksler
CREATE INDEX idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX idx_class_schedules_date ON class_schedules(scheduled_date);
CREATE INDEX idx_class_schedules_teacher_id ON class_schedules(teacher_id);
CREATE INDEX idx_class_schedules_lesson_id ON class_schedules(lesson_id);

-- ============================================
-- 2. ATTENDANCE (Yoklama Kayıtları)
-- ============================================
-- Tarih-bazlı yoklama sistemi (Günlük sınıf yoklaması)

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(student_id, class_id, date)
);

-- İndeksler
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ============================================
-- 3. STUDENT EVALUATIONS (Öğrenci Değerlendirmeleri)
-- ============================================
-- Öğretmenlerin öğrencileri değerlendirmesi için

CREATE TABLE IF NOT EXISTS student_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Puanlama alanları
    academic_score INTEGER CHECK (academic_score >= 0 AND academic_score <= 100),
    behavior_score INTEGER CHECK (behavior_score >= 0 AND behavior_score <= 10),
    participation_score INTEGER CHECK (participation_score >= 0 AND participation_score <= 10),
    
    -- Yorumlar
    strengths TEXT,
    areas_for_improvement TEXT,
    general_comments TEXT,
    
    -- Tarih ve meta
    evaluation_period VARCHAR(50), -- "2024 Ocak", "1. Dönem" gibi
    evaluation_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- İndeksler
CREATE INDEX idx_evaluations_student_id ON student_evaluations(student_id);
CREATE INDEX idx_evaluations_class_id ON student_evaluations(class_id);
CREATE INDEX idx_evaluations_teacher_id ON student_evaluations(teacher_id);
CREATE INDEX idx_evaluations_date ON student_evaluations(evaluation_date);

-- ============================================
-- 4. LESSON MATERIALS (Ders Materyalleri) 
-- ============================================
-- Zaten supabase_new_structure.sql'de var, burada sadece referans

-- lesson_materials tablosu derslere dosya eklemek için kullanılacak
-- Supabase Storage 'lesson-files' bucket'ı kullanılmalı

-- ============================================
-- RLS POLİTİKALARI
-- ============================================

-- Class Schedules RLS
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes ders takvimini görebilir" 
    ON class_schedules FOR SELECT 
    USING (true);

CREATE POLICY "Admin ve öğretmen ders planlayabilir" 
    ON class_schedules FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen ders güncelleyebilir" 
    ON class_schedules FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ders takvimini silebilir" 
    ON class_schedules FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Attendance RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenciler kendi yoklamalarını görebilir" 
    ON attendance FOR SELECT 
    USING (
        student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen yoklama alabilir" 
    ON attendance FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen yoklama güncelleyebilir" 
    ON attendance FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin yoklama silebilir" 
    ON attendance FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Student Evaluations RLS
ALTER TABLE student_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenciler kendi değerlendirmelerini görebilir" 
    ON student_evaluations FOR SELECT 
    USING (
        student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen değerlendirme yapabilir" 
    ON student_evaluations FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve değerlendiren öğretmen güncelleyebilir" 
    ON student_evaluations FOR UPDATE 
    USING (
        teacher_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin değerlendirme silebilir" 
    ON student_evaluations FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- TRİGGERLAR
-- ============================================

-- Updated_at otomatik güncelleme (fonksiyon zaten mevcut olmalı)
CREATE TRIGGER update_class_schedules_updated_at 
    BEFORE UPDATE ON class_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_evaluations_updated_at 
    BEFORE UPDATE ON student_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÖRNEK VERİLER (Opsiyonel - Test için)
-- ============================================

-- Bu kısmı production'da çalıştırmayın!
-- Sadece development ortamında test için kullanın

-- COMMENT OUT IN PRODUCTION:
/*
-- Örnek yoklama verisi
INSERT INTO attendance (class_id, student_id, date, status, marked_by) VALUES
    ('class-uuid-here', 'student-uuid-here', CURRENT_DATE, 'present', 'teacher-uuid-here');

-- Örnek değerlendirme
INSERT INTO student_evaluations (student_id, class_id, teacher_id, academic_score, behavior_score, participation_score, general_comments) VALUES
    ('student-uuid-here', 'class-uuid-here', 'teacher-uuid-here', 85, 8, 9, 'Gayet başarılı bir öğrenci');
*/
