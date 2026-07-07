const pool = require("../db/db");
const { analyzeIncident } = require("../services/aiRiskService");

// ===============================
// CREATE COMPLAINT + AI ANALYSIS
// ===============================
const createComplaint = async (req, res) => {
    try {
        const { title, description, screenshot } = req.body;
        const user_id = req.user.id;

        if (!title || !description) {
            return res.status(400).json({
                message: "Title and description are required"
            });
        }

        // Basic safety check: only accept something that actually looks
        // like an image data URL, and keep a sane size ceiling even
        // though express.json's 6mb limit already protects the server.
        let safeScreenshot = null;

        if (screenshot) {
            const looksLikeImage = /^data:image\/(png|jpeg|jpg|webp);base64,/.test(screenshot);

            if (looksLikeImage && screenshot.length < 6 * 1024 * 1024) {
                safeScreenshot = screenshot;
            }
        }

        const analysis = analyzeIncident(title, description);

        const result = await pool.query(
            `INSERT INTO complaints (
                user_id,
                title,
                description,
                category,
                priority,
                severity,
                risk_score,
                recommendation,
                status,
                screenshot,
                incident_date,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *`,
            [
                user_id,
                title,
                description,
                analysis.category,
                analysis.severity,
                analysis.severity,
                analysis.riskScore,
                analysis.recommendation,
                "Pending",
                safeScreenshot
            ]
        );

        const complaint = result.rows[0];
        const io = req.app.get("io");

        if (io) {
            // Admin dashboard refresh
            io.emit("new-complaint", complaint);

            // Member receives AI safety notification
            io.emit("member-notification", {
                type: "new-incident",
                user_id: user_id,
                complaint_id: complaint.complaint_id,
                title: complaint.title,
                message: "Your incident has been analyzed by the AI risk engine.",
                category: complaint.category,
                severity: complaint.severity,
                risk_score: complaint.risk_score,
                recommendation: complaint.recommendation
            });
        }

        return res.status(201).json({
            message: "Complaint submitted and AI risk analysis completed",
            complaint: complaint
        });
    } catch (err) {
        console.error("CREATE COMPLAINT ERROR:", err);

        return res.status(500).json({
            message: err.message
        });
    }
};

// ===============================
// MEMBER: GET ONLY MY COMPLAINTS
// ===============================
const getMyComplaints = async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(
            `SELECT *
             FROM complaints
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [user_id]
        );

        return res.status(200).json({
            incidents: result.rows
        });
    } catch (err) {
        console.error("GET MY COMPLAINTS ERROR:", err);

        return res.status(500).json({
            message: err.message
        });
    }
};

// ===============================
// ADMIN: GET ALL COMPLAINTS
// ===============================
const getAllComplaints = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM complaints ORDER BY created_at DESC"
        );

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET COMPLAINTS ERROR:", err);

        return res.status(500).json({
            message: err.message
        });
    }
};

// ===============================
// ADMIN: UPDATE STATUS / SEVERITY
// ===============================
const ALLOWED_STATUSES = ["Pending", "In Review", "Resolved", "Closed"];

const adminUpdateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, severity } = req.body;

        if (status && !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                message:
                    "Invalid status. Allowed values: Pending, In Review, Resolved, Closed"
            });
        }

        const result = await pool.query(
            `UPDATE complaints
             SET status = COALESCE($1, status),
                 severity = COALESCE($2, severity)
             WHERE complaint_id = $3
             RETURNING *`,
            [status, severity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        const complaint = result.rows[0];
        const io = req.app.get("io");

        if (io) {
            // Admin-side dashboards refresh their tables. This stays a
            // broadcast since any admin viewing the dashboard should see
            // the update, not just one person.
            io.emit("status-update", {
                complaint_id: Number(id),
                status: complaint.status,
                severity: complaint.severity,
                complaint: complaint
            });

            // Member-side notification goes ONLY to the private room of
            // the member who submitted this incident (joined in
            // AuthContext.jsx via the "join" socket event), not to
            // everyone connected.
            io.to(`user-${complaint.user_id}`).emit("member-notification", {
                type: "status-change",
                user_id: complaint.user_id,
                complaint_id: complaint.complaint_id,
                title: complaint.title,
                message: `Your incident ${complaint.title} status changed to ${complaint.status}.`,
                category: complaint.category,
                severity: complaint.severity,
                risk_score: complaint.risk_score,
                recommendation: complaint.recommendation
            });
        }

        return res.status(200).json({
            message: "Complaint updated successfully",
            complaint: complaint
        });
    } catch (err) {
        console.error("UPDATE COMPLAINT ERROR:", err);

        return res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    adminUpdateComplaint
};
