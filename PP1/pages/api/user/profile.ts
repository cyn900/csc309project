import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/auth";
import prisma from "@/utils/db";
import multer from "multer";
import { Request } from "express";

export const config = {
  api: {
    bodyParser: false, // Required for multer and manual JSON handling
  },
};

interface UserClaims {
  useremail: string;
}

interface ParsedRequest extends NextApiRequest {
  file?: Express.Multer.File; // Use Express.Multer.File for single file upload
}

// Middleware runner for Multer
export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/"); // Directory for uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Use a unique filename
  },
});

const upload = multer({ storage });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Authenticate user
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  const userClaims = verifyToken(token) as UserClaims | null;
  if (!userClaims) {
    return res
      .status(401)
      .json({ message: "Invalid or missing authorization token" });
  }

  if (req.method === "GET") {
    // Handle retrieving user information
    try {
      const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res
        .status(200)
        .json({ message: "User profile retrieved successfully", user });
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      return res
        .status(500)
        .json({ error: "Internal server error during profile retrieval." });
    }
  } else if (req.method === "PATCH") {
    // Handle updates to user profile
    await handlePatchRequest(req, res, userClaims);
  } else {
    return res.status(405).end("Method Not Allowed");
  }
};

async function handlePatchRequest(
  req: ParsedRequest,
  res: NextApiResponse,
  userClaims: UserClaims
) {
  const contentType = req.headers["content-type"];
  if (contentType && contentType.includes("multipart/form-data")) {
    // Run the Multer middleware using runMiddleware
    try {
      await runMiddleware(req, res, upload.single("avatar"));
      await processPatchRequest(req, res, userClaims);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    // Manually parse JSON body for other content types
    let data = "";
    req.on("data", (chunk) => {
      data += chunk.toString();
    });
    req.on("end", () => {
      try {
        req.body = JSON.parse(data);
        processPatchRequest(req, res, userClaims);
      } catch (err) {
        return res.status(400).json({ message: "Invalid JSON data" });
      }
    });
  }
}

async function processPatchRequest(
  req: ParsedRequest,
  res: NextApiResponse,
  userClaims: UserClaims
) {
  const { firstName, lastName, phoneNum } = req.body as {
    firstName?: string;
    lastName?: string;
    phoneNum?: string;
  };
  const updateData: Record<string, any> = {};

  // Validate firstName and lastName as strings
  if (firstName !== undefined) {
    if (typeof firstName !== "string" || firstName.trim() === "") {
      return res
        .status(400)
        .json({ message: "firstName must be a non-empty string." });
    }
    updateData.firstName = firstName.trim();
  }

  if (lastName !== undefined) {
    if (typeof lastName !== "string" || lastName.trim() === "") {
      return res
        .status(400)
        .json({ message: "lastName must be a non-empty string." });
    }
    updateData.lastName = lastName.trim();
  }

  // Updated phoneNum validation
  if (phoneNum !== undefined && phoneNum !== '') {
    const phoneNumAsNumber = Number(phoneNum);
    if (isNaN(phoneNumAsNumber)) {
      return res.status(400).json({ message: "phoneNum must be a valid number." });
    }
    updateData.phoneNum = phoneNumAsNumber;
  }

  if (req.file) {
    updateData.avatar = req.file.path.replace(/^public\//, '/');
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: userClaims.useremail },
      data: updateData,
    });

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ error: "Internal server error during profile update." });
  }
}

export default handler;
