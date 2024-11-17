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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Extract query parameters
  const {
    title,
    content,
    tags,
    templates,
    method = "default",
    page = "1",
    pageSize = "5",
  } = req.query;

  const pageNum = parseInt(Array.isArray(page) ? page[0] : page || "1", 10);
  const pageSizeNum = parseInt(Array.isArray(pageSize) ? pageSize[0] : pageSize || "5", 10);
  if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
    return res.status(400).json({ message: "Page and pageSize must be positive integers." });
  }

  const conditions: any[] = [{ hidden: false }];
  if (title) conditions.push({ title: { contains: title } });
  if (content) conditions.push({ description: { contains: content } });

  const tagArray = Array.isArray(tags) ? tags : tags ? [tags] : [];
  const templateArray = Array.isArray(templates) ? templates : templates ? [templates] : [];

  // Preliminary filtering using 'some'
  if (tagArray.length > 0) {
    conditions.push({ tags: { some: { value: { in: tagArray } } } });
  }
  if (templateArray.length > 0) {
    conditions.push({ templates: { some: { title: { in: templateArray } } } });
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

    // Post-filter to ensure all tags and templates are included
    const fullyMatchedBlogs = allBlogs.filter(blog => {
      const blogTags = blog.tags.map(t => t.value);
      const blogTemplates = blog.templates.map(t => t.title);
      return tagArray.every(tag => blogTags.includes(tag)) && templateArray.every(template => blogTemplates.includes(template));
    });

    // Sorting and pagination
    switch (method) {
      case "controversial":
        fullyMatchedBlogs.sort(
          (a, b) => (b._count.upvoters + b._count.downvoters + b._count.comments) -
                    (a._count.upvoters + a._count.downvoters + a._count.comments)
        );
        break;
      case "popular":
        fullyMatchedBlogs.sort((a, b) => b._count.upvoters - a._count.upvoters);
        break;
      default:
        fullyMatchedBlogs.sort((a, b) => b.bID - a.bID);
        break;
    }

    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedBlogs = fullyMatchedBlogs.slice(startIndex, startIndex + pageSizeNum);

    // Return both blogs and pagination metadata
    res.status(200).json({
      blogs: paginatedBlogs,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalItems: fullyMatchedBlogs.length,
        totalPages: Math.ceil(fullyMatchedBlogs.length / pageSizeNum)
      }
    });
  } catch (error) {
    console.error("Search query failed:", error);
    res.status(500).json({ message: "Internal server error while executing search" });
  }
}