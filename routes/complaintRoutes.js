const express = require("express");
const router = express.Router();

const {
    createComplaint,
    getAllComplaints,
    getMyComplaints,
    adminUpdateComplaint
} = require("../controllers/complaintController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Registered member: submit a report
router.post("/", verifyToken, createComplaint);

// Registered member: see only their own reports
router.get("/my", verifyToken, getMyComplaints);

// Admin: see all reports
router.get("/", verifyToken, isAdmin, getAllComplaints);

// Admin: update incident status or severity
router.patch("/:id", verifyToken, isAdmin, adminUpdateComplaint);

module.exports = router;
