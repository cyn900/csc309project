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

    const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { bID } = req.query;
    const { voteType } = req.body; // Expect 'upvote' or 'downvote'

    if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ message: 'Invalid vote type specified. Must be either "upvote" or "downvote".' });
    }

    const blog = await prisma.blog.findUnique({
        where: { bID: parseInt(bID, 10) },
        include: { upvoters: true, downvoters: true }
    });

    if (!blog) {
        return res.status(404).json({ message: 'Blog post not found' });
    }

    const alreadyUpvoted = blog.upvoters.some(voter => voter.uID === user.uID);
    const alreadyDownvoted = blog.downvoters.some(voter => voter.uID === user.uID);

    try {
        if (voteType === 'upvote') {
            if (!alreadyUpvoted) {
                await prisma.blog.update({
                    where: { bID: parseInt(bID, 10) },
                    data: {
                        upvoters: { connect: { uID: user.uID } },
                        upvote: { increment: 1 }
                    }
                });
            }
            if (alreadyDownvoted) {
                await prisma.blog.update({
                    where: { bID: parseInt(bID, 10) },
                    data: {
                        downvoters: { disconnect: { uID: user.uID } },
                        downvote: { decrement: 1 }
                    }
                });
            }
        } else if (voteType === 'downvote') {
            if (!alreadyDownvoted) {
                await prisma.blog.update({
                    where: { bID: parseInt(bID, 10) },
                    data: {
                        downvoters: { connect: { uID: user.uID } },
                        downvote: { increment: 1 }
                    }
                });
            }
            if (alreadyUpvoted) {
                await prisma.blog.update({
                    where: { bID: parseInt(bID, 10) },
                    data: {
                        upvoters: { disconnect: { uID: user.uID } },
                        upvote: { decrement: 1 }
                    }
                });
            }
        }

        // Re-fetch the updated blog to return the latest vote counts
        const updatedBlog = await prisma.blog.findUnique({
            where: { bID: parseInt(bID, 10) },
            include: { upvoters: true, downvoters: true }
        });

        res.status(200).json({ message: `Successfully updated ${voteType}`, blog: updatedBlog });
    } catch (error) {
        console.error("Error updating vote:", error);
        res.status(500).json({ message: "Unable to update vote, database error." });
    }
}