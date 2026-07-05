const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

// ==========================
// CORS SETUP
// ==========================
// FRONTEND_URL must be set as an environment variable on Render once the
// frontend is deployed (see deployment instructions). Locally, if
// FRONTEND_URL is not set, it falls back to the local Vite dev server URL
// so development keeps working without any extra setup.
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const corsOptions = {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"]
};

app.use(cors(corsOptions));
app.use(express.json());

// ==========================
// HEALTH CHECK ROUTE
// ==========================
// Render uses this (and you can use it yourself) to confirm the backend
// is live. Visiting the backend's public URL in a browser should show
// this JSON.
app.get("/", (req, res) => {
    res.json({
        message: "SOC Cyber Defense Backend is running successfully",
        status: "OK"
    });
});

// ==========================
// ROUTES
// ==========================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/complaint", require("./routes/complaintRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ==========================
// CREATE HTTP SERVER
// ==========================
const server = http.createServer(app);

// ==========================
// SOCKET.IO SETUP
// ==========================
const io = new Server(server, {
    cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"]
    }
});

app.set("io", io);

// SOCKET CONNECTION
io.on("connection", (socket) => {
    console.log("⚡ Client Connected:", socket.id);

    // A logged-in client tells us their user id right after connecting
    // (see AuthContext.jsx). We put them in a private room so we can
    // later send a notification to this one member only, instead of
    // broadcasting it to every connected client.
    socket.on("join", (userId) => {
        if (!userId) return;

        socket.join(`user-${userId}`);
        console.log(`Socket ${socket.id} joined room user-${userId}`);
    });

    socket.on("disconnect", () => {
        console.log("❌ Client Disconnected");
    });
});

// ==========================
// SERVER START
// ==========================
// Render assigns the port dynamically via process.env.PORT. Locally,
// if PORT is not set, it falls back to 3000.
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 SOC Real-Time Server running on port ${PORT}`);
    console.log(`Allowed frontend origin: ${allowedOrigin}`);
});
