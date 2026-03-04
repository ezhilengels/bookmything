import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyRazorpayWebhookSignature } from "@/lib/payments";
import { sendNotification, sendNewBookingAlertToAdmin } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  // Validate webhook secret is configured
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

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
    const { data: booking, error: bookingFetchError } = await supabase
      .from("bookings")
      .select("*, service:services(name,price), staff:profiles!bookings_staff_id_fkey(name), customer:profiles!bookings_customer_id_fkey(name,phone), business:businesses(*)")
      .eq("razorpay_order_id", orderId)
      .single();

    if (bookingFetchError || !booking) {
      console.error("[webhook] booking not found for order:", orderId, bookingFetchError?.message);
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if already confirmed/paid
    if (booking.payment_status === "paid") {
      console.log("[webhook] booking already paid, skipping:", booking.id);
      return NextResponse.json({ received: true });
    }

    // Update booking to confirmed
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "confirmed", payment_status: "paid", razorpay_payment_id: paymentId })
      .eq("id", booking.id);

    if (updateError) {
      console.error("[webhook] failed to update booking:", booking.id, updateError.message);
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }

    // Get customer email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(booking.customer_id);
    if (authError) {
      console.error("[webhook] failed to fetch auth user:", booking.customer_id, authError.message);
    }

    const business = booking.business as Parameters<typeof sendNotification>[0]["business"];

    if (authUser?.user?.email && business) {
      try {
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
      } catch (notifyErr) {
        console.error("[webhook] notification failed:", notifyErr);
        // Don't return error — booking is confirmed, notification is best-effort
      }

      // Create notification record
      const { error: notifInsertError } = await supabase.from("notifications").insert({
        booking_id: booking.id,
        type: "confirmation",
        channel: "email",
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      if (notifInsertError) {
        console.error("[webhook] failed to insert notification record:", notifInsertError.message);
      }
    }
  }

  if (event.event === "payment.failed") {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId) {
      const { error: failedUpdateError } = await supabase
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("razorpay_order_id", orderId);

      if (failedUpdateError) {
        console.error("[webhook] failed to mark payment as failed:", orderId, failedUpdateError.message);
      }
    }
  }

  return NextResponse.json({ received: true });
}
