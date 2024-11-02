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
        const { bID, explanation } = req.body;
        if (!bID || !explanation) {
            return res.status(400).json({ message: "Blog ID and explanation are required." });
        }

        try {
            const blog = await prisma.blog.findUnique({
                where: { bID: parseInt(bID, 10) }
            });

            if (!blog) {
                return res.status(404).json({ message: 'Blog post not found' });
            }

            const existingReport = await prisma.blogReport.findFirst({
                where: {
                    bID: parseInt(bID),
                    uID: user.uID
                }
            });

            if (existingReport) {
                return res.status(409).json({ message: 'You have already reported this blog.' });
            }

            const newBlogReport = await prisma.blogReport.create({
                data: {
                    explanation,
                    blog: {
                        connect: { bID: parseInt(bID) }
                    },
                    user: {
                        connect: { uID: user.uID }
                    }
                }
            });

            res.status(201).json({ message: "Blog report created successfully", blogReport: newBlogReport });
        } catch (error) {
            console.error("Error creating blog report:", error);
            res.status(500).json({ message: "Unable to create blog report, database error." });
        }
    } else if (req.method === 'DELETE') {
        const { bID } = req.query; // Assuming bID is passed as a query parameter

        if (!bID) {
            return res.status(400).json({ message: "Blog ID is required for deletion." });
        }

        const report = await prisma.blogReport.findFirst({
            where: {
                bID: parseInt(bID),
                uID: user.uID
            }
        });

        if (!report) {
            return res.status(404).json({ message: 'Blog report not found or not yours to delete' });
        }

        try {
            await prisma.blogReport.delete({
                where: { brID: report.brID }
            });

            res.status(200).json({ message: "Blog report deleted successfully" });
        } catch (error) {
            console.error("Error deleting blog report:", error);
            res.status(500).json({ message: "Unable to delete blog report, database error." });
        }
    }
}