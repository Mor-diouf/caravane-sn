import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const reqBody = await req.json()
    const { caravanId, seats, method, apiKey, apiSecret, env } = reqBody

    if (!caravanId || !seats || !method) {
      throw new Error("Missing parameters")
    }

    // 1. Fetch Caravan
    const { data: caravan, error: caravanError } = await supabase
      .from('caravans')
      .select('price_fcfa, total_seats, seats_left, organizer_id, organizers(commission_rate)')
      .eq('id', caravanId)
      .single()

    if (caravanError || !caravan) throw new Error("Caravan not found")
    if (caravan.seats_left < seats) throw new Error("Not enough seats available")

    const amount = caravan.price_fcfa * seats
    const rate = Number((caravan.organizers as any)?.commission_rate ?? 0.05)
    const commission = Math.round(amount * rate)

    // 2. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 3. Create Booking
    const ref = `BK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        caravan_id: caravanId,
        seats,
        amount_fcfa: amount,
        reference: ref,
        status: 'pending'
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // 4. Create Payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        booking_id: booking.id,
        amount_fcfa: amount,
        commission_fcfa: commission,
        method: method,
        status: 'pending'
      })

    if (paymentError) throw paymentError

    // 5. Call PayTech
    const PAYTECH_API_KEY = Deno.env.get('PAYTECH_API_KEY') || apiKey
    const PAYTECH_API_SECRET = Deno.env.get('PAYTECH_API_SECRET') || apiSecret
    const PAYTECH_ENV = Deno.env.get('PAYTECH_ENV') || env || 'test'
    
    if (!PAYTECH_API_KEY || !PAYTECH_API_SECRET) {
        throw new Error("Les identifiants PayTech (PAYTECH_API_KEY et PAYTECH_API_SECRET) ne sont pas configurés sur le serveur Supabase.")
    }

    let origin = req.headers.get('origin') || 'https://127.0.0.1:8080'
    if (origin.startsWith('http://')) {
      origin = origin.replace('http://', 'https://')
    }
    if (origin.includes('localhost')) {
      origin = origin.replace('localhost', '127.0.0.1')
    }

    const paytechBody = {
      item_name: `Billet Caravane - ${seats} place(s)`,
      item_price: amount,
      currency: 'XOF',
      ref_command: booking.id, // Using booking.id as the reference for IPN
      command_name: `Réservation ${ref}`,
      env: PAYTECH_ENV,
      ipn_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paytech-webhook`,
      success_url: `${origin}/billets?payment=success&ref=${booking.id}`,
      cancel_url: `${origin}/caravane/${caravanId}?payment=cancelled`
    }

    const paytechResponse = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'API_KEY': PAYTECH_API_KEY,
        'API_SECRET': PAYTECH_API_SECRET
      },
      body: JSON.stringify(paytechBody)
    })

    const paytechData = await paytechResponse.json()

    if (paytechData.success !== 1) {
      throw new Error(`PayTech Error: ${paytechData.error?.[0] || JSON.stringify(paytechData)}`)
    }

    // Return the redirect URL to the frontend
    return new Response(
      JSON.stringify({ redirect_url: paytechData.redirect_url, token: paytechData.token, bookingId: booking.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("PayTech Init Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
