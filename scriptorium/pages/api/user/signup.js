import { hashPassword } from "@/utils/auth";
import prisma from "@/utils/db";
import multer from 'multer';
import path from 'path';

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/avatar/')  // Path to store the files within the public directory
  },
  filename: function(req, file, cb) {
    // Generates file name with a timestamp to avoid name conflicts
    cb(null, Date.now() + '-' + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },  // 1MB limit
  fileFilter: function(req, file, cb) {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).single('avatar');  // Ensure the form's file input field has name="avatar"

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Headers:", req.headers); // Log headers to see what is being set.

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Upload Error:", err);
      return res.status(500).json({ message1: err.message });
    } else if (err) {
      console.error("Other Error:", err);
      return res.status(500).json({ message2: err.message });
    }

    const { firstName, lastName, email, password, phoneNum, role = "user" } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Missing required fields: first name, last name, email, and password are all required."
      });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ message: "User already exists with the provided email." });
      }

      const hashedPassword = await hashPassword(password);
      const avatarUrl = req.file ? req.file.path : 'public/avatar/default.jpg';

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          avatar: avatarUrl,
          phoneNum,
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

      res.status(201).json({
        message: "User successfully registered.",
        user
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error during user registration." });
    }
  });
}