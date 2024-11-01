import { hashPassword } from "@/utils/auth";
import prisma from "@/utils/db";
import upload from "@/utils/upload"; // Import the multer middleware

export const config = {
    api: {
        bodyParser: false  // Disable the default body parser to use multer
    }
};

export default function handler(req, res) {
    // Middleware to manually handle JSON parsing
    if (req.headers['content-type']?.includes('application/json')) {
        let data = '';
        req.on('data', chunk => {
            data += chunk.toString(); // Convert Buffer to string
        });
        req.on('end', () => {
            req.body = JSON.parse(data); // Parse the string to JSON
            postHandler(req, res); // Process the request after parsing the JSON
        });
    } else {
        // Use multer for 'multipart/form-data'
        upload(req, res, (err) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            postHandler(req, res); // Process the request after handling the file upload
        });
    }
}

// Extracted the main logic into a separate function for cleaner code
function postHandler(req, res) {
    const { firstName, lastName, email, password, phoneNum, role = "user" } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    prisma.user.findUnique({ where: { email } }).then(existingUser => {
        if (existingUser) {
            return res.status(409).json({ message: "User already exists." });
        }

        hashPassword(password).then(hashedPassword => {
            const avatarUrl = req.file ? `/${req.file.path}` : 'public/avatar/default.jpg'; // Use the uploaded file path or a default

            prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    avatar: avatarUrl,
                    phoneNum,
                    role
                }
            }).then(user => {
                res.status(201).json({ message: "User registered successfully", user });
            }).catch(error => {
                console.error("Registration error:", error);
                res.status(500).json({ error: "Internal server error during registration." });
            });
        }).catch(error => {
            console.error("Password hashing error:", error);
            res.status(500).json({ error: "Internal server error during password hashing." });
        });
    }).catch(error => {
        console.error("Database access error:", error);
        res.status(500).json({ error: "Internal server error during database access." });
    });
}