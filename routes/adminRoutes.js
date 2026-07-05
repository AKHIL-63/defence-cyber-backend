const express = require("express");
const router = express.Router();

const {
    getDashboard,
    getLatestIncidents,
    getTrends,
    getAllUsers,
    updateUserRole,
    updateIncident
} = require("../controllers/adminController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ==========================
// DASHBOARD ROUTES
// ==========================
router.get("/dashboard", verifyToken, isAdmin, getDashboard);
router.get("/latest", verifyToken, isAdmin, getLatestIncidents);
router.get("/trends", verifyToken, isAdmin, getTrends);

// ==========================
// USER MANAGEMENT ROUTES
// ==========================
router.get("/users", verifyToken, isAdmin, getAllUsers);
router.patch("/user/:id", verifyToken, isAdmin, updateUserRole);

// ==========================
// INCIDENT MANAGEMENT ROUTES
// ==========================
router.patch("/incident/:id", verifyToken, isAdmin, updateIncident);

module.exports = router;
