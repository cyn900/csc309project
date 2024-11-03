import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end('Method Not Allowed');
    }

    const { cID, page = 1, pageSize = 5 } = req.query; // Default pageSize to 5 if not specified

    // Validate comment ID
    const id = parseInt(cID, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: "Comment ID must be a valid integer." });
    }

    // Pagination calculations
    const skip = (page - 1) * pageSize;

    try {
        const comment = await prisma.comment.findUnique({
            where: { cID: id },
            include: {
                user: true, // Simplify user data
                upvoters: { select: { uID: true } }, // Only return user IDs
                downvoters: { select: { uID: true } }, // Only return user IDs
                parentComment: true, // Include basic details if needed
                subComments: {
                    where: {
                        pID: id,     // Ensure the pID is accurate
                        hidden: false  // Filter to only show visible comments
                    },
                    skip,
                    take: parseInt(pageSize),
                    orderBy: { cID: 'asc' }
                },
                blog: true, // Simplify blog data
            }
        });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }

        res.status(200).json({ comment, pagination: { page, pageSize } });
    } catch (error) {
        console.error("Error retrieving comment:", error);
        res.status(500).json({ message: "Internal server error while retrieving the comment." });
    }
}