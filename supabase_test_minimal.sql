-- MINIMAL TEST - Sadece Lessons Tablosu
-- Bu dosyayı çalıştırın, başarılı olursa devam ederiz

-- Önce tamamen temizle
DROP TABLE IF EXISTS lessons CASCADE;

-- Basit lessons tablosu oluştur
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

-- RLS aktifleştir
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Basit politika
CREATE POLICY "Herkes dersleri görebilir" ON lessons 
    FOR SELECT USING (true);

CREATE POLICY "Adminler ders ekleyebilir" ON lessons 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
