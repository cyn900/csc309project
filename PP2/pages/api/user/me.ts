import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

interface UserClaims {
  useremail: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No authorization token provided" });
  }

  try {
    const userClaims = verifyToken(authHeader) as UserClaims | null;
    
    if (!userClaims?.useremail) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await prisma.user.findUnique({
      where: { 
        email: userClaims.useremail 
      },
      select: {
        uID: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ 
      user: {
        ...user,
        uID: Number(user.uID)
      }
    });
  } catch (error) {
    console.error("Error in /api/user/me:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
} 