import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end('Method Not Allowed');
    }

    let { bID, page = 1, method , pageSize = 5 } = req.query; // Default pagination parameters

    // Validate blog ID
    if (!bID) {
        return res.status(400).json({ message: "Blog ID is required." });
    }
    const id = parseInt(bID, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: "Blog ID must be a valid integer." });
    }

    // Convert and validate pagination parameters
    page = parseInt(page, 10); // Ensure 'page' is a valid integer
    pageSize = parseInt(pageSize, 10); // Ensure 'pageSize' is a valid integer
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ message: "Page and pageSize must be positive integers." });
    }

    try {
        const blog = await prisma.blog.findUnique({
            where: { bID: id },
            include: {
                tags: true,            // Include related tags
                templates: true,       // Include related templates
                user: true,            // Include the blog author
                comments: {            // Paginate first-level comments
                    where: {
                        bID: id,       // Ensure comments by blog ID
                        pID: null,     // Ensure only first-level comments are fetched
                        hidden: false,  // Filter to only show visible comments
                    },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        user: true,    // Include the user details for each comment
                        _count: {
                            select: {
                                upvoters: true,
                                downvoters: true,
                                subComments: true
                            }
                        }
                    }
                }
            }
        });

        if (!blog) {
            return res.status(404).json({ message: "Blog post not found." });
        }

        // Apply manual sorting based on method if comments exist
        if (blog.comments && blog.comments.length > 0) {
            switch (method) {
                case 'controversial':
                    blog.comments.sort((a, b) => 
                        (b._count.upvoters+ b._count.downvoters + b._count.subComments) -
                        (a._count.upvoters+ b._count.downvoters + b._count.subComments));
                    break;
                case 'popular':
                    blog.comments.sort((a, b) => b._count.upvoters - a._count.upvoters);
                    break;
                default:
                    blog.comments.sort((a, b) => b.bID - a.bID); // newer first
                    break;
            }
        }

        res.status(200).json(blog);
    } catch (error) {
        console.error("Error retrieving blog post:", error);
        res.status(500).json({ message: "Internal server error while retrieving the blog post" });
    }
}