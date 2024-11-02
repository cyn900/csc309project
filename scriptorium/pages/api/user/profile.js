import { verifyToken } from '@/utils/auth';
import prisma from '@/utils/db';
import upload from '@/utils/upload'; // Import the multer configuration

export const config = {
    api: {
        bodyParser: false // Required for multer and manual JSON handling
    }
};

const handler = async (req, res) => {
    // Authenticate user
    const userClaims = verifyToken(req.headers.authorization);
    if (!userClaims) {
        return res.status(401).json({ message: 'Invalid or missing authorization token' });
    }

    if (req.method === 'GET') {
        // Handle retrieving user information
        try {
            const user = await prisma.user.findUnique({
                where: { email: userClaims.useremail }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({ message: "User profile retrieved successfully", user });
        } catch (error) {
            console.error("Error retrieving user profile:", error);
            return res.status(500).json({ error: "Internal server error during profile retrieval." });
        }
    } else if (req.method === 'PATCH') {
        // Handle updates to user profile
        handlePatchRequest(req, res, userClaims);
    } else {
        return res.status(405).end('Method Not Allowed');
    }
};

async function handlePatchRequest(req, res, userClaims) {
    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('multipart/form-data')) {
        // Handle multipart/form-data for file uploads
        upload(req, res, function(err) {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            processPatchRequest(req, res, userClaims);
        });
    } else {
        // Manually parse JSON body for other content types
        let data = '';
        req.on('data', chunk => {
            data += chunk.toString();
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(data);
                processPatchRequest(req, res, userClaims);
            } catch (err) {
                return res.status(400).json({ message: 'Invalid JSON data' });
            }
        });
    }
}

async function processPatchRequest(req, res, userClaims) {
    const { firstName, lastName } = req.body;
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (req.file) updateData.avatar = `/${req.file.path}`;

    try {
        const updatedUser = await prisma.user.update({
            where: { email: userClaims.useremail },
            data: updateData,
        });

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal server error during profile update." });
    }
}

export default handler;