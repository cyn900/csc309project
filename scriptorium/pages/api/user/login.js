import prisma from "@/utils/db";
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/utils/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide all the required fields",
    });
  }

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

  const accessToken = generateAccessToken({ userId: user.id, useremail: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, useremail: user.email });

  return res.status(200).json({
    accessToken,
    refreshToken
  });
}
