import prisma from '@/utils/db';
import { verifyToken } from '@/utils/auth';

export default async function handler(req, res) {
    if (!['POST', 'DELETE'].includes(req.method)) {
        res.setHeader('Allow', ['POST', 'DELETE']);
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

    if (req.method === 'POST') {
        const { cID, explanation } = req.body;
        if (!cID || !explanation) {
            return res.status(400).json({ message: "Comment ID and explanation are required." });
        }

        try {
            const comment = await prisma.comment.findUnique({
                where: { cID: parseInt(cID, 10) }
            });

            if (!comment) {
                return res.status(404).json({ message: 'Comment post not found' });
            }

            const existingReport = await prisma.commentReport.findFirst({
                where: {
                    cID: parseInt(cID),
                    uID: user.uID
                }
            });

            if (existingReport) {
                return res.status(409).json({ message: 'You have already reported this comment.' });
            }

            const newcommentReport = await prisma.commentReport.create({
                data: {
                    explanation,
                    comment: {
                        connect: { cID: parseInt(cID) }
                    },
                    user: {
                        connect: { uID: user.uID }
                    }
                }
            });

            res.status(201).json({ message: "Comment report created successfully", commentReport: newcommentReport });
        } catch (error) {
            console.error("Error creating Comment report:", error);
            res.status(500).json({ message: "Unable to create comment report, database error." });
        }
    } else if (req.method === 'DELETE') {
        const { cID } = req.query; // Assuming cID is passed as a query parameter

        if (!cID) {
            return res.status(400).json({ message: "Comment ID is required for deletion." });
        }

        const report = await prisma.commentReport.findFirst({
            where: {
                cID: parseInt(cID),
                uID: user.uID
            }
        });

        if (!report) {
            return res.status(404).json({ message: 'Comment report not found or not yours to delete' });
        }

        try {
            await prisma.commentReport.delete({
                where: { crID: report.crID }
            });

            res.status(200).json({ message: "Comment report deleted successfully" });
        } catch (error) {
            console.error("Error deleting comment report:", error);
            res.status(500).json({ message: "Unable to delete comment report, database error." });
        }
    }
}