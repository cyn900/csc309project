import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end('Method Not Allowed');
    }

    // Authentication and user retrieval
    const userClaims = verifyToken(req.headers.authorization);
    if (!userClaims) {
        return res.status(401).json({ message: 'Invalid or missing authorization token' });
    }

    const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { bID, content } = req.body;

    // Validate input
    if (!bID || !content) {
        return res.status(400).json({ message: "Blog ID and content are required." });
    }

    try {
        const newComment = await prisma.comment.create({
            data: {
                content: content,
                hidden: false,
                upvote: 0,
                downvote: 0,
                blog: {
                    connect: {
                        bID: parseInt(bID)
                    }
                },
                user: {
                    connect: {
                        uID: user.uID
                    }
                }
            }
        });

        res.status(201).json({ message: "Comment created successfully", comment: newComment });
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Internal server error while creating comment" });
    }
}