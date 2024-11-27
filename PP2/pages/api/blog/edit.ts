import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

interface UserClaims {
  useremail: string;
}

interface UpdateBlogRequestBody {
  bID: string; // blog ID passed as string in body
  title?: string;
  description?: string;
  tags?: string[];
  templates?: number[]; // Template IDs
  hidden?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ message: "Invalid or missing authorization token" });
  }

  const userClaims = verifyToken(authorizationHeader) as UserClaims | null;

  if (!userClaims || !userClaims.useremail) {
    return res.status(401).json({ message: "Invalid or missing authorization token" });
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { email: userClaims.useremail },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Validate request body
  const { bID, title, description, tags = [], templates = [], hidden }: UpdateBlogRequestBody =
    req.body;

  if (!bID || isNaN(parseInt(bID, 10))) {
    return res.status(400).json({ message: "Invalid or missing blog ID" });
  }

  // Verify blog exists - include user information
  const blog = await prisma.blog.findUnique({
    where: { bID: parseInt(bID, 10) },
    include: {
      user: {
        select: {
          uID: true
        }
      }
    }
  });

  if (!blog) {
    return res.status(404).json({ message: "Blog post not found" });
  }

  // Check permissions - use blog.user.uID instead of blog.uID
  if (blog.user.uID !== user.uID) {

    return res.status(403).json({ message: "You do not have permission to edit this blog post" });
  }

  if (blog.hidden) {
    return res.status(403).json({ message: "You cannot edit this blog post" });
  }

  // Process tags
  const tagConnectOrCreate = tags.map((tag) => ({
    where: { value: tag },
    create: { value: tag },
  }));

  // Verify templates exist
  const existingTemplates = await prisma.template.findMany({
    where: { tID: { in: templates } },
  });

  try {
    // Update blog
    const updatedBlog = await prisma.blog.update({
      where: { bID: parseInt(bID, 10) },
      data: {
        title,
        description,
        hidden,
        tags: {
          set: [], // Remove existing tags
          connectOrCreate: tagConnectOrCreate, // Add or create new tags
        },
        templates: {
          set: existingTemplates.map((template) => ({ tID: template.tID })), // Replace templates
        },
      },
      include: {
        tags: true,
        templates: true,
      },
    });

    res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ message: "Unable to update blog post, database error." });
  }
}
