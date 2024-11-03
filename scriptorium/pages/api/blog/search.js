import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    let { title, content, tags, templates, method , page = 1, pageSize = 5 } = req.query;

    // Convert and validate pagination parameters
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ message: "Page and pageSize must be positive integers." });
    }

    // Validate data type for title and content
    if ((title && typeof title !== 'string') ||
        (content && typeof content !== 'string')){
        return res.status(400).json({ message: "Incorrect data types provided for title and content." });
    }

    const conditions = [{ hidden: false }]; // Default condition to filter hidden blogs

    if (title) conditions.push({ title: { contains: title } });
    if (content) conditions.push({ description: { contains: content } });

    // Normalize tags and templates to always be arrays
    if (tags) {
        tags = typeof tags === 'string' ? [tags] : tags;
        if (!Array.isArray(tags)) {
            return res.status(400).json({ message: "Tags must be an array or a single string." });
        }
    }

    if (templates) {
        templates = typeof templates === 'string' ? [templates] : templates;
        if (!Array.isArray(templates)) {
            return res.status(400).json({ message: "Templates must be an array or a single string." });
        }
    }

    // Remove JSON parsing logic if it is no longer needed, or adjust accordingly
    try {
        if (typeof tags === 'string') tags = JSON.parse(tags);
        if (typeof templates === 'string') templates = JSON.parse(templates);
    } catch (err) {
        return res.status(400).json({ message: "Invalid JSON format for tags or templates" });
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
        const allBlogs = await prisma.blog.findMany({
            where: { AND: conditions },
            include: {
                tags: true,
                templates: true,
                user: true,
                _count: {
                    select: {
                        upvoters: true,
                        downvoters: true
                    }
                }
            }
        });

        // Sorting the retrieved blogs before pagination
        switch (method) {
            case 'controversial':
                allBlogs.sort((a, b) => (b._count.upvoters + b._count.downvoters + b.commentNum) -
                                        (a._count.upvoters + a._count.downvoters + a.commentNum));
                break;
            case 'popular':
                allBlogs.sort((a, b) => b._count.upvoters - a._count.upvoters);
                break;
            default:
                allBlogs.sort((a, b) => b.bID - a.bID); // newer first
                break;
        }

        // Manually applying pagination
        const startIndex = (page - 1) * pageSize;
        const paginatedBlogs = allBlogs.slice(startIndex, startIndex + pageSize);

        res.status(200).json(paginatedBlogs);
    } catch (error) {
        console.error('Search query failed:', error);
        res.status(500).json({ message: "Internal server error while executing search" });
    }
}