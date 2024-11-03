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

    const { bID, content, pID = null } = req.body;

    // Validate input
    if (!bID || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: "Blog ID and content are required and content must be a non-empty string." });
    }
    
     // Check if pID exists if provided
     if (pID) {
        const parentComment = await prisma.comment.findUnique({
            where: { cID: parseInt(pID, 10) },
            include: {
                blog: true  // Include the blog for cross verification
            }
        });

        if (!parentComment) {
            return res.status(404).json({ message: "Parent comment not found." });
        }
        
        // Verify that the parent comment belongs to the same blog
        if (parentComment.blog.bID !== bID) {
            return res.status(400).json({ message: "Parent comment does not belong to the provided blog." });
        }
    }

    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newComment = await prisma.comment.create({
                data: {
                    content: content,
                    hidden: false,
                    blog: {
                        connect: {
                            bID: parseInt(bID, 10)
                        }
                    },
                    user: {
                        connect: {
                            uID: user.uID
                        }
                    },
                    ...(pID && {
                        parentComment: {
                            connect: {
                                cID: parseInt(pID, 10)
                            }
                        }
                    })
                }
            });

            return newComment;
        });

        res.status(201).json({ message: "Comment created successfully", comment: result });
    } catch (error) {
        console.error("Error creating comment or updating blog:", error);
        res.status(500).json({ message: "Internal server error while creating comment or updating blog" });
    }
}