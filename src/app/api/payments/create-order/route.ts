import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/payments";
import { createPaymentOrderSchema } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createPaymentOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, service:services(price), business:businesses(name)")
    .eq("id", parsed.data.booking_id)
    .eq("customer_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const service = booking.service as { price: number } | null;
  const business = booking.business as { name: string } | null;

  try {
    const { orderId, amount, currency } = await createRazorpayOrder({
      amount: service?.price ?? 0,
      bookingId: booking.id,
      businessName: business?.name ?? "",
      customerName: user.user_metadata?.name ?? "",
      customerEmail: user.email ?? "",
    });

    // Store the Razorpay order ID on the booking
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ razorpay_order_id: orderId })
      .eq("id", booking.id);

    if (updateError) {
      console.error("[create-order] failed to store order ID:", updateError.message);
      // Non-fatal — return order ID so payment can still proceed
    }

    return NextResponse.json({ orderId, amount, currency });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
