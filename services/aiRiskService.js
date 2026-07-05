const analyzeIncident = (title, description) => {
    const text = `${title} ${description}`.toLowerCase();

    let category = "General Cyber Incident";
    let riskScore = 25;
    let severity = "LOW";
    let recommendation =
        "Preserve evidence, avoid sharing personal information, and monitor the incident.";

    if (
        text.includes("otp") ||
        text.includes("bank") ||
        text.includes("upi") ||
        text.includes("fraud") ||
        text.includes("payment")
    ) {
        category = "Financial Fraud / OTP Scam";
        riskScore = 75;
        severity = "HIGH";
        recommendation =
            "Do not share OTP, PIN, CVV, or bank details. Contact your bank immediately and block suspicious transactions.";
    }

    if (
        text.includes("phishing") ||
        text.includes("fake link") ||
        text.includes("suspicious link") ||
        text.includes("login link") ||
        text.includes("credential")
    ) {
        category = "Phishing Attack";
        riskScore = 70;
        severity = "HIGH";
        recommendation =
            "Do not open the link. Change affected passwords, enable MFA, and report the URL for blocking.";
    }

    if (
        text.includes("malware") ||
        text.includes("virus") ||
        text.includes("apk") ||
        text.includes("infected") ||
        text.includes("ransomware")
    ) {
        category = "Malware Infection";
        riskScore = 90;
        severity = "CRITICAL";
        recommendation =
            "Disconnect the device from the internet immediately. Do not delete evidence. Run approved security scans and inform CERT-Army.";
    }

    if (
        text.includes("honeytrap") ||
        text.includes("blackmail") ||
        text.includes("unknown woman") ||
        text.includes("unknown person") ||
        text.includes("social media contact")
    ) {
        category = "Honeytrap / Social Engineering";
        riskScore = 95;
        severity = "CRITICAL";
        recommendation =
            "Stop communication immediately. Preserve screenshots and account details. Escalate through the secure defence cyber reporting channel.";
    }

    if (
        text.includes("army location") ||
        text.includes("unit location") ||
        text.includes("deployment") ||
        text.includes("classified") ||
        text.includes("opsec") ||
        text.includes("military information")
    ) {
        category = "OPSEC / Espionage Indicator";
        riskScore = 100;
        severity = "CRITICAL";
        recommendation =
            "Do not share operational details. Preserve all evidence and immediately escalate to CERT-Army for priority investigation.";
    }

    return {
        category,
        riskScore,
        severity,
        recommendation
    };
};

module.exports = {
    analyzeIncident
};
