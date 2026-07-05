const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

// ==========================
// REGISTER NORMAL MEMBER
// ==========================
const register = async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        if (!full_name || !full_name.trim()) {
            return res.status(400).json({
                message: "Full name is required"
            });
        }

        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({
                message: "A valid email address is required"
            });
        }

        if (!phone || !PHONE_REGEX.test(phone.trim())) {
            return res.status(400).json({
                message: "Mobile number is required and must be exactly 10 digits"
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                message: "Password is required and must be at least 6 characters"
            });
        }

        const userExists = await pool.query(
            "SELECT user_id FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({
                message: "An account already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // role_id 2 = normal user. Only admin should be created manually.
        await pool.query(
            `INSERT INTO users (full_name, email, phone, role_id, password)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                2,
                hashedPassword
            ]
        );

        // ------------------------------------------------------------
        // SMS INTEGRATION POINT (future work):
        // This is where you would call a paid SMS gateway (e.g. Twilio,
        // MSG91, AWS SNS) to send a welcome / OTP verification SMS to
        // `phone`. For now, registration success is communicated only
        // via the in-app toast notification the frontend shows after
        // this request resolves. No SMS provider is called here.
        // ------------------------------------------------------------

        return res.status(201).json({
            message: "Registration successful. Your Defence Cyber Portal account has been created."
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// ==========================
// LOGIN USER
// ==========================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password required"
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid Password"
            });
        }

        let roleName = "user";
        if (user.role_id === 1) roleName = "admin";

        const token = jwt.sign(
            {
                id: user.user_id,
                role: roleName
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.status(200).json({
            message: "Login Successful",
            token,
            role: roleName
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

module.exports = {
    register,
    login
};
