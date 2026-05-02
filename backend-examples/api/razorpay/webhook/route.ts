import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client (needs service role to insert enrollments/payments bypassing RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(textBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(textBody);

    // Handle payment capture success
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // 1. Find the pending payment by order_id
      const { data: paymentRecord, error: fetchError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .single();

      if (fetchError || !paymentRecord) {
        console.error("Payment record not found for order:", orderId);
        return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
      }

      // 2. Update payment status to success
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "success",
          razorpay_payment_id: paymentId,
        })
        .eq("id", paymentRecord.id);

      if (updateError) throw updateError;

      // 3. Create the enrollment for the user
      const { error: enrollmentError } = await supabaseAdmin
        .from("enrollments")
        .insert({
          user_id: paymentRecord.user_id,
          course_id: paymentRecord.course_id,
        });

      // Ignore unique constraint error if they somehow already enrolled
      if (enrollmentError && enrollmentError.code !== '23505') {
        throw enrollmentError;
      }
    }

    // Handle payment failure
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", orderId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
