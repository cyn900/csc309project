import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Retrieve all blogs sorted by 'upvote' in descending order
            const blogs = await prisma.blog.findMany({
                where: {
                    hidden: false  // Assuming we only want to show non-hidden posts
                },
                orderBy: {
                    upvote: 'desc'
                }
            });

            res.status(200).json(blogs);
        } catch (error) {
            console.error('Failed to retrieve blogs:', error);
            res.status(500).json({ message: "Internal server error while fetching blogs" });
        }
    } else {
        // If not GET method, respond with method not allowed
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}