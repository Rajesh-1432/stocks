const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel"); // Adjust path as needed
const secret = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ 
        success: false,
        message: "No authorization header provided" 
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Verify token
    const decoded = await jwt.verify(token, secret);

    // Fetch user from database to ensure user still exists
    const user = await userModel.findById(decoded.id || decoded._id).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Attach both userInfo (decoded token) and user (full user object) to request
    req.userInfo = decoded;
    req.user = user; // This is what your controller needs
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ 
      success: false,
      message: "Unauthorized - Invalid token",
      error: error.message 
    });
  }
};

module.exports = auth;