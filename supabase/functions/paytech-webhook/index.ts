import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

async function sha256(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return encodeHex(hashBuffer);
}

serve(async (req) => {
  try {
    // PayTech IPN sends POST data as application/x-www-form-urlencoded
    const formData = await req.formData()
    const type_event = formData.get('type_event')
    const ref_command = formData.get('ref_command') // this is our booking.id
    const token = formData.get('token')
    const api_key_sha256 = formData.get('api_key_sha256')
    const api_secret_sha256 = formData.get('api_secret_sha256')
    
    // Verify signatures
    const expectedKeyHash = await sha256(Deno.env.get('PAYTECH_API_KEY') || '')
    const expectedSecretHash = await sha256(Deno.env.get('PAYTECH_API_SECRET') || '')

    if (api_key_sha256 !== expectedKeyHash || api_secret_sha256 !== expectedSecretHash) {
      console.error("Invalid signatures")
      return new Response("Invalid signatures", { status: 403 })
    }

    if (type_event === 'sale_complete' && ref_command) {
      // Use service role to bypass RLS since this is a background webhook
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // 1. Mark booking as confirmed
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', ref_command)
        .select()
        .single()

      if (bookingError || !booking) {
         console.error("Booking not found or error:", bookingError)
         throw new Error("Booking error")
      }

      // 2. Mark payment as paid
      await supabase
        .from('payments')
        .update({ 
           status: 'paid', 
           external_ref: token?.toString(), 
           paid_at: new Date().toISOString() 
        })
        .eq('booking_id', ref_command)

      // 3. Generate the tickets
      const tickets = []
      for (let i = 0; i < booking.seats; i++) {
        tickets.push({
          booking_id: booking.id,
          qr_code: `TKT-${booking.reference}-${i+1}-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
          status: 'valid'
        })
      }

      await supabase.from('tickets').insert(tickets)

      // 4. Deduct seats from caravan
      const { data: caravan } = await supabase
        .from('caravans')
        .select('seats_left')
        .eq('id', booking.caravan_id)
        .single()
      
      if (caravan) {
        await supabase
          .from('caravans')
          .update({ seats_left: Math.max(0, caravan.seats_left - booking.seats) })
          .eq('id', booking.caravan_id)
      }

      console.log(`Successfully processed payment for booking ${ref_command}`)
      return new Response("OK", { status: 200 })
    }

    return new Response("Ignored", { status: 200 })

  } catch (error: any) {
    console.error("IPN Error:", error.message)
    return new Response(error.message, { status: 400 })
  }
})
