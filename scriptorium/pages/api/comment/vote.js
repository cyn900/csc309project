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

    const { cID, voteType } = req.body; // Expect 'upvote' or 'downvote', cID is comment ID

    if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ message: 'Invalid vote type specified. Must be either "upvote" or "downvote".' });
    }

    const comment = await prisma.comment.findUnique({
        where: { cID: parseInt(cID, 10) },
        include: { upvoters: true, downvoters: true }
    });

    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    const alreadyUpvoted = comment.upvoters.some(voter => voter.uID === user.uID);
    const alreadyDownvoted = comment.downvoters.some(voter => voter.uID === user.uID);

    try {
        if (voteType === 'upvote') {
            if (!alreadyUpvoted) {
                await prisma.comment.update({
                    where: { cID: parseInt(cID, 10) },
                    data: {
                        upvoters: { connect: { uID: user.uID } },
                    }
                });
            }
            if (alreadyDownvoted) {
                await prisma.comment.update({
                    where: { cID: parseInt(cID, 10) },
                    data: {
                        downvoters: { disconnect: { uID: user.uID } },
                    }
                });
            }
        } else if (voteType === 'downvote') {
            if (!alreadyDownvoted) {
                await prisma.comment.update({
                    where: { cID: parseInt(cID, 10) },
                    data: {
                        downvoters: { connect: { uID: user.uID } },
                    }
                });
            }
            if (alreadyUpvoted) {
                await prisma.comment.update({
                    where: { cID: parseInt(cID, 10) },
                    data: {
                        upvoters: { disconnect: { uID: user.uID } }
                    }
                });
            }
        }

        // Re-fetch the updated comment to return the latest vote counts
        const updatedComment = await prisma.comment.findUnique({
            where: { cID: parseInt(cID, 10) },
            include: { 
                _count: {
                    select: {
                        upvoters: true,
                        downvoters: true
                    }
                }
            }
        });

        res.status(200).json({ message: `Successfully updated ${voteType}`, comment: updatedComment });
    } catch (error) {
        console.error("Error updating vote:", error);
        res.status(500).json({ message: "Unable to update vote, database error." });
    }
}