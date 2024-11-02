import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const userClaims = verifyToken(req.headers.authorization);
    if (!userClaims) {
        return res.status(401).json({ message: 'Invalid or missing authorization token' });
    }

    // Retrieve user ID using the email from the token
    const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Parse commeny Id from URL parameters
    const { cID } = req.body;

    const comment = await prisma.comment.findUnique({
        where: { cID: parseInt(cID, 10) }
    });

    if (!comment) {
        return res.status(404).json({ message: 'Comment post not found' });
    }

    if (comment.uID !== user.uID) {
        return res.status(403).json({ message: 'You do not have permission to delete this comment post' });
    }

    try {
        await prisma.comment.delete({
            where: { cID: parseInt(cID, 10) }
        });

        res.status(200).json({message: "Delete successfully"}); 
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Unable to delete comment, database error." });
    }
}