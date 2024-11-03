import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    let { title, content, tags, templates, method , page = 1, pageSize = 5 } = req.query;

    // Validate data type for title and content
    if ((title && typeof title !== 'string') ||
        (content && typeof content !== 'string')){
        return res.status(400).json({ message: "Incorrect data types provided for title and content." });
    }

    // Convert page to integer
    page = parseInt(page, 10);

    const skip = (page - 1) * pageSize; // Calculate the number of items to skip

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
        const blogs = await prisma.blog.findMany({
            where: { AND: conditions },
            include: {
                tags: true,
                templates: true,
                user: true,
                upvoters: true,
                downvoters: true
            },
            skip,
            take: pageSize
        });

        console.log(method);
        // Sorting based on the 'method'
        switch (method) {
            case 'controversial':
                console.log('here: controversial');
                blogs.sort((a, b) => (b.upvoters.length + b.downvoters.length + b.commentNum) -
                                     (a.upvoters.length + a.downvoters.length + a.commentNum));
                break;
            case 'popular':
                blogs.sort((a, b) => b.upvoters.length - a.upvoters.length);
                break;
            default: // Default to based on created time
                blogs.sort((a, b) => b.bID - a.bID); // newer first
                break;
        }
        
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Search query failed:', error);
        res.status(500).json({ message: "Internal server error while executing search" });
    }
}