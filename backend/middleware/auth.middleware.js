const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    let token;
    
    console.log("DEBUG: Auth Middleware - Headers:", JSON.stringify(req.headers));

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
        console.log("DEBUG: Token found in Authorization header");
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log("DEBUG: Token found in cookies");
    }

    if (!token) {
        console.log("DEBUG: No token found in request");
        return res.status(401).json({ msg: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token Payload:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Failed:", error.message);
        res.status(401).json({ msg: "Invalid Token" });
    }
};
