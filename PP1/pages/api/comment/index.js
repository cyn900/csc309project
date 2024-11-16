import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end('Method Not Allowed');
    }

    let { cID, method, page = 1, pageSize = 5 } = req.query; // Default pageSize to 5 if not specified

    // Validate comment ID
    const id = parseInt(cID, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: "Comment ID must be a valid integer." });
    }

    // Convert and validate pagination parameters
    page = parseInt(page, 10); // Ensure 'page' is a valid integer
    pageSize = parseInt(pageSize, 10); // Ensure 'pageSize' is a valid integer
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ message: "Page and pageSize must be positive integers." });
    }

    try {
        const comments = await prisma.comment.findMany({
            where: {
                pID: id,     // Ensure the pID is accurate
                hidden: false  // Filter to only show visible comments
            },
            include: {
                user: true, // Include user details
                _count: {
                    select: {
                        upvoters: true,
                        downvoters: true,
                        subComments: true
                    }
                }
            },
        });

        if (!comments) {
            return res.status(404).json({ message: "Comment not found." });
        }

        // Sort comments based on the specified method
        comments.sort((a, b) => {
            switch (method) {
                case 'controversial':
                    return (b._count.upvoters + b._count.downvoters + b._count.subComments) -
                            (a._count.upvoters + a._count.downvoters + a._count.subComments);
                case 'popular':
                    return b._count.upvoters - a._count.upvoters;
                default:
                    return b.cID - a.cID; // Sort by comment ID for default case
            }
        });


        // Manually apply pagination
        const startIndex = (page - 1) * pageSize;
        const paginatedComments = comments.slice(startIndex, startIndex + pageSize);

        res.status(200).json(paginatedComments);

    } catch (error) {
        console.error("Error retrieving comment:", error);
        res.status(500).json({ message: "Internal server error while retrieving the comment." });
    }
}