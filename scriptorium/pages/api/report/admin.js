import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end('Method Not Allowed');
    }

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
        return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }
    // Pagination parameters
    let {type, page = 1, pageSize = 5 } = req.query;

    // Convert and validate pagination parameters
    page = parseInt(page, 10); // Ensure 'page' is a valid integer
    pageSize = parseInt(pageSize, 10); // Ensure 'pageSize' is a valid integer
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ message: "Page and pageSize must be positive integers." });
    }

    const skip = (page - 1) * pageSize;

    try {
        // Apply ordering in the database query itself before pagination
        if (type === 'blog') {
            const data = await prisma.blog.findMany({
                orderBy: {
                    blogReports: {
                        _count: 'desc'
                    }
                },
                skip,
                take: pageSize,
                include: {
                    _count: {
                        select: { blogReports: true }
                    }
                }
            });
            return res.status(200).json(data);
        } else if (type === 'comment') {
            const data = await prisma.comment.findMany({
                orderBy: {
                    commentReports: {
                        _count: 'desc'
                    }
                },
                skip,
                take: pageSize,
                include: {
                    _count: {
                        select: { commentReports: true }
                    }
                }
            });
            return res.status(200).json(data);
        } else{
            return res.status(400).json({ message: "Invalid type parameter" });
        }

    } catch (error) {
        console.error("Error retrieving blogs:", error);
        res.status(500).json({ message: "Internal server error while retrieving blogs" });
    }
}