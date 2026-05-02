import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Initialize Supabase Admin client (to bypass RLS for verifying courses/creating payments)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { courseId, userId } = await req.json();

    if (!courseId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch course details to get the correct price
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("price")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 2. Create Razorpay order
    // Razorpay amount is in paise (multiply by 100)
    const options = {
      amount: course.price * 100, 
      currency: "INR",
      receipt: `receipt_${userId}_${courseId}`.substring(0, 40),
    };

    const order = await razorpay.orders.create(options);

    // 3. Create a pending payment record in Supabase
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        course_id: courseId,
        amount: course.price,
        status: "pending",
        razorpay_order_id: order.id,
      });

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      return NextResponse.json({ error: "Failed to initialize payment record" }, { status: 500 });
    }

    // 4. Return order details to frontend
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
