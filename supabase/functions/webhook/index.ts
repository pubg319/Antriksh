import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

serve(async (req) => {
  try {
    const signature = req.headers.get("x-razorpay-signature")
    const textBody = await req.text()

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 })
    }

    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || ''
    
    // Verify Razorpay signature using Deno's native Web Crypto API
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const bodyData = encoder.encode(textBody)

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyData)
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (expectedSignature !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 })
    }

    const event = JSON.parse(textBody)

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle payment capture success
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      // 1. Find the pending payment by order_id
      const { data: paymentRecord, error: fetchError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .single()

      if (fetchError || !paymentRecord) {
        console.error("Payment record not found for order:", orderId)
        return new Response(JSON.stringify({ error: "Payment record not found" }), { status: 404 })
      }

      // 2. Update payment status to success
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "success",
          razorpay_payment_id: paymentId,
        })
        .eq("id", paymentRecord.id)

      if (updateError) throw updateError

      // 3. Create the enrollment for the user
      const { error: enrollmentError } = await supabaseAdmin
        .from("enrollments")
        .insert({
          user_id: paymentRecord.user_id,
          course_id: paymentRecord.course_id,
        })

      if (enrollmentError && enrollmentError.code !== '23505') {
        throw enrollmentError
      }
    }

    // Handle payment failure
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id

      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", orderId)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error("Webhook processing failed:", error)
    return new Response(JSON.stringify({ error: "Webhook Error" }), { status: 500 })
  }
})
