import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d";

export async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateAccessToken(obj) {
  return jwt.sign(obj, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function generateRefreshToken(obj) {
  return jwt.sign(obj, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  if (!token?.startsWith("Bearer ")) {
    return null;
  }

  token = token.split(" ")[1];
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    console.log(err);
    return null;
  }
}

export function isLoggedIn(handler) {
  return async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]; // Typically: 'Bearer <token>'

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied, no token provided" });
    }

    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET); // Use ACCESS_TOKEN_SECRET here
      req.user = decoded; // Attach the decoded token to `req.user`
      return handler(req, res); // Continue to the next handler if authenticated
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}
