import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const userClaims = verifyToken(req.headers.authorization);
    if (!userClaims) {
        return res.status(401).json({ message: 'Invalid or missing authorization token' });
    }

    const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { title, description, tags=[], templates=[] } = req.body;
    console.log("tags", tags);
    console.log("templates", templates);

    if (typeof title !== 'string' || title.trim() === '' ||
        typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: "Title and description are required and must be strings." });
    }

    // Validate tags and templates are arrays of strings
    if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string') || tags.length > 10) {
        return res.status(400).json({ message: "Tags must be an array of strings and cannot exceed 10." });
    }

    if (!Array.isArray(templates) || templates.some(template => typeof template !== 'string') || templates.length > 10) {
        return res.status(400).json({ message: "Templates must be an array of strings and cannot exceed 10." });
    }

    // Check if the blog title already exists using `findFirst`
    const existingBlog = await prisma.blog.findFirst({
        where: { title }
    });

    if (existingBlog) {
        return res.status(409).json({ message: "A blog with this title already exists." });
    }

    const existingTemplates = await prisma.template.findMany({
        where: {
            title: {
                in: templates,
            }
        }
    });

    if (existingTemplates.length !== templates.length) {
        return res.status(400).json({ message: "One or more templates do not exist." });
    }

    const tagConnectOrCreate = tags.map(tag => ({
        where: { value: tag },
        create: { value: tag },
    }));

    try {
        const newBlog = await prisma.blog.create({
            data: {
                title,
                description,
                commentNum: 0,
                hidden: false,
                uID: user.uID,
                tags: {
                    connectOrCreate: tagConnectOrCreate
                },
                templates: {
                    connect: existingTemplates.map(template => ({ tID: template.tID }))
                },
            },
            include: {
                tags: true,
                templates: true
            }
        });

        res.status(201).json({ message: "Blog created successfully", blog: newBlog });
    } catch (error) {
        console.error("Error creating blog post:", error);
        res.status(500).json({ message: "Unable to create blog post, database error." });
    }
}