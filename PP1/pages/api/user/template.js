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

    // Pagination parameters
    let {page = 1, pageSize = 5 } = req.query;

    // Convert and validate pagination parameters
    page = parseInt(page, 10); // Ensure 'page' is a valid integer
    pageSize = parseInt(pageSize, 10); // Ensure 'pageSize' is a valid integer
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ message: "Page and pageSize must be positive integers." });
    }

    const skip = (page - 1) * pageSize;

    try {
        const templates = await prisma.template.findMany({
            where: {
                uID: user.uID  // Assuming `uID` is the field linking templates to their creator
            },
            include: {
                tags: true,      // Include tags for each template
            },
            orderBy: {
                tID: 'asc' // Order by tID in ascending order, so oldest templates are shown first
            },
            skip: skip,
            take: pageSize,
        });

        // return total count for client-side pagination handling
        const totalCount = await prisma.template.count({
            where: { uID: user.uID }
        });

        res.status(200).json({ templates, totalCount, page, pageSize });
    } catch (error) {
        console.error("Error retrieving templates:", error);
        res.status(500).json({ message: "Internal server error while retrieving templates" });
    }
}