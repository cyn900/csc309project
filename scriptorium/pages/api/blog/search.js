import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    let { title, content, tags, templates, method, page = 1 } = req.body;

    // Validate data type for title and content
    if ((title && typeof title !== 'string') ||
        (content && typeof content !== 'string')){
        return res.status(400).json({ message: "Incorrect data types provided for title and content." });
    }

    // Convert page to integer
    page = parseInt(page, 10);
    if (isNaN(page) || page < 1) {
        return res.status(400).json({ message: "Page must be a positive integer" });
    }

    const pageSize = 5; // Set the number of items per page
    const skip = (page - 1) * pageSize; // Calculate the number of items to skip

    const conditions = [{ hidden: false }]; // Default condition to filter hidden blogs

    if (title) conditions.push({ title: { contains: title } });
    if (content) conditions.push({ description: { contains: content } });

    // Try to parse tags and templates if they are provided as strings
    try {
        if (tags && typeof tags === 'string') tags = JSON.parse(tags);
        if (templates && typeof templates === 'string') templates = JSON.parse(templates);
    } catch (err) {
        return res.status(400).json({ message: "Invalid JSON format for tags or templates" });
    }

    // Ensure tags and templates are arrays
    if (tags && !Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
    }
    if (templates && !Array.isArray(templates)) {
        return res.status(400).json({ message: "Templates must be an array" });
    }

    // Build conditions based on tags and templates
    if (tags && tags.length) {
        conditions.push({
            tags: {
                some: {
                    value: {
                        in: tags
                    }
                }
            }
        });
    }
    if (templates && templates.length) {
        conditions.push({
            templates: {
                some: {
                    title: {
                        in: templates
                    }
                }
            }
        });
    }

    try {
        const blogs = await prisma.blog.findMany({
            where: { AND: conditions },
            include: {
                tags: true,
                templates: true,
                user: true,
                upvoters: true,
                downvoters: true
            },
            orderBy: method === 'controversial' ? {
                _count: {
                    select: { upvote: true, downvote: true },
                    orderBy: {
                        upvote: 'desc',
                        downvote: 'desc'
                    }
                }
            } : {
                upvote: 'desc'
            },
            skip,
            take: pageSize
        });

        res.status(200).json(blogs);
    } catch (error) {
        console.error('Search query failed:', error);
        res.status(500).json({ message: "Internal server error while executing search" });
    }
}