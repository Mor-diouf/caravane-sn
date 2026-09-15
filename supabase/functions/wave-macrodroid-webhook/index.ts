import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("Wave Macrodroid Webhook Function up and running!");

serve(async (req) => {
  // CORS headers for preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const payload = await req.json();
    const text = payload.texte_notification;

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing texte_notification" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    console.log("Received notification text:", text);

    // Extract amount
    // e.g. "Paiement de 9 200F reçu de..." or "Paiement de 9200 FCFA"
    let amountStr = "";
    const amountMatch = text.match(/(?:de|reçu)\s*([\d\s]+)\s*(?:F|FCFA)/i);
    if (amountMatch && amountMatch[1]) {
      amountStr = amountMatch[1].replace(/\s/g, ""); // remove spaces
    }

    // Extract phone (Senegal format: 77XXXXXXX, 76XXXXXXX, 78XXXXXXX, 75XXXXXXX, 70XXXXXXX, can contain spaces)
    let phoneStr = "";
    const phoneMatch = text.match(/(7[05678](?:\s*\d){7})/);
    if (phoneMatch && phoneMatch[1]) {
      phoneStr = phoneMatch[1].replace(/\s/g, ""); // strip spaces to get 77XXXXXXX
    }

    if (!amountStr || !phoneStr) {
      console.log("Could not extract amount or phone. Amount:", amountStr, "Phone:", phoneStr);
      return new Response(JSON.stringify({ error: "Could not parse amount or phone", text }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const amount = parseInt(amountStr, 10);
    console.log(`Parsed -> Amount: ${amount}, Phone: ${phoneStr}`);

    // Init Supabase admin client to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Find pending booking
    // Note: We check payer_phone which should be saved when student initiates payment
    const { data: bookings, error: findError } = await supabaseAdmin
      .from("bookings")
      .select("id, amount_fcfa, user_id, seats, caravan_id, selected_seats")
      .eq("status", "pending")
      .eq("payer_phone", phoneStr)
      .eq("amount_fcfa", amount)
      .order("created_at", { ascending: true })
      .limit(1);

    if (findError) {
      throw findError;
    }

    if (!bookings || bookings.length === 0) {
      console.log("No pending booking found for this amount and phone.");
      return new Response(JSON.stringify({ error: "No matching pending booking found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const booking = bookings[0];

    // Mark booking as confirmed
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking.id);

    if (updateError) {
      throw updateError;
    }

    // Create a payment record
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        booking_id: booking.id,
        user_id: booking.user_id,
        method: "wave",
        amount_fcfa: amount,
        status: "paid",
        paid_at: new Date().toISOString(),
      });
      
    if (paymentError) {
      console.error("Error creating payment record (but booking confirmed):", paymentError);
    }

    // Create tickets based on seats
    const ticketsToInsert = booking.selected_seats?.length === booking.seats
      ? booking.selected_seats.map((seatNumber: string) => ({
          booking_id: booking.id,
          seat_number: seatNumber,
          qr_code: crypto.randomUUID(),
          status: "valid",
        }))
      : Array.from({ length: booking.seats }).map(() => ({
          booking_id: booking.id,
          qr_code: crypto.randomUUID(),
          status: "valid",
        }));

    const { error: ticketError } = await supabaseAdmin
      .from("tickets")
      .insert(ticketsToInsert);

    if (ticketError) {
      console.error("Error creating tickets:", ticketError);
    }

    console.log(`Successfully processed payment for booking ${booking.id}`);
    
    return new Response(JSON.stringify({ success: true, booking_id: booking.id }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
