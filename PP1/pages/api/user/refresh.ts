import { NextApiRequest, NextApiResponse } from "next";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/utils/auth";

interface DecodedToken {
  useremail: string;
  userId: string; // Add userId since it's expected by the token functions
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  // Verify the refresh token
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .json({ message: "Authorization header is required." });
  }

  const decoded = verifyRefreshToken(authorization) as DecodedToken | null;

  if (!decoded || !decoded.useremail || !decoded.userId) {
    return res.status(401).json({ message: "Invalid refresh token." });
  }

  try {
    // Generate a new access token
    const newAccessToken = generateAccessToken({
      useremail: decoded.useremail,
      userId: decoded.userId,
    });

    // Optionally, generate a new refresh token
    const newRefreshToken = generateRefreshToken({
      useremail: decoded.useremail,
      userId: decoded.userId,
    });

    // Send the new tokens back to the user
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ message: "Failed to generate tokens." });
  }
};

export default handler;
