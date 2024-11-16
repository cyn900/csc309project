import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";

interface BlogQueryParams {
  title?: string;
  content?: string;
  tags?: string | string[];
  templates?: string | string[];
  method?: "controversial" | "popular" | "default";
  page?: string;
  pageSize?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Extract query parameters
  const {
    title,
    content,
    tags: rawTags,
    templates: rawTemplates,
    method,
    page = "1",
    pageSize = "5",
  } = req.query as Partial<BlogQueryParams>;

  // Convert and validate pagination parameters
  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
    return res
      .status(400)
      .json({ message: "Page and pageSize must be positive integers." });
  }

  // Validate title and content data types
  if (
    (title && typeof title !== "string") ||
    (content && typeof content !== "string")
  ) {
    return res
      .status(400)
      .json({
        message: "Incorrect data types provided for title and content.",
      });
  }

  const conditions: any[] = [{ hidden: false }]; // Default condition to filter hidden blogs

  if (title) conditions.push({ title: { contains: title } });
  if (content) conditions.push({ description: { contains: content } });

  // Normalize tags and templates to arrays
  let tags: string[] = [];
  let templates: string[] = [];

  try {
    if (rawTags) {
      tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
      if (!Array.isArray(tags)) {
        return res
          .status(400)
          .json({ message: "Tags must be an array or a single string." });
      }
    }

    if (rawTemplates) {
      templates =
        typeof rawTemplates === "string"
          ? JSON.parse(rawTemplates)
          : rawTemplates;
      if (!Array.isArray(templates)) {
        return res
          .status(400)
          .json({ message: "Templates must be an array or a single string." });
      }
    }
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Invalid JSON format for tags or templates" });
  }

  // Build conditions based on tags and templates
  if (tags.length) {
    conditions.push({
      tags: {
        some: {
          value: {
            in: tags,
          },
        },
      },
    });
  }

  if (templates.length) {
    conditions.push({
      templates: {
        some: {
          title: {
            in: templates,
          },
        },
      },
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
            downvoters: true,
            comments: true,
          },
        },
      },
    });

    // Sorting the retrieved blogs before pagination
    switch (method) {
      case "controversial":
        allBlogs.sort(
          (a, b) =>
            b._count.upvoters +
            b._count.downvoters +
            b._count.comments -
            (a._count.upvoters + a._count.downvoters + a._count.comments)
        );
        break;
      case "popular":
        allBlogs.sort((a, b) => b._count.upvoters - a._count.upvoters);
        break;
      default:
        allBlogs.sort((a, b) => b.bID - a.bID); // Newer blogs first
        break;
    }

    // Apply pagination manually
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedBlogs = allBlogs.slice(startIndex, startIndex + pageSizeNum);

    res.status(200).json(paginatedBlogs);
  } catch (error) {
    console.error("Search query failed:", error);
    res
      .status(500)
      .json({ message: "Internal server error while executing search" });
  }
}
