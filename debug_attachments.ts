
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using service role key if available for bypassing RLS, otherwise anon
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAttachments() {
    console.log('Fetching latest lesson...');
    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, title, attachments, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error fetching lessons:', error);
        return;
    }

    lessons.forEach(lesson => {
        console.log(`\nLesson: ${lesson.title} (${lesson.id})`);
        console.log('Updated:', lesson.updated_at);
        if (lesson.attachments) {
            console.log('Attachments:', JSON.stringify(lesson.attachments, null, 2));
        } else {
            console.log('Attachments: NULL or Empty');
        }
    });
}

checkAttachments();
