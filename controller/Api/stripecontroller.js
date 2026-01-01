/**
 * controller/Api/stripecontroller.js
 *
 * OPTIMAL VERSION ✅
 * - No hard-coded secrets (uses env)
 * - No global state (safe for concurrent users)
 * - No Stripe Product/Price spam (uses inline price_data)
 * - Stores Stripe session id + statuses on the booking
 * - Success page verifies session + updates booking safely
 * - Uses STRIPE_CURRENCY (e.g. NZD) + APP_BASE_URL
 *
 * Required env:
 *   STRIPE_SECRET_KEY=sk_test_...
 *   APP_BASE_URL=https://your-domain.com   (or http://IP:PORT)
 * Optional env:
 *   STRIPE_CURRENCY=NZD
 */

require("dotenv").config();
const Stripe = require("stripe");
const booking = require("../models/bookings");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const APP_BASE_URL = (process.env.APP_BASE_URL || "http://localhost:8737").replace(/\/$/, "");
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || "NZD").toLowerCase(); // Stripe expects lowercase

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing. Stripe calls will fail.");
}
const stripe = Stripe(STRIPE_SECRET_KEY);

/**
 * Build a Checkout Session with inline price_data (best practice for one-off payments).
 */
async function createCheckoutSession({ bookingId, unitAmount, currency, successURL, cancelURL }) {
  return await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    // Clean: no products/prices created in your Stripe dashboard
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: `Booking ${bookingId}`,
            description: "Table Book Request",
          },
        },
        quantity: 1,
      },
    ],

    success_url: successURL,
    cancel_url: cancelURL,

    // Very useful for webhooks / debugging / traceability
    client_reference_id: String(bookingId),
    metadata: { bookingId: String(bookingId) },
  });
}

module.exports = {
  /**
   * Creates a Stripe Checkout Session and stores session id on booking.
   * Returns the session (frontend usually uses session.url to redirect).
   */
  stripePayment: async (data) => {
    try {
      if (!data || !data._id) throw new Error("Missing booking data or booking _id");

      const bookingId = data._id;

      // total may come as string; normalize
      const total = Number(data.total);
      if (!Number.isFinite(total) || total <= 0) throw new Error("Missing/invalid booking total");

      const unitAmount = Math.round(total * 100); // dollars -> cents

      const successURL = `${APP_BASE_URL}/user/payment/success?bookingId=${bookingId}`;
      const cancelURL = `${APP_BASE_URL}/user/payment/cancel`;

      const session = await createCheckoutSession({
        bookingId,
        unitAmount,
        currency: STRIPE_CURRENCY,
        successURL,
        cancelURL,
      });

      // Store session id + initial statuses
      await booking.findByIdAndUpdate(
        bookingId,
        {
          transactionId: session.id,
          transactionStatus: "created",
          paymentStatus: session.payment_status || "unpaid",
        },
        { new: true }
      );

      return session;
    } catch (error) {
      console.log("stripePayment error:", error);
      throw error;
    }
  },

  /**
   * Success page:
   * - Reads bookingId from query
   * - Loads booking + sessionId from DB
   * - Retrieves Checkout Session from Stripe
   * - Updates booking with Stripe status/payment_status
   *
   * NOTE: This is a "legacy" confirmation flow. Webhooks are more robust,
   * but this will still work reliably for your current setup.
   */
  paymentSuccessPage: async (req, res) => {
    try {
      const bookingId = req.query.bookingId;
      if (!bookingId) return res.render("error");

      const bookings = await booking.findById(bookingId);
      if (!bookings || !bookings.transactionId) return res.render("error");

      const sessionData = await stripe.checkout.sessions.retrieve(bookings.transactionId);

      // Update booking with latest Stripe values
      await booking.findByIdAndUpdate(bookingId, {
        transactionId: sessionData.id,
        transactionStatus: sessionData.status || "unknown",
        paymentStatus: sessionData.payment_status || "unpaid",
      });

      // If you later credit wallets, only do it if paid (and ensure idempotency)
      // if (sessionData.payment_status === "paid") { ... }

      return res.render("stripePaymentPages/success", {
        layout: false,
        objdata: bookings, // DB booking (not a global var)
        transactionId: sessionData.id,
      });
    } catch (error) {
      console.log("paymentSuccessPage error:", error);
      return res.render("error");
    }
  },

  paymentCancelPage: async (req, res) => {
    try {
      return res.render("stripePaymentPages/cancel", { layout: false });
    } catch (error) {
      return res.render("error");
    }
  },
};
