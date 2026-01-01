// helper.js (production-ready)

"use strict";

const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const jwt = require("jsonwebtoken");
const { Validator } = require("node-input-validator");

const user_model = require("../model/Admin/user_model");
const review_model = require("../model/Admin/review_model");
const notification_model = require("../model/Admin/notification_model");

const stripe = require("stripe")(process.env.SECRETKEY);

const SECRET_KEY = process.env.SECRETKEY;
const PUBLISH_KEY = process.env.PUBLISHABLEKEY;
const JWT_SECRET = process.env.jwtSecretKey;

const serverKey = process.env.SERVER_KEY; // FCM legacy key (if still used)

// Firebase Admin (recommended over fcm-node)
const admin = require("firebase-admin");

// ⚠️ In production: don't commit service account json.
// Prefer GOOGLE_APPLICATION_CREDENTIALS env or secret manager.
// Keeping your existing path for now:
let firebaseReady = false;
try {
  if (!admin.apps.length) {
    const serviceAccount = require("./jobbie-25911-firebase-adminsdk-zx2nx-70c5148793.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  firebaseReady = true;
} catch (e) {
  // If firebase isn't configured, push functions can still fail gracefully.
  console.log("Firebase admin init failed (push notifications may not work):", e?.message || e);
}

function ensureDirExists(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safePublicPath(folder, filename) {
  // Always store under ./public/<folder>/<filename>
  const folderSafe = String(folder || "user").replace(/[^a-zA-Z0-9_-]/g, "");
  return {
    folderSafe,
    absDir: path.resolve(process.cwd(), "public", folderSafe),
    absFile: path.resolve(process.cwd(), "public", folderSafe, filename),
    url: `/${folderSafe}/${filename}`,
  };
}

module.exports = {
  // ------------------------------------------------------------
  // Upload (used everywhere)
  // ------------------------------------------------------------
  imageUpload: async (file, folder = "user") => {
    if (!file || !file.name) return null;

    // Basic allow list
    const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedMime.has(file.mimetype)) {
      throw new Error("Only JPG, PNG, WEBP images are allowed");
    }

    // Size limit (match express-fileupload limits)
    const max = 5 * 1024 * 1024; // 5MB
    if (file.size > max) {
      throw new Error("Image too large (max 5MB)");
    }

    const ext = (path.extname(file.name) || "").toLowerCase();
    const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp"]);
    if (!allowedExt.has(ext)) {
      throw new Error("Invalid image extension");
    }

    const filename = `${uuid()}${ext}`;
    const { absDir, absFile, url } = safePublicPath(folder, filename);

    ensureDirExists(absDir);

    // express-fileupload supports promise if callback omitted,
    // but to be safe in all versions we wrap it:
    await new Promise((resolve, reject) => {
      file.mv(absFile, (err) => (err ? reject(err) : resolve()));
    });

    return url;
  },

  // ------------------------------------------------------------
  // Session middleware (admin views)
  // ------------------------------------------------------------
  session: async (req, res, next) => {
    if (req.session?.user) return next();
    return res.redirect("/login_Page");
  },

  // ------------------------------------------------------------
  // Response helpers (used everywhere)
  // ------------------------------------------------------------
  success: (res, message = "", body = {}) => {
    return res.status(200).json({
      success: true,
      code: 200,
      message,
      body,
    });
  },

  failed: (res, message = "") => {
    message =
      typeof message === "object"
        ? message?.message || ""
        : message;

    return res.status(400).json({
      success: false,
      code: 400,
      message,
      body: {},
    });
  },

  failed2: (res, message = "") => {
    message =
      typeof message === "object"
        ? message?.message || ""
        : message;

    return res.status(405).json({
      success: false,
      code: 405,
      message,
      body: {},
    });
  },

  failed403: (res, message = "") => {
    message =
      typeof message === "object"
        ? message?.message || ""
        : message;

    return res.status(403).json({
      success: false,
      code: 403,
      message,
      body: {},
    });
  },

  error: (res, err, req) => {
    console.log(err, "===========================>error");

    const code =
      typeof err === "object" ? (err.code ? err.code : 403) : 403;

    const message =
      typeof err === "object"
        ? (err.message ? err.message : "")
        : String(err || "");

    if (req) {
      req.flash("flashMessage", { color: "error", message });
      const originalUrl = req.originalUrl.split("/")[1];
      return res.redirect(`/${originalUrl}`);
    }

    return res.status(code).json({
      success: false,
      message,
      code,
      body: {},
    });
  },

  error2: (res, err, req) => {
    const code =
      typeof err === "object" ? (err.code ? err.code : 200) : 200;

    const message =
      typeof err === "object"
        ? (err.message ? err.message : "")
        : String(err || "");

    if (req) {
      req.flash("flashMessage", { color: "error", message });
      const originalUrl = req.originalUrl.split("/")[1];
      return res.redirect(`/${originalUrl}`);
    }

    return res.status(code).json({
      success: true,
      message,
      code,
      body: [],
    });
  },

  // ------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------
  unixTimestamp: () => Math.floor(Date.now() / 1000),

  checkValidation: async (v) => {
    let errorsResponse;

    await v.check().then((matched) => {
      if (!matched) {
        const valdErrors = v.errors || {};
        const respErrors = [];

        Object.keys(valdErrors).forEach((key) => {
          if (valdErrors[key]?.message) respErrors.push(valdErrors[key].message);
        });

        errorsResponse = respErrors.join(", ");
      }
    });

    return errorsResponse;
  },

  // ------------------------------------------------------------
  // Header auth (if you still use secret/publish header keys)
  // ------------------------------------------------------------
  authenticateHeader: async function (req, res, next) {
    const v = new Validator(req.headers, {
      secret_key: "required|string",
      publish_key: "required|string",
    });

    const errorsResponse = await module.exports.checkValidation(v);
    if (errorsResponse) return module.exports.failed(res, errorsResponse);

    if (req.headers.secret_key !== SECRET_KEY || req.headers.publish_key !== PUBLISH_KEY) {
      return module.exports.failed(res, "Key not matched!");
    }

    return next();
  },

  // ------------------------------------------------------------
  // JWT auth middleware (protect image upload route with this)
  // ------------------------------------------------------------
  authenticateJWT: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({
          success: false,
          code: 403,
          message: "Token required",
          body: {},
        });
      }

      if (!JWT_SECRET) {
        return res.status(500).json({
          success: false,
          code: 500,
          message: "Server JWT secret not configured",
          body: {},
        });
      }

      const token = authHeader.split(" ")[1];

      jwt.verify(token, JWT_SECRET, async (err, payload) => {
        if (err) {
          return res.status(401).json({
            success: false,
            code: 401,
            message: "invalid token",
            body: {},
          });
        }

        const userId = payload?.data?._id || payload?._id;
        const loginTime = payload?.data?.loginTime || payload?.loginTime;

        if (!userId) {
          return res.status(401).json({
            success: false,
            code: 401,
            message: "Unauthorized token",
            body: {},
          });
        }

        const user = await user_model.findOne({ _id: userId });
        if (!user) {
          return res.status(401).json({
            success: false,
            code: 401,
            message: "Unauthorized token",
            body: {},
          });
        }

        if (user.status === 0) {
          return res.status(403).json({
            success: false,
            code: 403,
            message: "This account is inactive by admin",
            body: {},
          });
        }

        // loginTime check (if you rely on it)
        if (loginTime && String(user.loginTime) !== String(loginTime)) {
          return res.status(401).json({
            success: false,
            code: 401,
            message: "Unauthorized token",
            body: {},
          });
        }

        req.user = user;
        return next();
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        code: 500,
        message: e?.message || "Internal server error",
        body: {},
      });
    }
  },

  // ------------------------------------------------------------
  // Stripe helpers
  // ------------------------------------------------------------
  strieCustomer: async (email) => {
    const customer = await stripe.customers.create({ email });
    return customer ? customer.id : "0";
  },

  stripeToken: async (req) => {
    const token = await stripe.tokens.create({
      card: {
        number: req.body.card_number,
        exp_month: req.body.expire_month,
        exp_year: req.body.expire_year,
      },
    });

    const source = await stripe.customers.createSource(req.user.stripe_customer, {
      source: token.id,
    });

    return source ? source.id : "0";
  },

  // ⚠️ This was in your old helper. Note: Stripe amounts are usually in cents (*100), not *1000.
  stripePayment: async (req) => {
    const charge = await stripe.charges.create({
      amount: req.body.total * 1000, // consider changing to * 100 if total is in dollars
      currency: "usd",
      customer: req.auth.customer_id,
      source: req.body.card_token,
      description: "Gumboot",
    });
    return charge;
  },

  // ------------------------------------------------------------
  // Ratings + notifications
  // ------------------------------------------------------------
  calculateAverageRating: async (spot_id) => {
    const pipeline = [
      { $match: { workerId: spot_id } },
      {
        $group: {
          _id: "$workerId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, averageRating: 1, ratingCount: 1 } },
    ];

    const results = await review_model.aggregate(pipeline);
    return results[0] || { averageRating: 0, ratingCount: 0 };
  },

  notificationData: async (data) => {
    const notificationObj = {
      sender: data.sender,
      receiver: data.receiver,
      message: data.message,
      jobId: data.jobId,
      type: data.type,
      status: 1,
    };
    return await notification_model.create(notificationObj);
  },

  // ------------------------------------------------------------
  // Push notifications (Firebase Admin)
  // ------------------------------------------------------------
  send_push_notifications: async (payLoad) => {
    try {
      if (!firebaseReady) return;
      if (!payLoad?.device_token) return;

      const message = {
        token: payLoad.device_token,
        notification: {
          title: "Gumboot",
          body: String(payLoad.message || ""),
        },
        data: {
          title: "Gumboot",
          body: String(payLoad.message || ""),
          content_available: "true",
          priority: "high",
          notificationType: String(payLoad.type || ""),
          sender_name: String(payLoad.sender_name || ""),
          sender_id: String(payLoad.sender_id || ""),
          receiver_id: String(payLoad.receiver_id || ""),
        },
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.log("push(chat) error:", error?.message || error);
    }
  },

  send_push_notification: async (payLoad) => {
    try {
      if (!firebaseReady) return;
      if (!payLoad?.device_token) return;

      const message = {
        token: payLoad.device_token,
        notification: {
          title: "Gumboot",
          body: String(payLoad.message || ""),
        },
        data: {
          title: "Gumboot",
          body: String(payLoad.message || ""),
          content_available: "true",
          priority: "high",
          jobId: String(payLoad?.save_noti_data?.jobId || ""),
          notificationType: String(payLoad.type || ""),
          sender_name: String(payLoad.sender_name || ""),
          workerId: String(payLoad.workerId || ""),
        },
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.log("push(job) error:", error?.message || error);
    }
  },

  // Alias because your code calls helper.sendPushNotification(...)
  sendPushNotification: async (payLoad) => {
    return module.exports.send_push_notification(payLoad);
  },

  // ------------------------------------------------------------
  // Used in some places (not via grep, but safe to keep)
  // ------------------------------------------------------------
  findUserDeviceToken: async (userid) => {
    try {
      return await user_model.find({ _id: { $in: userid } });
    } catch (e) {
      return [];
    }
  },
};
