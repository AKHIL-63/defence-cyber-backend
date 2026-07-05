const pool = require("../db/db");

// ===============================
// DASHBOARD SUMMARY
// ===============================
const getDashboard = async (req, res) => {
    try {
        const severityResult = await pool.query(`
            SELECT
                LOWER(COALESCE(severity, 'LOW')) AS severity,
                COUNT(*)::int AS count
            FROM complaints
            GROUP BY LOWER(COALESCE(severity, 'LOW'))
        `);

        const statusResult = await pool.query(`
            SELECT
                COALESCE(status, 'Pending') AS status,
                COUNT(*)::int AS count
            FROM complaints
            GROUP BY COALESCE(status, 'Pending')
        `);

        const severity_breakdown = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        severityResult.rows.forEach((row) => {
            if (severity_breakdown[row.severity] !== undefined) {
                severity_breakdown[row.severity] = row.count;
            }
        });

        const status_breakdown = {};

        statusResult.rows.forEach((row) => {
            status_breakdown[row.status] = row.count;
        });

        return res.status(200).json({
            severity_breakdown,
            status_breakdown
        });
    } catch (err) {
        console.error("DASHBOARD ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
};

// ===============================
// LATEST INCIDENTS WITH AI FIELDS
// ===============================
const getLatestIncidents = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                complaint_id,
                title,
                description,
                category,
                risk_score,
                severity,
                status,
                recommendation,
                created_at
            FROM complaints
            ORDER BY created_at DESC
            LIMIT 20
        `);

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("LATEST INCIDENTS ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
};

// ===============================
// DAILY TRENDS
// ===============================
const getTrends = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                DATE(created_at) AS date,
                COUNT(*)::int AS count
            FROM complaints
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        `);

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("TRENDS ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
};

// ===============================
// USERS
// ===============================
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, email, role
            FROM users
            ORDER BY id DESC
        `);

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET USERS ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const result = await pool.query(
            `UPDATE users
             SET role = $1
             WHERE id = $2
             RETURNING id, name, email, role`,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "User role updated successfully",
            user: result.rows[0]
        });
    } catch (err) {
        console.error("UPDATE USER ROLE ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
};

// ===============================
// UPDATE INCIDENT
// ===============================
const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, severity } = req.body;

        const result = await pool.query(
            `UPDATE complaints
             SET status = COALESCE($1, status),
                 severity = COALESCE($2, severity)
             WHERE complaint_id = $3
             RETURNING *`,
            [status, severity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Incident not found" });
        }

        const io = req.app.get("io");

        if (io) {
            io.emit("status-update", {
                complaint_id: Number(id),
                complaint: result.rows[0]
            });
        }

        return res.status(200).json({
            message: "Incident updated successfully",
            incident: result.rows[0]
        });
    } catch (err) {
        console.error("UPDATE INCIDENT ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getDashboard,
    getLatestIncidents,
    getTrends,
    getAllUsers,
    updateUserRole,
    updateIncident
};
