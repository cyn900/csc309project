import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
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

    const { bID } = req.query;
    const { title, description, tags, templates, hidden } = req.body;

    const blog = await prisma.blog.findUnique({
        where: { bID: parseInt(bID, 10) }
    });

    if (!blog) {
        return res.status(404).json({ message: 'Blog post not found' });
    }

    if (blog.uID !== user.uID) {
        return res.status(403).json({ message: 'You do not have permission to edit this blog post' });
    }

    // Process tags and templates
    const tagConnectOrCreate = tags.map(tag => ({
        where: { value: tag },
        create: { value: tag }
    }));
    const existingTemplates = await prisma.template.findMany({
        where: { tID: { in: templates } }
    });

    try {
        const updatedBlog = await prisma.blog.update({
            where: { bID: parseInt(bID, 10) },
            data: {
                title,
                description,
                hidden,
                tags: {
                    set: [],
                    connectOrCreate: tagConnectOrCreate
                },
                templates: {
                    set: existingTemplates.map(template => ({ tID: template.tID }))
                }
            },
            include: {
                tags: true,
                templates: true
            }
        });

        res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
    } catch (error) {
        console.error("Error updating blog post:", error);
        res.status(500).json({ message: "Unable to update blog post, database error." });
    }
}