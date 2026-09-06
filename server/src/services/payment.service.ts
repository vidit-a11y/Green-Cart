import crypto from 'crypto';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/** Create a Razorpay order (amount in rupees, converted to paise internally) */
export const createRazorpayOrder = async (amountRupees: number, orderId: string) => {
  return razorpay.orders.create({
    amount: Math.round(amountRupees * 100), // paise
    currency: 'INR',
    receipt: orderId.slice(-40), // Razorpay receipt max 40 chars
    notes: { orderId },
  });
};

/** Verify Razorpay payment signature — returns true if valid */
export const verifyPaymentSignature = (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): boolean => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === razorpay_signature;
};
