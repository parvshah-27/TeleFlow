const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}
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
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
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
let PORT = process.env.PORT || 5001;
console.log(`Initial target port: ${PORT}...`);
console.log(`Using MONGO_URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + "..." : "UNDEFINED"}`);

let server;

function startServer(portToTry) {
    server = app.listen(portToTry, () => {
        const actualPort = server.address().port;
        console.log(`🚀 Server running on port ${actualPort}`);
        // Write actual port to a file for frontend to discover
        try {
            const fs = require('fs');
            const portFilePath = path.join(__dirname, '..', 'backend_port.txt');
            fs.writeFileSync(portFilePath, actualPort.toString());
            console.log(`Port saved to ${portFilePath}`);
        } catch (err) {
            console.warn(`Could not save port to file: ${err.message}`);
        }
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.log(`Port ${portToTry} is already in use, trying port ${parseInt(portToTry) + 1}...`);
            startServer(parseInt(portToTry) + 1);
        } else {
            console.error(`Server failed to start: ${err.message}`);
        }
    });
}

startServer(PORT);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Log the error to a file
    require('fs').appendFileSync('error.log', `Unhandled Rejection: ${err.stack}\n`);
    // Close server & exit process
    if (server) server.close(() => process.exit(1));
    else process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`Error: ${err.message}`);
    // Log the error to a file
    require('fs').appendFileSync('error.log', `Uncaught Exception: ${err.stack}\n`);
    // Close server & exit process
    if (server) server.close(() => process.exit(1));
    else process.exit(1);
});

