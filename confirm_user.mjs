import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^[\"']|[\"']$/g, '');
});

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function confirmUser() {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data.users.find(u => u.email === 'm.d329@zig.univ.sn');
  if (user) {
    await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    console.log('User confirmed successfully!');
  } else {
    console.log('User not found in Supabase Auth.');
  }
}

confirmUser();
