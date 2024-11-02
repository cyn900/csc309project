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

    // Retrieve user ID using the email from the token
    const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { title, description, tags=[], templates=[] } = req.body;

    if (typeof title !== 'string' || title.trim() === '' ||
        typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: "Title and description are required and must be strings." });
    }

    // Ensure all template names exist in the database
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

    // Process tags: create new or connect existing
    const tagConnectOrCreate = tags.map(tag => ({
        where: { value: tag },
        create: { value: tag },
    }));

    try {
        const newBlog = await prisma.blog.create({
            data: {
                title,
                description,
                upvote: 0,
                downvote: 0,
                commentNum: 0,
                hidden: false,
                uID: user.uID,  // Now using the fetched user ID
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