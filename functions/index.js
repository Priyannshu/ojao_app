/**
 * ojao Cloud Functions — Razorpay order creation & payment verification.
 *
 * The Flutter client (lib/data/services/payment_service.dart) invokes:
 *   - createRazorpayOrder({ amount, currency, userId, appointmentId })
 *   - verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId,
 *                             razorpaySignature, appointmentId })
 *
 * Keys are stored as secrets, never in source:
 *   firebase functions:secrets:set RAZORPAY_KEY_ID
 *   firebase functions:secrets:set RAZORPAY_KEY_SECRET
 */
const crypto = require("crypto");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");

exports.createRazorpayOrder = onCall(
    {secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign in required.");
      }
      const {amount, currency, appointmentId} = request.data || {};
      if (typeof amount !== "number" || amount <= 0) {
        throw new HttpsError("invalid-argument", "A positive amount is required.");
      }

      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID.value(),
        key_secret: RAZORPAY_KEY_SECRET.value(),
      });

      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100), // paise
          currency: currency || "INR",
          receipt: appointmentId || `rcpt_${Date.now()}`,
          notes: {
            userId: request.auth.uid,
            appointmentId: appointmentId || "",
          },
        });
        return {orderId: order.id, amount: order.amount, currency: order.currency};
      } catch (err) {
        console.error("createRazorpayOrder failed", err);
        throw new HttpsError("internal", "Could not create the payment order.");
      }
    },
);

exports.verifyRazorpayPayment = onCall(
    {secrets: [RAZORPAY_KEY_SECRET]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign in required.");
      }
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        appointmentId,
        facilityId,
      } = request.data || {};

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new HttpsError("invalid-argument", "Missing verification fields.");
      }
      if (!facilityId) {
        throw new HttpsError("invalid-argument", "A facilityId is required.");
      }

      // Verify the signature: HMAC_SHA256(order_id + "|" + payment_id, secret).
      const expected = crypto
          .createHmac("sha256", RAZORPAY_KEY_SECRET.value())
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest("hex");

      const valid = crypto.timingSafeEqual(
          Buffer.from(expected),
          Buffer.from(razorpaySignature),
      );

      if (!valid) {
        // Record the failed attempt for audit, then reject.
        await admin.firestore()
            .collection(`facilities/${facilityId}/payments`).add({
              userId: request.auth.uid,
              appointmentId: appointmentId || "",
              facilityId,
              razorpayOrderId,
              razorpayPaymentId,
              status: "failed",
              createdAt: new Date().toISOString(),
            });
        throw new HttpsError("permission-denied", "Signature verification failed.");
      }

      // Mark the appointment confirmed on successful payment.
      if (appointmentId && facilityId) {
        await admin
            .firestore()
            .doc(`facilities/${facilityId}/appointments/${appointmentId}`)
            .set({status: "confirmed"}, {merge: true});
      }

      return {success: true};
    },
);

// --- Phone + password auth (Fast2SMS OTP) ---------------------------------
// Defined in otp_auth.js; required AFTER admin.initializeApp() above so the
// shared Admin app is ready. Re-exported here so Firebase discovers them.
const otpAuth = require("./otp_auth");
exports.sendPhoneOtp = otpAuth.sendPhoneOtp;
exports.registerWithOtp = otpAuth.registerWithOtp;
exports.resetPasswordWithOtp = otpAuth.resetPasswordWithOtp;
