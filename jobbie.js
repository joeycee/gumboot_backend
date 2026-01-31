require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const mongoose = require("mongoose");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

// -------------------------
// Import routers
// -------------------------
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const apiRouter = require("./routes/api");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

// -------------------------
// env + safety checks
// -------------------------
const PORT = process.env.PORT || 4011;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

if (!MONGO_URI) {
  console.warn("⚠️ MONGO_URI missing in .env (mongoose connect will fail)");
}
if (!process.env.SESSION_SECRET) {
  console.warn("⚠️ SESSION_SECRET missing in .env (using fallback dev secret)");
}

// If behind nginx / load balancer in prod
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// -------------------------
// view engine setup
// -------------------------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// -------------------------
// middleware (MUST COME BEFORE ROUTES!)
// -------------------------
app.use(logger("dev"));
app.use(cors({
  origin: function (origin, cb) {
    // allow server-to-server / curl / Postman (no origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

app.use(
  fileupload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    abortOnLimit: true,
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true,
  })
);

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// -------------------------
// sessions + flash (must be in this order)
// -------------------------
app.use(
  session({
    name: "sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(flash());

// Optional: makes flash available in EJS without repeating code everywhere
app.use((req, res, next) => {
  res.locals.flash = req.flash();
  next();
});

// -------------------------
// mongo
// -------------------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("db connected"))
  .catch((err) => console.error("Mongo connection error:", err));

// -------------------------
// routes (AFTER all middleware!)
// -------------------------
// Optional: root endpoint
app.get("/", (req, res) => res.send("OK"));

// Admin panel (EJS)
app.use("/admin", indexRouter);

// Users routes
app.use("/users", usersRouter);

// API (JSON)
app.use("/api", apiRouter);

// -------------------------
// 404 handler (Option A)
// - /api/* returns JSON 404
// - non-api falls through to normal error handling
// -------------------------
app.use((req, res, next) => {
  const isApi = req.originalUrl.startsWith("/api");
  if (isApi) {
    return res.status(404).json({
      success: false,
      code: 404,
      message: "Not Found",
      path: req.originalUrl,
    });
  }
  next(createError(404));
});

// CDN Digital ocean

app.use("/api", require("./routes/upload"));


// -------------------------
// error handler (Option A)
// - /api/* always returns JSON (never tries to render views/error.ejs)
// - non-api can render EJS (if you have views/error.ejs), otherwise falls back
// -------------------------
app.use((err, req, res, next) => {
  // Only log actual errors (500s), not 404s
  if (err.status !== 404) {
    console.error(err);
  }

  const status = err.status || 500;
  const isApi = req.originalUrl.startsWith("/api");

  if (isApi) {
    return res.status(status).json({
      success: false,
      code: status,
      message: err.message || "Server error",
      path: req.originalUrl,
      // include stack only in dev
      ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
    });
  }

  // Non-API: try render error.ejs, otherwise fallback to plain text
  try {
    return res.status(status).render("error", {
      message: err.message,
      error: process.env.NODE_ENV === "production" ? {} : err,
    });
  } catch (e) {
    return res.status(status).send(err.message || "Server error");
  }
});

// -------------------------
// sockets
// -------------------------
require("./socket/socket")(io);

// -------------------------
// start
// -------------------------
http.listen(PORT, () => {
  console.log(`server listening on ${PORT}`);
});

module.exports = app;