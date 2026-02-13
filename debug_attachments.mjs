
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAttachments() {
    console.log('Fetching lessons with attachments...');
    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, title, attachments, updated_at')
        .not('attachments', 'is', null) // Filter out nulls
        .order('updated_at', { ascending: false })
        .limit(10);

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
