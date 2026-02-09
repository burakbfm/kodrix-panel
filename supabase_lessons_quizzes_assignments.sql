-- ============================================
-- KODRIX LMS - CLASS LESSONS, QUIZZES & ASSIGNMENTS SYSTEM
-- ============================================
-- Sınıf bazlı ders yönetimi, quiz ve ödev sistemi

-- ============================================
-- 1. CLASS LESSONS (Sınıf Dersleri)
-- ============================================
-- Sınıflara bağlı gerçek dersler (program şablonlarından bağımsız)

CREATE TABLE IF NOT EXISTS class_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    
    title VARCHAR(255) NOT NULL,
    module_name VARCHAR(255), -- Hangi modül/konu
    description TEXT,
    
    lesson_date DATE NOT NULL,
    lesson_time TIME,
    duration_minutes INTEGER DEFAULT 90,
    
    meeting_link TEXT, -- Zoom/Teams toplantı linki
    recording_link TEXT, -- Ders kaydı linki
    teacher_notes TEXT, -- Öğretmen notları (öğrenciler görebilir)
    
    is_active BOOLEAN DEFAULT false, -- Aktifse öğrenciler görebilir
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_class_lessons_class_id ON class_lessons(class_id);
CREATE INDEX idx_class_lessons_program_id ON class_lessons(program_id);
CREATE INDEX idx_class_lessons_date ON class_lessons(lesson_date);
CREATE INDEX idx_class_lessons_active ON class_lessons(is_active);

-- ============================================
-- 2. QUIZZES (Quiz/Testler)
-- ============================================
-- Sınıf bağımsız quiz oluşturma, sonra atama

CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Quiz ayarları
    time_limit_minutes INTEGER, -- null = sınırsız
    passing_score INTEGER DEFAULT 60, -- Geçme notu
    show_correct_answers BOOLEAN DEFAULT true, -- Bittikten sonra doğru cevapları göster
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_answers BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);

-- ============================================
-- 3. QUIZ QUESTIONS (Quiz Soruları)
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    
    question_text TEXT NOT NULL,
    question_image_url TEXT, -- Resimli soru için
    
    question_type VARCHAR(50) DEFAULT 'multiple_choice' CHECK (
        question_type IN ('multiple_choice', 'true_false', 'short_answer')
    ),
    
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL, -- Soru sırası
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- ============================================
-- 4. QUIZ ANSWERS (Quiz Cevap Seçenekleri)
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    
    answer_text TEXT,
    answer_image_url TEXT, -- Resimli cevap için
    
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);

-- ============================================
-- 5. CLASS QUIZZES (Sınıfa Atanmış Quizler)
-- ============================================

CREATE TABLE IF NOT EXISTS class_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES class_lessons(id) ON DELETE SET NULL,
    
    is_active BOOLEAN DEFAULT false, -- Aktifse öğrenciler görebilir
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(class_id, quiz_id)
);

CREATE INDEX idx_class_quizzes_class_id ON class_quizzes(class_id);
CREATE INDEX idx_class_quizzes_quiz_id ON class_quizzes(quiz_id);

-- ============================================
-- 6. QUIZ SUBMISSIONS (Quiz Cevapları)
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_quiz_id UUID NOT NULL REFERENCES class_quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    score DECIMAL(5,2), -- Alınan puan
    total_points INTEGER, -- Toplam puan
    percentage DECIMAL(5,2), -- Yüzde
    
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(class_quiz_id, student_id)
);

CREATE INDEX idx_quiz_submissions_class_quiz ON quiz_submissions(class_quiz_id);
CREATE INDEX idx_quiz_submissions_student ON quiz_submissions(student_id);

-- ============================================
-- 7. QUIZ SUBMISSION ANSWERS (Öğrenci Cevapları)
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_answer_id UUID REFERENCES quiz_answers(id) ON DELETE SET NULL,
    text_answer TEXT, -- short_answer tipi için
    
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_submission_answers_submission ON quiz_submission_answers(submission_id);

-- ============================================
-- 8. CLASS ASSIGNMENTS (Sınıf Ödevleri)
-- ============================================

CREATE TABLE IF NOT EXISTS class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES class_lessons(id) ON DELETE SET NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points INTEGER DEFAULT 100,
    
    is_active BOOLEAN DEFAULT true, -- Aktifse öğrenciler görebilir
    allow_late_submission BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_class_assignments_class_id ON class_assignments(class_id);
CREATE INDEX idx_class_assignments_lesson_id ON class_assignments(lesson_id);
CREATE INDEX idx_class_assignments_due_date ON class_assignments(due_date);

-- ============================================
-- 9. CLASS ASSIGNMENT SUBMISSIONS (Ödev Teslim)
-- ============================================

CREATE TABLE IF NOT EXISTS class_assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES class_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    submission_text TEXT,
    file_url TEXT, -- Supabase Storage'dan dosya linki
    file_name VARCHAR(255),
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    is_late BOOLEAN DEFAULT false,
    
    -- Değerlendirme
    score DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_class_assignment_submissions_assignment ON class_assignment_submissions(assignment_id);
CREATE INDEX idx_class_assignment_submissions_student ON class_assignment_submissions(student_id);

-- ============================================
-- 10. ATTENDANCE - Lesson ID Ekleme
-- ============================================

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES class_lessons(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_lesson_id ON attendance(lesson_id);

-- Update class_schedules to reference class_lessons
ALTER TABLE class_schedules DROP CONSTRAINT IF EXISTS class_schedules_lesson_id_fkey;
ALTER TABLE class_schedules ADD CONSTRAINT class_schedules_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES class_lessons(id) ON DELETE CASCADE;

-- ============================================
-- RLS POLİTİKALARI
-- ============================================

-- Class Lessons RLS
ALTER TABLE class_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes aktif dersleri görebilir" 
    ON class_lessons FOR SELECT 
    USING (
        is_active = true 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen ders oluşturabilir" 
    ON class_lessons FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen ders güncelleyebilir" 
    ON class_lessons FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ders silebilir" 
    ON class_lessons FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Quizzes RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve öğretmen quiz görebilir" 
    ON quizzes FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen quiz oluşturabilir" 
    ON quizzes FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve oluşturan quiz güncelleyebilir" 
    ON quizzes FOR UPDATE 
    USING (
        created_by = auth.uid() 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin quiz silebilir" 
    ON quizzes FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Quiz Questions RLS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve öğretmen soru görebilir" 
    ON quiz_questions FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen soru ekleyebilir" 
    ON quiz_questions FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

-- Quiz Answers RLS  
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve öğretmen cevap görebilir" 
    ON quiz_answers FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen cevap ekleyebilir" 
    ON quiz_answers FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

-- Class Quizzes RLS
ALTER TABLE class_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenciler aktif quizleri görebilir" 
    ON class_quizzes FOR SELECT 
    USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.class_id = class_quizzes.class_id AND e.user_id = auth.uid()
        ))
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen quiz atayabilir" 
    ON class_quizzes FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

-- Class Assignments RLS
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenciler aktif ödevleri görebilir" 
    ON class_assignments FOR SELECT 
    USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.class_id = class_assignments.class_id AND e.user_id = auth.uid()
        ))
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen ödev oluşturabilir" 
    ON class_assignments FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ve öğretmen ödev güncelleyebilir" 
    ON class_assignments FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin ödev silebilir" 
    ON class_assignments FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Class Assignment Submissions RLS
ALTER TABLE class_assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenciler kendi ödevlerini görebilir" 
    ON class_assignment_submissions FOR SELECT 
    USING (
        student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Öğrenciler ödev gönderebilir" 
    ON class_assignment_submissions FOR INSERT 
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Öğrenciler kendi ödevlerini güncelleyebilir" 
    ON class_assignment_submissions FOR UPDATE 
    USING (
        student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

-- Quiz Submissions RLS
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenciler kendi quiz sonuçlarını görebilir" 
    ON quiz_submissions FOR SELECT 
    USING (
        student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Öğrenciler quiz gönderebilir" 
    ON quiz_submissions FOR INSERT 
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Öğrenciler kendi quiz cevaplarını görebilir" 
    ON quiz_submission_answers FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM quiz_submissions WHERE id = submission_id AND student_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

-- ============================================
-- TRİGGERLAR
-- ============================================

CREATE TRIGGER update_class_lessons_updated_at 
    BEFORE UPDATE ON class_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_assignments_updated_at 
    BEFORE UPDATE ON class_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
