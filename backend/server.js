const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("--- Server Bootstrap ---");
console.log("Time:", new Date().toISOString());

const app = express();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const leadRoutes = require("./routes/lead.routes");
const callRoutes = require("./routes/call.routes");
const adminRoutes = require("./routes/admin.routes");

/* ---------- MIDDLEWARE ---------- */
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(",") 
    : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("Origin blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(express.json()); // ✅ REQUIRED for req.body
app.use(express.urlencoded({ extended: true }));

/* ---------- DATABASE ---------- */
connectDB();

/* ---------- ROUTES ---------- */
app.get("/api/test", (req, res) => res.json({ msg: "Server is reachable" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/leads", leadRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/admin", adminRoutes);
// app.use("/api/aiscripts", require("./routes/aiscript.routes"));
app.use("/api/followups", require("./routes/followup.routes"));
app.use("/api/gemini", require("./routes/gemini.routes"));
app.use("/api/communication", require("./routes/communication.routes"));
app.use("/api/scripts", require("./routes/script.routes"));

/* ---------- GLOBAL ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        msg: err.message || "Server Error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

/* ---------- SERVER ---------- */
const PORT = parseInt(process.env.PORT, 10) || 5001;
const HOST = "0.0.0.0";

console.log(`Starting server on ${HOST}:${PORT}...`);
console.log(`Using MONGO_URI: ${process.env.MONGO_URI ? (process.env.MONGO_URI.startsWith("mongodb+srv") ? "Connected to Atlas" : "Connected to Local/Other") : "UNDEFINED"}`);

const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Log the error to a file
    require('fs').appendFileSync('error.log', `Unhandled Rejection: ${err.stack}\n`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`Error: ${err.message}`);
    // Log the error to a file
    require('fs').appendFileSync('error.log', `Uncaught Exception: ${err.stack}\n`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

    