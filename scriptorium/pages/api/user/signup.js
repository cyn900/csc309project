import multer from 'multer';
import path from 'path';
import { hashPassword } from "@/utils/auth";
import prisma from "@/utils/db";

// Configure multer storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/avatar/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // Limit file size to 5MB for images
    fileFilter: function(req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('avatar'); // Handle one file upload named 'avatar'

// Middleware to handle different content types including JSON and form-data
export const config = {
    api: {
        bodyParser: false // Disabling bodyParser to use multer and manual JSON parsing
    }
};

export default function handler(req, res) {
    // Manually handle JSON parsing if needed
    if (req.headers['content-type']?.includes('application/json')) {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            req.body = JSON.parse(data);
            postHandler(req, res);
        });
    } else {
        // Use multer for 'multipart/form-data'
        upload(req, res, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            postHandler(req, res);
        });
    }
}

function postHandler(req, res) {
    const { firstName, lastName, email, password, phoneNum, role = "user" } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    prisma.user.findUnique({ where: { email } }).then(existingUser => {
        if (existingUser) {
            return res.status(409).json({ error: "User already exists with this email." });
        }

        hashPassword(password).then(hashedPassword => {
            const avatarUrl = req.file ? `/${req.file.path}` : '/avatar/default.jpg';

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
                res.status(201).json({ message: "User registered successfully", user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar
                }});
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