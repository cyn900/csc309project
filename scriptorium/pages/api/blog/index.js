import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end('Method Not Allowed');
    }

    const { bID } = req.query;

    // Check if bID is provided and valid
    if (!bID) {
        return res.status(400).json({ message: "Blog ID is required." });
    }

    const id = parseInt(bID, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: "Blog ID must be a valid integer." });
    }

    try {
        const blog = await prisma.blog.findUnique({
            where: { bID: id },
            include: {
                tags: true,            // Include related tags
                templates: true,       // Include related templates
                user: true,            // Include the user who posted the blog
                comments: {            // Include comments
                    where: { hidden: false }, // Filter to only show visible comments
                    include: {
                        user: true    // Include the user details for each comment
                    }
                },
                upvoters: true,        // Include users who upvoted the blog
                downvoters: true       // Include users who downvoted the blog
            }
        });

        if (!blog) {
            return res.status(404).json({ message: "Blog post not found." });
        }

        res.status(200).json(blog);
    } catch (error) {
        console.error("Error retrieving blog post:", error);
        res.status(500).json({ message: "Internal server error while retrieving the blog post" });
    }
}