import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { courseId, userId, couponCode } = await req.json()

    if (!courseId || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch course details to get the correct price
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('price')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Validate Coupon if provided
    let discount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .or(`expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`)
        .single();
      
      if (coupon) {
        if (coupon.discount_type === 'percentage') {
          discount = Math.round(course.price * (coupon.discount_value / 100));
        } else {
          discount = coupon.discount_value;
        }
      }
    }

    const finalPrice = Math.max(0, course.price - discount);

    // 3. Create Razorpay order via REST API directly (to avoid Node.js dependency issues in Deno)
    const amount = finalPrice * 100 // paise
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    
    const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: "INR",
        receipt: `receipt_${userId}_${courseId}`.substring(0, 40)
      })
    })

    const order = await razorpayRes.json()

    if (!razorpayRes.ok) {
      throw new Error(`Razorpay Error: ${JSON.stringify(order)}`)
    }

    // 3. Create a pending payment record in Supabase
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        course_id: courseId,
        amount: finalPrice,
        status: "pending",
        razorpay_order_id: order.id,
      })

    if (paymentError) {
      console.error("Payment insert error:", paymentError)
      return new Response(JSON.stringify({ error: "Failed to initialize payment record" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Return order details
    return new Response(JSON.stringify({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("Order creation failed:", error)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
