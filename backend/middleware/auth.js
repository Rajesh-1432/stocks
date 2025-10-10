const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const auth = async (req, res, next) => {
  // console.log('auth middleware')
  const { authorization } = req.headers;
  if (authorization) {
    const token = authorization.split(" ")[1];
    if (token) {
      try {
        const userInfo = await jwt.verify(token, secret);
        req.userInfo = userInfo;
        next();
      } catch (error) {
        console.log(error.message);
        return res.status(401).json({ message: "unauthorized" });
      }
    } else {
      console.log(error.message);
      return res.status(401).json({ message: "unauthorized" });
    }
  } else {
    return res.status(401).json({ message: "unauthorized" });
  }
};
module.exports = auth;
