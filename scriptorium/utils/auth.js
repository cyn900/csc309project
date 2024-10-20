// utils/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN;

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
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
