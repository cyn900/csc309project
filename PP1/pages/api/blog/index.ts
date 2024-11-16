import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";

interface BlogQueryParams {
  bID: string;
  method?: string;
  page?: string;
  pageSize?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  // Extract and validate query parameters
  const { bID, method, page = "1", pageSize = "5" } = req.query;

  // Validate blog ID
  if (typeof bID !== "string") {
    return res
      .status(400)
      .json({ message: "Blog ID is required and must be a string." });
  }

  const id = parseInt(bID, 10);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ message: "Blog ID must be a valid integer." });
  }

  // Convert and validate pagination parameters
  const pageNum = parseInt(page as string, 10);
  const pageSizeNum = parseInt(pageSize as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
    return res
      .status(400)
      .json({ message: "Page and pageSize must be positive integers." });
  }

  try {
    // Fetch the blog, including its related details
    const blog = await prisma.blog.findUnique({
      where: { bID: id, hidden: false },
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

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    // Fetch first-level comments
    const comments = await prisma.comment.findMany({
      where: {
        bID: id,
        pID: null, // Only fetch first-level comments
        hidden: false,
      },
      include: {
        user: true, // Include user details
        _count: {
          select: {
            upvoters: true,
            downvoters: true,
            subComments: true,
          },
        },
      },
    });

    // Sort comments based on the specified method
    comments.sort((a, b) => {
      switch (method) {
        case "controversial":
          return (
            b._count.upvoters +
            b._count.downvoters +
            b._count.subComments -
            (a._count.upvoters + a._count.downvoters + a._count.subComments)
          );
        case "popular":
          return b._count.upvoters - a._count.upvoters;
        default:
          return b.cID - a.cID; // Default: Sort by comment ID
      }
    });

    // Apply pagination manually
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedComments = comments.slice(
      startIndex,
      startIndex + pageSizeNum
    );

    // Send response
    res.status(200).json({ blog, paginatedComments });
  } catch (error) {
    console.error("Error retrieving blog post:", error);
    res
      .status(500)
      .json({
        message: "Internal server error while retrieving the blog post",
      });
  }
}
