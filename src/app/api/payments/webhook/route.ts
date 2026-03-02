import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyRazorpayWebhookSignature } from "@/lib/payments";
import { sendNotification, sendNewBookingAlertToAdmin } from "@/lib/notifications";

// Razorpay sends raw body; must disable Next.js body parsing for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  if (!verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createServiceClient();

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;

    if (!orderId) return NextResponse.json({ received: true });

    // Find booking by order ID
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, service:services(name,price), staff:profiles!bookings_staff_id_fkey(name), customer:profiles!bookings_customer_id_fkey(name,phone), business:businesses(*)")
      .eq("razorpay_order_id", orderId)
      .single();

    if (!booking) return NextResponse.json({ received: true });

    // Update booking to confirmed
    await supabase
      .from("bookings")
      .update({ status: "confirmed", payment_status: "paid", razorpay_payment_id: paymentId })
      .eq("id", booking.id);

    // Get customer email
    const { data: authUser } = await supabase.auth.admin.getUserById(booking.customer_id);

    const business = booking.business as Parameters<typeof sendNotification>[0]["business"];

    if (authUser?.user?.email && business) {
      await sendNotification({
        type: "confirmation",
        booking: booking as Parameters<typeof sendNotification>[0]["booking"],
        business,
        customerEmail: authUser.user.email,
      });

      // Notify business admin
      await sendNewBookingAlertToAdmin(
        booking as Parameters<typeof sendNewBookingAlertToAdmin>[0],
        business,
        business.contact_email
      );

      // Create notification record
      await supabase.from("notifications").insert({
        booking_id: booking.id,
        type: "confirmation",
        channel: "email",
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    }
  }

  if (event.event === "payment.failed") {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId) {
      await supabase
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("razorpay_order_id", orderId);
    }
  }

  return NextResponse.json({ received: true });
}
