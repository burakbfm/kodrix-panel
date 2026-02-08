-- Sadece Ders Tablolarını Temizle ve Yeniden Oluştur
-- Supabase SQL Editor'da bu dosyayı çalıştırın

-- 1. Önce bağımlı tabloları sil
DROP TABLE IF EXISTS student_submissions CASCADE;
DROP TABLE IF EXISTS lesson_assignments CASCADE;
DROP TABLE IF EXISTS student_lesson_progress CASCADE;
DROP TABLE IF EXISTS class_lessons CASCADE;
DROP TABLE IF EXISTS lesson_materials CASCADE;

-- 2. Lessons tablosunu sil
DROP TABLE IF EXISTS lessons CASCADE;

-- 3. Lessons tablosunu doğru şekilde oluştur
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    duration_minutes INTEGER DEFAULT 45,
    "order" INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Lesson Materials
CREATE TABLE lesson_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('pdf', 'video', 'link', 'file', 'document')),
    title VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_size BIGINT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Class Lessons (Sınıf-Ders Atamaları)
CREATE TABLE class_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    scheduled_date DATE,
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT false,
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(class_id, lesson_id, scheduled_date)
);

-- 6. Student Progress
CREATE TABLE student_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    class_lesson_id UUID REFERENCES class_lessons(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, class_lesson_id)
);

-- 7. Assignments
CREATE TABLE lesson_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_lesson_id UUID REFERENCES class_lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. Student Submissions
CREATE TABLE student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES lesson_assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_url TEXT,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    score INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE(assignment_id, student_id)
);

-- İndeksler
CREATE INDEX idx_lessons_created_by ON lessons(created_by);
CREATE INDEX idx_lessons_order ON lessons("order");
CREATE INDEX idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);
CREATE INDEX idx_class_lessons_class_id ON class_lessons(class_id);
CREATE INDEX idx_class_lessons_lesson_id ON class_lessons(lesson_id);
CREATE INDEX idx_class_lessons_teacher_id ON class_lessons(teacher_id);
CREATE INDEX idx_class_lessons_is_active ON class_lessons(is_active);
CREATE INDEX idx_student_progress_student_id ON student_lesson_progress(student_id);
CREATE INDEX idx_student_progress_class_lesson_id ON student_lesson_progress(class_lesson_id);
CREATE INDEX idx_assignments_class_lesson_id ON lesson_assignments(class_lesson_id);
CREATE INDEX idx_submissions_assignment_id ON student_submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON student_submissions(student_id);

-- RLS Politikaları
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

-- Lessons RLS
CREATE POLICY "Herkes dersleri görebilir" ON lessons FOR SELECT USING (true);
CREATE POLICY "Sadece adminler ders oluşturabilir" ON lessons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Sadece adminler ders güncelleyebilir" ON lessons FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Sadece adminler ders silebilir" ON lessons FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lesson Materials RLS
CREATE POLICY "Herkes materyalleri görebilir" ON lesson_materials FOR SELECT USING (true);
CREATE POLICY "Sadece adminler materyal ekleyebilir" ON lesson_materials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Sadece adminler materyal güncelleyebilir" ON lesson_materials FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Sadece adminler materyal silebilir" ON lesson_materials FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Class Lessons RLS
CREATE POLICY "Adminler ve öğretmenler sınıf derslerini görebilir" ON class_lessons FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    OR EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.class_id = class_lessons.class_id
        AND e.student_id = auth.uid()
    )
);
CREATE POLICY "Sadece adminler sınıf dersi atayabilir" ON class_lessons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Adminler ve ilgili öğretmen güncelleyebilir" ON class_lessons FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR (teacher_id = auth.uid())
);
CREATE POLICY "Sadece adminler sınıf dersi silebilir" ON class_lessons FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Student Progress RLS
CREATE POLICY "Öğrenciler kendi ilerlemelerini görebilir" ON student_lesson_progress FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "Öğrenciler kendi ilerlemelerini ekleyebilir" ON student_lesson_progress FOR INSERT WITH CHECK (
    student_id = auth.uid()
);
CREATE POLICY "Öğrenciler kendi ilerlemelerini güncelleyebilir" ON student_lesson_progress FOR UPDATE USING (
    student_id = auth.uid()
);

-- Assignments RLS
CREATE POLICY "İlgili kullanıcılar ödevleri görebilir" ON lesson_assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    OR EXISTS (
        SELECT 1 FROM class_lessons cl
        JOIN enrollments e ON e.class_id = cl.class_id
        WHERE cl.id = lesson_assignments.class_lesson_id
        AND e.student_id = auth.uid()
    )
);
CREATE POLICY "Öğretmenler ödev oluşturabilir" ON lesson_assignments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM class_lessons
        WHERE id = lesson_assignments.class_lesson_id
        AND teacher_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Submissions RLS
CREATE POLICY "Öğrenciler kendi gönderimlerini görebilir" ON student_submissions FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "Öğrenciler ödev gönderebilir" ON student_submissions FOR INSERT WITH CHECK (
    student_id = auth.uid()
);
CREATE POLICY "Öğrenciler kendi gönderimlerini güncelleyebilir" ON student_submissions FOR UPDATE USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_lessons_updated_at BEFORE UPDATE ON class_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
