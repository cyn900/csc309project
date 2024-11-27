import { NextApiRequest, NextApiResponse } from "next";
import { hashPassword } from "@/utils/auth";
import prisma from "@/utils/db";
import upload from "@/utils/upload"; // Import the multer middleware

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser to use multer
  },
};

// Define the expected request body type
interface RequestBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNum?: string | number; // Accept both string and number inputs
  role?: string;
}

interface MulterRequest extends NextApiRequest {
  body: any;
  file?: Express.Multer.File; // Add multer file support to the request
}

export default async function handler(
  req: MulterRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.headers["content-type"]?.includes("application/json")) {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk.toString(); // Convert Buffer to string
    });
    req.on("end", () => {
      try {
        req.body = JSON.parse(data) as RequestBody; // Parse the string to JSON
        postHandler(req, res); // Process the request after parsing the JSON
      } catch (error) {
        res.status(400).json({ message: "Invalid JSON body." });
      }
    });
  } else {
    // Use multer for 'multipart/form-data'
    upload(req as any, res as any, (err: any) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      postHandler(req, res); // Process the request after handling the file upload
    });
  }
}

async function postHandler(
  req: MulterRequest,
  res: NextApiResponse
): Promise<void> {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNum,
    role = "user",
  } = req.body as RequestBody;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Set the avatar URL based on the uploaded file or default
    const avatarUrl = req.file
      ? `${req.file.path}`
      : "avatar/default.jpg";

    // Convert phoneNum to a number, or use undefined if not provided
    const parsedPhoneNum = phoneNum
      ? typeof phoneNum === "string"
        ? parseInt(phoneNum, 10)
        : phoneNum
      : undefined;

    if (parsedPhoneNum !== undefined && isNaN(parsedPhoneNum)) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    // Create the user in the database
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        avatar: avatarUrl,
        phoneNum: parsedPhoneNum,
        role,
      },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error during user registration:", error);
    res
      .status(500)
      .json({ error: "Internal server error during registration." });
  }
}
