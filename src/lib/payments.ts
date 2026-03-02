import Razorpay from "razorpay";
import crypto from "crypto";

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayInstance;
}

export async function createRazorpayOrder(params: {
  amount: number;  // in INR (will be converted to paise)
  bookingId: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}): Promise<{ orderId: string; amount: number; currency: string }> {
  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount: Math.round(params.amount * 100), // Convert INR to paise
    currency: "INR",
    receipt: params.bookingId.slice(0, 40),
    notes: {
      booking_id: params.bookingId,
      business_name: params.businessName,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount as number,
    currency: order.currency,
  };
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return expectedSignature === signature;
}

export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = `${params.orderId}|${params.paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === params.signature;
}
