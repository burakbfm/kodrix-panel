
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            envConfig[key.trim()] = values.join('=').trim();
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig['SUPABASE_SERVICE_ROLE_KEY'] || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugInsert() {
    console.log('Fetching a valid module_id...');
    // Get a valid module_id from existing lessons
    const { data: existingLesson, error: fetchError } = await supabase
        .from('lessons')
        .select('module_id, created_by') // Also need a valid user ID ideally, or we use our service role to bypass if RLS allows or we mock it
        .limit(1)
        .single();

    if (fetchError || !existingLesson) {
        console.error('Could not fetch existing lesson to get module_id', fetchError);
        return;
    }

    const moduleId = existingLesson.module_id;
    const userId = existingLesson.created_by; // Use an existing user ID to satisfy foreign keys if any

    console.log(`Using module_id: ${moduleId}, user_id: ${userId}`);

    const attachments = [
        {
            id: crypto.randomUUID(),
            name: "test.pdf",
            url: "https://example.com/test.pdf",
            size: 1234,
            type: "application/pdf",
            uploaded_at: new Date().toISOString(),
            category: "document"
        }
    ];

    const lessonData = {
        module_id: moduleId,
        lesson_number: 999,
        title: "Debug Insert Lesson",
        description: null,
        content: null,
        duration_minutes: 45,
        order: 999,
        video_url: null,
        attachments: attachments,
        teacher_content: "Debug note",
        created_by: userId,
    };

    console.log("Attempting insert with data:", JSON.stringify(lessonData, null, 2));

    const { data, error } = await supabase
        .from("lessons")
        .insert([lessonData])
        .select();

    if (error) {
        console.error("INSERT ERROR FULL DETAILS:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("Insert SUCCESS!", data);
        // Clean up
        await supabase.from("lessons").delete().eq("id", data[0].id);
    }
}

debugInsert();
