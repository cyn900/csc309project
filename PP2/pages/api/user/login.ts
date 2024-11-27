import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from "@/utils/auth";

interface LoginRequestBody {
  email: string;
  password: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body as LoginRequestBody;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide all the required fields",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken({
      userId: user.uID,
      useremail: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.uID,
      useremail: user.email,
    });

    return res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error("Error during login:", error);
    return res.status(500).json({
      message: "Internal server error during login",
    });
  }
}
