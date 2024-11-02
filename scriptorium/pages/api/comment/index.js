import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end('Method Not Allowed');
    }

    const { cID } = req.query;

    // Check if cID is provided and valid
    if (!cID) {
        return res.status(400).json({ message: "comment ID is required." });
    }

    const id = parseInt(cID, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: "comment ID must be a valid integer." });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { cID: id },
            include: {
                user: true, // Include the user associated with the comment
                upvoters: true, // Include users who upvoted the comment
                downvoters: true, // Include users who downvoted the comment
                parentComment: true, // Include the parent comment if this is a sub-comment
                subComments: true, // Include any sub-comments if this comment has any
                blog: true, // Include the blog associated with the comment
            }
        });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }

        res.status(200).json(comment);
    } catch (error) {
        console.error("Error retrieving comment:", error);
        res.status(500).json({ message: "Internal server error while retrieving the comment" });
    }
}