import { verifyToken } from '@/utils/auth';
import prisma from '@/utils/db';
import upload from '@/utils/upload'; // Import the multer configuration

export const config = {
    api: {
        bodyParser: false // Disable the default body parser
    }
};

const handler = async (req, res) => {
    if (req.method !== 'PATCH') {
        return res.status(405).end('Method Not Allowed');
    }

    const userClaims = verifyToken(req.headers.authorization);
    if (!userClaims) {
        return res.status(401).json({ message: 'Invalid or missing authorization token' });
    }

    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('multipart/form-data')) {
        // Handle multipart/form-data for file uploads
        upload(req, res, function(err) {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            processRequest(req, res, userClaims);
        });
    } else {
        // Manually parse JSON body
        let data = '';
        req.on('data', chunk => {
            data += chunk.toString();
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(data);
                processRequest(req, res, userClaims);
            } catch (err) {
                return res.status(400).json({ message: 'Invalid JSON data' });
            }
        });
    }
};

async function processRequest(req, res, userClaims) {
    const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (req.file) updateData.avatar = `/${req.file.path}`; // Assume file upload is handled by multer

    try {
        const updatedUser = await prisma.user.update({
            where: { uID: user.uID }, // Correct identifier, assuming it's `uID` in your schema
            data: updateData
        });

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal server error during profile update." });
    }
}

export default handler;