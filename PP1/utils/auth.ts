import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

// Environment variables
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d";

// Interfaces
interface TokenPayload {
  userId: string | number;
  useremail: string;
  [key: string]: any; // To accommodate additional properties
}

// Utility Functions

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

// Compare a password with a hash
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate an access token
export function generateAccessToken(obj: TokenPayload): string {
  return jwt.sign(obj, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

// Generate a refresh token
export function generateRefreshToken(obj: TokenPayload): string {
  return jwt.sign(obj, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

// Verify an access token
export function verifyToken(token: string): TokenPayload | null {
  if (!token?.startsWith("Bearer ")) {
    return null;
  }

  token = token.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    return decoded;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

// Verify a refresh token
export function verifyRefreshToken(token: string): TokenPayload | null {
  if (!token?.startsWith("Bearer ")) {
    return null;
  }

  token = token.split(" ")[1];
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    return decoded;
  } catch (err) {
    console.error("Refresh token verification failed:", err);
    return null;
  }
}

// Middleware to check if a user is logged in
export function isLoggedIn(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not logged in: No token provided" });
    }

    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
      (req as any).user = decoded; // Attach the decoded token to `req.user`
      return handler(req, res); // Continue to the next handler if authenticated
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ message: "Not logged in: Invalid token" });
    }
  };
}
