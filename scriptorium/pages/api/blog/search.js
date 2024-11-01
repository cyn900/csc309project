import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Extract query parameters for filtering and pagination
    const { title, content, tag, template, method, page = 1 } = req.body;
    const pageSize = 5; // Set the number of items per page
    const skip = (parseInt(page) - 1) * pageSize; // Calculate the number of items to skip

    console.log('Search query:', { title, content, tag, template, method, page });
    // Dynamically create conditions based on provided parameters
    const orConditions = [];
    const andConditions = [];

    if (title) {
        orConditions.push({ title: { contains: title.toLowerCase() } });
    }

    if (content) {
        orConditions.push({ description: { contains: content.toLowerCase() } });
    }

    if (tag) {
        andConditions.push({
            tags: { some: { name: { contains: tag.toLowerCase() } } }
        });
    }

    if (template) {
        andConditions.push({
            templates: { some: { code: { contains: template.toLowerCase() } } }
        });
    }

    andConditions.push({ hidden: false });

    try {
        const blogs = await prisma.blog.findMany({
            where: {
                AND: andConditions.length > 0 ? andConditions : undefined,
                OR: orConditions.length > 0 ? orConditions : undefined,
            },
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
            skip: skip, // Skip the previous pages results
            take: pageSize // Take only the limit per page
        });

        res.status(200).json(blogs);
    } catch (error) {
        console.error('Search query failed:', error);
        res.status(500).json({ message: "Internal server error while executing search" });
    }
}