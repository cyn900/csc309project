import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
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

    console.log(user);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { title, description, tags, templates, upvote = 0, downvote = 0, commentNum = 0, hidden = false} = req.body;

    try {
        const newBlog = await prisma.blog.create({
            data: {
                title,
                description,
                upvote,
                downvote,
                commentNum,
                hidden,
                uID: user.uID,  // Now using the fetched user ID
                tags,
                templates
            }
        });

        res.status(201).json(newBlog);
    } catch (error) {
        console.error("Error creating blog post:", error);
        res.status(500).json({ message: "Unable to create blog post, database error." });
    }
}