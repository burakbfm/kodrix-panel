-- YENİ YAPI: Programs → Modules → Lessons
-- Bu dosyayı çalıştırarak yeni hiyerarşik yapıya geçin

-- 1. Programs Tablosu (Kurs/Program - örn: Python Kodlama Başlangıç)
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_lessons INTEGER DEFAULT 0,
    total_modules INTEGER DEFAULT 0,
    duration_weeks INTEGER,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Modules Tablosu (Modül - örn: Programlamaya Giriş)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Lessons Tablosunu Güncelle (Modül altında)
-- Önce mevcut tabloyu yedekle ve yeniden oluştur
DROP TABLE IF EXISTS lesson_materials CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    lesson_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    meeting_link TEXT,  -- Katılım linki
    duration_minutes INTEGER DEFAULT 45,
    "order" INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Lesson Materials (eski yapı korunuyor)
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

-- 5. Class Programs (sınıfa artık program atanacak, ders değil)
DROP TABLE IF EXISTS class_lessons CASCADE;

CREATE TABLE class_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    start_date DATE,
    is_active BOOLEAN DEFAULT false,
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(class_id, program_id)
);

-- 6. Student Progress (class_lesson yerine lesson bazlı)
DROP TABLE IF EXISTS student_lesson_progress CASCADE;

CREATE TABLE student_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, lesson_id)
);

-- 7. Lesson Assignments güncelle
DROP TABLE IF EXISTS lesson_assignments CASCADE;

CREATE TABLE lesson_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- İndeksler
CREATE INDEX idx_programs_created_by ON programs(created_by);
CREATE INDEX idx_modules_program_id ON modules(program_id);
CREATE INDEX idx_modules_order ON modules("order");
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons("order");
CREATE INDEX idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);
CREATE INDEX idx_class_programs_class_id ON class_programs(class_id);
CREATE INDEX idx_class_programs_program_id ON class_programs(program_id);
CREATE INDEX idx_class_programs_teacher_id ON class_programs(teacher_id);
CREATE INDEX idx_student_progress_student_id ON student_lesson_progress(student_id);
CREATE INDEX idx_student_progress_lesson_id ON student_lesson_progress(lesson_id);
CREATE INDEX idx_assignments_lesson_id ON lesson_assignments(lesson_id);

-- RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_assignments ENABLE ROW LEVEL SECURITY;

-- Programs RLS
CREATE POLICY "Herkes programları görebilir" ON programs FOR SELECT USING (true);
CREATE POLICY "Adminler program oluşturabilir" ON programs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Adminler program güncelleyebilir" ON programs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Adminler program silebilir" ON programs FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Modules RLS
CREATE POLICY "Herkes modülleri görebilir" ON modules FOR SELECT USING (true);
CREATE POLICY "Adminler modül ekleyebilir" ON modules FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Adminler modül güncelleyebilir" ON modules FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lessons RLS
CREATE POLICY "Herkes dersleri görebilir" ON lessons FOR SELECT USING (true);
CREATE POLICY "Adminler ders ekleyebilir" ON lessons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Adminler ve öğretmenler ders güncelleyebilir" ON lessons FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- Lesson Materials RLS
CREATE POLICY "Herkes materyalleri görebilir" ON lesson_materials FOR SELECT USING (true);
CREATE POLICY "Adminler materyal ekleyebilir" ON lesson_materials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Class Programs RLS
CREATE POLICY "İlgili kullanıcılar program atamalarını görebilir" ON class_programs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    OR EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.class_id = class_programs.class_id
        AND e.user_id = auth.uid()
    )
);
CREATE POLICY "Adminler program atayabilir" ON class_programs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Adminler ve öğretmenler güncelleyebilir" ON class_programs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR (teacher_id = auth.uid())
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
        SELECT 1 FROM lessons l
        JOIN modules m ON m.id = l.module_id
        JOIN programs p ON p.id = m.program_id
        JOIN class_programs cp ON cp.program_id = p.id
        JOIN enrollments e ON e.class_id = cp.class_id
        WHERE l.id = lesson_assignments.lesson_id
        AND e.user_id = auth.uid()
    )
);

-- Triggers
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_programs_updated_at BEFORE UPDATE ON class_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
