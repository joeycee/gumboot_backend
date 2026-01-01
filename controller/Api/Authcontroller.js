/**
 * controller/Api/Authcontroller.js
 *
 * ✅ Secrets removed (Twilio via env vars)
 * ✅ Uses ONE Twilio Verify Service (do NOT create services per request)
 * ✅ OTP verify does NOT trust client-provided serviceSid
 * ✅ Keeps your existing “guest job/address -> attach on signup/login” behaviour
 * ✅ Returns same-ish response shapes as your original code
 */

const user_model = require("../../model/Admin/user_model");
const helper = require("../../Helper/helper");
const bcrypt = require("bcrypt"); // (not used here but kept to avoid breaking other refs)
const { Validator } = require("node-input-validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // (not used here but kept)
const bankmodel = require("../../model/Admin/bankmodel");
const cardmodel = require("../../model/Admin/cardmodel");
const address_model = require("../../model/Admin/address_model");
const job_model = require("../../model/Admin/job_model");

const twilio = require("twilio");

const secretCryptoKey = process.env.jwtSecretKey;

// ---- Twilio env vars (REQUIRED in prod) ----
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID; // VA...

let client = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
  console.warn(
    "⚠️ Twilio env vars missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN). OTP features will fail."
  );
}

if (!TWILIO_VERIFY_SERVICE_SID) {
  console.warn(
    "⚠️ TWILIO_VERIFY_SERVICE_SID missing. OTP features will fail."
  );
}

// -------------------------
// helpers
// -------------------------
function phoneE164(country_code, phone) {
  return `${country_code}${phone}`;
}

async function attachGuestRecordsToUser({ userId, addressId, jobId }) {
  // Attach guest address if provided
  if (addressId) {
    await address_model.findByIdAndUpdate(
      { _id: addressId },
      { userId: userId, guest_user: 0 }
    );
  }

  // Attach guest job if provided
  if (jobId) {
    await job_model.findByIdAndUpdate(
      { _id: jobId },
      { userId: userId, guest_user: 0 }
    );
  }
}

async function sendTwilioOtp(toPhone) {
  if (!client) throw new Error("Twilio client not configured");
  if (!TWILIO_VERIFY_SERVICE_SID)
    throw new Error("TWILIO_VERIFY_SERVICE_SID not configured");

  // Send verification SMS
  return await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: toPhone, channel: "sms" });
}

async function checkTwilioOtp(toPhone, code) {
  if (!client) throw new Error("Twilio client not configured");
  if (!TWILIO_VERIFY_SERVICE_SID)
    throw new Error("TWILIO_VERIFY_SERVICE_SID not configured");

  return await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: toPhone, code });
}

// -------------------------
// controller
// -------------------------
module.exports = {
  signup: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        firstname: "required",
        lastname: "required",
        email: "required",
        phone: "required",
        country_code: "required",
      });

      const values = JSON.parse(JSON.stringify(v));
      const errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) return helper.failed(res, errorsResponse);

      // Delete unverified duplicates (kept from original)
      const unverifiedEmail = await user_model.findOne({
        email: req.body.email,
        verified_user: 0,
      });
      if (unverifiedEmail) await user_model.deleteOne({ _id: unverifiedEmail._id });

      const unverifiedPhone = await user_model.findOne({
        phone: req.body.phone,
        verified_user: 0,
      });
      if (unverifiedPhone) await user_model.deleteOne({ _id: unverifiedPhone._id });

      // Hard block if already exists (verified or not)
      const isemailExist = await user_model.findOne({ email: req.body.email });
      if (isemailExist) return helper.failed(res, "Email already exists");

      const ismobileExist = await user_model.findOne({ phone: req.body.phone });
      if (ismobileExist) return helper.failed(res, "Mobile number already exist");

      // Optional image upload
      if (req.files && req.files.image) {
        const image = req.files.image;
        if (image) values.inputs.image = helper.imageUpload(image, "images");
      }

      const time = helper.unixTimestamp();
      values.inputs.loginTime = time;

      const Phone_Number = phoneE164(req.body.country_code, req.body.phone);

      // Validate phone number with Twilio Lookup (kept)
      try {
        if (!client) throw new Error("Twilio not configured");
        await client.lookups.v1.phoneNumbers(Phone_Number).fetch();
      } catch (err) {
        return helper.failed(res, "Invalid phone number / country code");
      }

      // ✅ Send OTP via your SINGLE Verify Service
      await sendTwilioOtp(Phone_Number);

      // Store the verify service SID in user record (your old code compares this later)
      values.inputs.otp = TWILIO_VERIFY_SERVICE_SID;

      // Location defaults
      if (req.body.longitude && req.body.latitude) {
        values.inputs.location = {
          type: "Point",
          coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
        };
        values.inputs.latitude = Number(req.body.latitude);
        values.inputs.longitude = Number(req.body.longitude);
      } else {
        values.inputs.location = { type: "Point", coordinates: [0, 0] };
        values.inputs.latitude = 0;
        values.inputs.longitude = 0;
      }

      // Stripe customer (kept)
      const stripeCustmor = await helper.strieCustomer(req.body.email);
      values.inputs.stripe_customer = stripeCustmor;

      // Create user
      const dataEnter = await user_model.create({
        ...values.inputs,
      });

      const userId = dataEnter._id;

      // Attach guest address/job if present (kept)
      await attachGuestRecordsToUser({
        userId,
        addressId: req.body.addressId,
        jobId: req.body.jobId,
      });

      // Return user info (keep original behaviour)
      let userInfo = await user_model.findOne({ _id: userId }).lean();
      if (userInfo) {
        delete userInfo.password;
        return helper.success(res, "Signup Successfully", userInfo);
      }

      return helper.failed(res, "Something went wrong");
    } catch (error) {
      console.log(error);
      return helper.error(res, "error");
    }
  },

  Login: async (req, res) => {
    try {
      const isUserExist = await user_model.findOne({
        phone: req.body.phone,
        country_code: req.body.country_code,
        verified_user: 1,
      });

      if (!isUserExist) {
        return helper.failed(res, "Invalid phone number / country code");
      }

      if (isUserExist.status == 0) {
        return helper.failed2(
          res,
          "This account is inactive, please wait for admin approval"
        );
      }

      const time = helper.unixTimestamp();
      const PhoneNumber = phoneE164(req.body.country_code, req.body.phone);

      // ✅ Send OTP using SINGLE service (no create() calls)
      await sendTwilioOtp(PhoneNumber);

      // Update otp field with service SID (matching otpVerify compare)
      const update_otp = await user_model.findOneAndUpdate(
        { phone: req.body.phone, country_code: req.body.country_code },
        {
          otp: TWILIO_VERIFY_SERVICE_SID,
          device_type: req.body.device_type,
          device_token: req.body.device_token,
          loginTime: time,
        },
        { new: true }
      );

      if (!update_otp) return helper.failed(res, "Account not found");

      let finadata = await user_model.findById(update_otp._id).lean();
      const userCard = await cardmodel.findOne({ userId: finadata._id });

      const token = jwt.sign(
        {
          data: {
            _id: finadata._id,
            phone: finadata.phone,
            loginTime: time,
          },
        },
        secretCryptoKey,
        { expiresIn: "365d" }
      );

      finadata.token = token;
      finadata.is_card = userCard ? 1 : 0;

      // Attach guest address/job if present (kept)
      await attachGuestRecordsToUser({
        userId: finadata._id,
        addressId: req.body.addressId,
        jobId: req.body.jobId,
      });

      return helper.success(res, "OTP sent successfully", finadata);
    } catch (error) {
      console.log(error);
      return helper.failed(res, error.message || error);
    }
  },

  resend_otp: async (req, res) => {
    try {
      const findphone = await user_model.findOne({
        phone: req.body.phone,
        country_code: req.body.country_code,
      });

      if (!findphone) {
        return helper.failed(res, "Invalid phone number or country code");
      }

      const PhoneNumber = phoneE164(req.body.country_code, req.body.phone);

      // ✅ Send OTP using SINGLE service
      await sendTwilioOtp(PhoneNumber);

      const update_otp = await user_model.findOneAndUpdate(
        { phone: req.body.phone, country_code: req.body.country_code },
        { otp: TWILIO_VERIFY_SERVICE_SID },
        { new: true }
      );

      if (update_otp) {
        // your old API returned { otp: <serviceSid> } (we keep it)
        return helper.success(res, "Resend OTP successfully", {
          otp: TWILIO_VERIFY_SERVICE_SID,
        });
      }

      return helper.failed(res, "something went wrong");
    } catch (error) {
      console.log(error);
      return helper.failed(res, error.message || error);
    }
  },

  otpVerify: async (req, res) => {
    try {
      // ✅ Do NOT accept serviceSid from client (untrusted)
      const v = new Validator(req.body, {
        otp: "required",
        phone: "required",
        country_code: "required",
      });

      const errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) return helper.failed(res, errorsResponse);

      const time = helper.unixTimestamp();
      const toPhone = phoneE164(req.body.country_code, req.body.phone);

      // ✅ Verify OTP against the SINGLE service SID
      const checkOtp = await checkTwilioOtp(toPhone, req.body.otp);

      if (!checkOtp.valid) {
        return helper.failed(res, "OTP is invalid or expired");
      }

      const isEmailExist = await user_model.findOne({
        phone: req.body.phone,
        country_code: req.body.country_code,
      });

      if (!isEmailExist) {
        return helper.failed(res, "User does not exist", {});
      }

      // Optional: match service SID stored in DB (keeps original intent)
      // If DB has empty otp (some edge cases), allow proceed when Twilio says valid.
      if (isEmailExist.otp && isEmailExist.otp !== TWILIO_VERIFY_SERVICE_SID) {
        return helper.failed(res, "OTP doesn't match");
      }

      await user_model.updateOne(
        { _id: isEmailExist._id },
        { otpverify: 1, otp: "", loginTime: time, verified_user: 1 }
      );

      let userDetail = await user_model
        .findOne({ _id: isEmailExist._id })
        .populate("skill")
        .populate("tools")
        .lean();

      const findCard = await cardmodel.findOne({
        userId: userDetail._id,
        deleted: false,
      });

      const token = jwt.sign(
        {
          data: {
            _id: userDetail._id,
            email: userDetail.email,
            loginTime: time,
          },
        },
        secretCryptoKey,
        { expiresIn: "365d" }
      );

      userDetail.token = token;
      userDetail.is_card = findCard ? 1 : 0;

      const account = await bankmodel.count({ workerId: userDetail._id });

      return helper.success(res, "OTP verified successfully", {
        userDetail,
        account,
      });
    } catch (error) {
      console.log("Error during OTP verification:", error);
      return helper.failed(res, error.message || error);
    }
  },

  socialLogin: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        social_id: "required",
        role: "required",
        socialtype: "required", // 1 Google, 2 Facebook, 3 Apple
        device_type: "required",
        device_token: "required",
      });

      const errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) return helper.failed(res, errorsResponse);

      let condition = {};
      if (req.body.socialtype == 1) condition.google = req.body.social_id;
      if (req.body.socialtype == 2) condition.facebook = req.body.social_id;
      if (req.body.socialtype == 3) condition.apple = req.body.social_id;

      condition.socialtype = req.body.socialtype;
      condition.role = req.body.role;

      const currentTime = helper.unixTimestamp();

      const check_social_id = await user_model.findOne(condition);
      const check_email = req.body.email
        ? await user_model.findOne({ email: req.body.email })
        : null;

      const existing = check_social_id || check_email;

      if (existing) {
        const userId = existing._id;

        await user_model.findOneAndUpdate(
          { _id: userId },
          {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            image: req.body.image,
            device_token: req.body.device_token,
            device_type: req.body.device_type,
            loginTime: currentTime,
          },
          { new: true }
        );

        const get_user_data = await user_model.findById(userId);

        const token = jwt.sign(
          { data: { _id: get_user_data._id, loginTime: get_user_data.loginTime } },
          secretCryptoKey,
          { expiresIn: "365d" }
        );

        const userResponse = { ...get_user_data.toObject(), token };
        delete userResponse.password;

        if (req.body.role == 2) {
          const account = await bankmodel.count({ workerId: get_user_data._id });
          return helper.success(res, "Social Login successfully", {
            get_user_data: userResponse,
            account,
          });
        }

        return helper.success(res, "Social Login successfully", userResponse);
      }

      // Create new user
      const save_data = await user_model.create({
        firstname: req.body.firstname || "",
        lastname: req.body.lastname || "",
        email: req.body.email || "",
        phone: req.body.phone || "",
        image: req.body.image || "",
        otp: "", // no OTP for social login
        otpverify: 1,
        verified_user: 1,
        loginTime: currentTime,
        type: req.body.type,
        device_type: req.body.device_type || "",
        device_token: req.body.device_token || "",
        bio: req.body.bio || "",
        country_code: req.body.country_code || "",
        ...condition,
      });

      const get_user_data = await user_model.findById(save_data._id);

      const token = jwt.sign(
        { data: { _id: get_user_data._id, loginTime: get_user_data.loginTime } },
        secretCryptoKey,
        { expiresIn: "365d" }
      );

      const userResponse = { ...get_user_data.toObject(), token };
      delete userResponse.password;

      if (req.body.role == 2) {
        const account = await bankmodel.count({ workerId: get_user_data._id });
        return helper.success(res, "Social Login successfully", {
          get_user_data: userResponse,
          account,
        });
      }

      return helper.success(res, "Social Login successfully", userResponse);
    } catch (error) {
      console.error("Social login error:", error);
      return helper.failed(res, error.message || error);
    }
  },

  logOut: async (req, res) => {
    try {
      await user_model.updateOne(
        { _id: req.user._id },
        { loginTime: "0", device_token: "" }
      );
      return helper.success(res, "Logout successfully");
    } catch (error) {
      console.log(error);
      return helper.error(res, error.message || error);
    }
  },

  deletedAccount: async (req, res) => {
    try {
      const user = await user_model.findById(req.user._id);
      if (!user) return helper.failed(res, "Account not found");

      const deletedUser = await user_model.findByIdAndDelete(req.user._id);
      if (deletedUser) return helper.success(res, "Account deleted successfully");

      return helper.failed(res, "Something went wrong while deleting the account");
    } catch (error) {
      console.error("Error deleting account:", error);
      return helper.failed(res, error.message || error);
    }
  },
};
