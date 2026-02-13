
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

async function checkColumns() {
    console.log('Checking lessons table columns...');

    // We can check just by selecting and seeing what returns, or intentionally selecting standard columns
    // But to really know columns, we might need to assume or use valid Supabase introspection if available via RPC or just trial and error.
    // However, a simple select * limit 1 is easiest to see keys.

    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching lesson:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
        if (Object.keys(data[0]).includes('teacher_content')) {
            console.log('SUCCESS: teacher_content column exists.');
        } else {
            console.log('FAILURE: teacher_content column MISSING.');
        }
    } else {
        console.log('No lessons found to check columns. Attempting insert to provoke specific error?');
        // If table is empty, we can't check keys via select *.
    }
}

checkColumns();
