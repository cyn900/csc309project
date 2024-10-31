import { hashPassword } from "@/utils/auth";
import prisma from "@/utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Destructure with default value for `role`
  const { firstName, lastName, email, password, avatar, phoneNum, role = "user" } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      message: "Missing required fields: first name, last name, email, and password are all required."
    });
  }

  try {
    // Check if a user already exists with the provided email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists with the provided email." });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user with optional fields included
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        vatar: avatar ? avatar : 'avatar/default.jpg',  // Default to 'avatar/default.jpg' if not provided
        phoneNum, // undefined if not provided
        role
      },
      select: {
        uID: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        phoneNum: true,
        role: true
      }
    });

    // Respond with success and user information
    res.status(201).json({
      message: "User successfully registered.",
      user
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error during user registration." });
  }
}