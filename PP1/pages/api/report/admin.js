import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    // Verify allowed methods
    if (!['GET', 'PATCH'].includes(req.method)) {
        res.setHeader('Allow', ['GET', 'PATCH']);
        return res.status(405).end('Method Not Allowed');
    }

    // Authenticate and authorize user
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required' });
    }

    const userClaims = verifyToken(token);
    if (!userClaims) {
        return res.status(401).json({ message: 'Invalid or missing authorization token' });
    }

    const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Process GET requests for data retrieval with pagination
    if (req.method === 'GET') {
        const { type, page = 1, pageSize = 5 } = req.query;
        const skip = (page - 1) * pageSize;
        const pageSizeNum = parseInt(pageSize, 10);

        try {
            let data;
            if (type === 'blog') {
                data = await prisma.blog.findMany({
                    orderBy: { blogReports: { _count: 'desc' } },
                    skip, take: pageSizeNum,
                    include: { _count: { select: { blogReports: true } } }
                });
            } else if (type === 'comment') {
                data = await prisma.comment.findMany({
                    orderBy: { commentReports: { _count: 'desc' } },
                    skip, take: pageSizeNum,
                    include: { _count: { select: { commentReports: true } } }
                });
            } else {
                return res.status(400).json({ message: "Invalid type parameter" });
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error("Error retrieving data:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    // Process PATCH requests for data modification
    else if (req.method === 'PATCH') {
        const { id, type, hidden } = req.body;

        try {
            const updateData = { hidden };
            if (typeof hidden !== "boolean") {
                return res.status(400).json({ message: 'Hidden must be defined as true or false.' });
            }
            
            if (type === 'blog') {
                const blogExists = await prisma.blog.findUnique({
                    where: { bID: id },
                    select: { bID: true }
                });
            
                if (!blogExists) {
                    return res.status(404).json({ message: "Blog not found" });
                }
            
                const updated = await prisma.blog.update({
                    where: { bID: id },
                    data: { hidden }
                });
                return res.status(200).json(updated);
            } else if (type === 'comment') {
                const commentExists = await prisma.comment.findUnique({
                    where: { cID: id },
                    select: { cID: true }
                });
            
                if (!commentExists) {
                    return res.status(404).json({ message: "Comment not found" });
                }
            
                const updated = await prisma.comment.update({
                    where: { cID: id },
                    data: { hidden }
                });
                return res.status(200).json(updated);
            } else {
                return res.status(400).json({ message: 'Type must be "post" or "comment".' });
            }
        } catch (error) {
            console.error("Error updating data:", error);
            res.status(500).json({ message: "Internal server error while updating data" });
        }
    }
}