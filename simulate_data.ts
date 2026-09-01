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

async function run() {
  console.log("Starting simulation data generation...");

  // 1. Create Organizer Users
  const orgUsersData = [
    { email: 'org1_simul@test.com', password: 'password123', name: 'Amicale UASZ Simul', phone: '771112233', abbr: 'uasz' },
    { email: 'org2_simul@test.com', password: 'password123', name: 'Amicale UCAD Simul', phone: '772223344', abbr: 'ucad' },
    { email: 'org3_simul@test.com', password: 'password123', name: 'Amicale UGB Simul', phone: '773334455', abbr: 'ugb' },
  ];

  const orgUsers = [];
  for (const org of orgUsersData) {
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: org.email,
      password: org.password,
      email_confirm: true,
      user_metadata: { full_name: org.name, phone: org.phone, mock: MOCK_PREFIX }
    });
    if (error) {
      console.log(`Error creating org user ${org.email}:`, error.message);
      continue;
    }
    console.log(`Created Auth User: ${org.email}`);
    
    // Update role
    await supabase.from('user_roles').update({ role: 'organizer' }).eq('user_id', user.user.id);
    
    // Create Organizer Profile
    const { data: organizer, error: orgError } = await supabase.from('organizers').insert({
      owner_id: user.user.id,
      name: org.name,
      description: `Organisateur généré pour simulation - ${org.name}`,
      phone: org.phone,
      whatsapp: org.phone,
      university_id: org.abbr,
      status: 'approved', // Auto approve for simulation
    }).select().single();
    
    if (orgError) {
      console.error(`Error creating organizer for ${org.email}:`, orgError.message);
    } else {
      console.log(`Created Organizer: ${organizer.name}`);
      orgUsers.push({ user: user.user, organizer });
    }
  }

  // 2. Create Students
  const studentData = [
    { email: 'student1_simul@test.com', password: 'password123', name: 'Student One', phone: '701111111' },
    { email: 'student2_simul@test.com', password: 'password123', name: 'Student Two', phone: '702222222' },
  ];
  
  const students = [];
  for (const stu of studentData) {
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: stu.email,
      password: stu.password,
      email_confirm: true,
      user_metadata: { full_name: stu.name, phone: stu.phone, mock: MOCK_PREFIX }
    });
    if (!error) {
      console.log(`Created Student: ${stu.email}`);
      students.push(user.user);
    }
  }

  // 3. Create Trips (Caravans)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const caravansData = [];
  if (orgUsers[0]) caravansData.push({ org: orgUsers[0], from: 'Ziguinchor', to: 'Dakar', date: tomorrow, price: 10000, seats: 50, abbr: 'uasz' });
  if (orgUsers[0]) caravansData.push({ org: orgUsers[0], from: 'Ziguinchor', to: 'Thiès', date: nextWeek, price: 9000, seats: 30, abbr: 'uasz' });
  if (orgUsers[1]) caravansData.push({ org: orgUsers[1], from: 'Dakar', to: 'Saint-Louis', date: tomorrow, price: 5000, seats: 60, abbr: 'ucad' });
  if (orgUsers[1]) caravansData.push({ org: orgUsers[1], from: 'Dakar', to: 'Ziguinchor', date: nextWeek, price: 12000, seats: 40, abbr: 'ucad' });
  if (orgUsers[2]) caravansData.push({ org: orgUsers[2], from: 'Saint-Louis', to: 'Dakar', date: tomorrow, price: 5000, seats: 70, abbr: 'ugb' });

  const caravans = [];
  for (let i = 0; i < caravansData.length; i++) {
    const cData = caravansData[i];
    const { data: caravan, error } = await supabase.from('caravans').insert({
      organizer_id: cData.org.organizer.id,
      university_id: cData.abbr,
      from_label: cData.from,
      to_label: cData.to,
      departure_at: cData.date.toISOString(),
      pickup: 'Campus Principal',
      dropoff: 'Gare Routière',
      price_fcfa: cData.price,
      total_seats: cData.seats,
      seats_left: cData.seats,
      status: 'published',
      amenities: ['wifi', 'ac'],
      about: `${MOCK_PREFIX} - Voyage spécial de ${cData.from} à ${cData.to}`
    }).select().single();
    
    if (error) console.error("Error creating caravan:", error.message);
    else {
      console.log(`Created Caravan: ${cData.from} -> ${cData.to}`);
      caravans.push(caravan);
    }
  }

  // 4. Create Bookings and Payments
  if (students.length > 0 && caravans.length > 0) {
    for (const caravan of caravans) {
      // Create 2 bookings for each caravan
      for (const student of students) {
        const { data: booking, error: bError } = await supabase.from('bookings').insert({
          caravan_id: caravan.id,
          user_id: student.id,
          seats: 1,
          amount_fcfa: caravan.price_fcfa,
          reference: `REF-${MOCK_PREFIX}-${Math.floor(Math.random()*100000)}`,
          status: 'confirmed',
          payer_phone: student.user_metadata?.phone || '000',
          passenger_name: student.user_metadata?.full_name || 'Student'
        }).select().single();

        if (bError) {
          console.error("Error creating booking:", bError.message);
        } else {
          console.log(`Created Booking for ${caravan.from_label} -> ${caravan.to_label}`);
          
          // Create Payment
          await supabase.from('payments').insert({
            booking_id: booking.id,
            user_id: student.id,
            method: 'wave',
            amount_fcfa: booking.amount_fcfa,
            commission_fcfa: Math.round(booking.amount_fcfa * 0.08),
            status: 'paid',
            external_ref: `WAVE-${MOCK_PREFIX}-${Math.floor(Math.random()*100000)}`,
            paid_at: new Date().toISOString()
          });
        }
      }
    }
  }

  // 5. Create Payout Requests (Retraits)
  for (const org of orgUsers) {
    const { error } = await supabase.from('payouts').insert({
      organizer_id: org.organizer.id,
      amount_fcfa: 15000,
      method: 'wave',
      status: 'requested'
    });
    if (error) {
      console.error("Error creating payout:", error.message);
    } else {
      console.log(`Created Payout request for ${org.organizer.name}`);
    }
  }

  console.log("Simulation data generation completed.");
}

run();
