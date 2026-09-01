import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const MOCK_PREFIX = "SIMUL_";

async function cleanup() {
  console.log("Starting cleanup of simulation data...");

  // Delete caravans created during simulation (they cascade to bookings, payments, tickets)
  const { data: caravans, error: cError } = await supabase
    .from('caravans')
    .select('id')
    .like('about', `${MOCK_PREFIX}%`);
    
  if (cError) {
    console.error("Error fetching mock caravans:", cError.message);
  } else if (caravans && caravans.length > 0) {
    const caravanIds = caravans.map(c => c.id);
    await supabase.from('caravans').delete().in('id', caravanIds);
    console.log(`Deleted ${caravans.length} mock caravans (and their cascaded bookings/payments).`);
  }

  // Delete mock users
  const { data: usersData, error: uError } = await supabase.auth.admin.listUsers();
  if (uError) {
    console.error("Error fetching users:", uError.message);
  } else if (usersData && usersData.users) {
    const mockUsers = usersData.users.filter(u => u.user_metadata && u.user_metadata.mock === MOCK_PREFIX);
    for (const u of mockUsers) {
      await supabase.auth.admin.deleteUser(u.id);
      console.log(`Deleted mock user: ${u.email}`);
    }
    console.log(`Deleted ${mockUsers.length} mock users (and their cascaded organizers/profiles).`);
  }
  
  console.log("Cleanup completed.");
}

cleanup();
