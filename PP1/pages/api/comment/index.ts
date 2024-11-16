import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";

interface CommentQueryParams {
  cID?: string;
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
    return res.status(405).end("Method Not Allowed");
  }

  const {
    cID,
    method,
    page = "1",
    pageSize = "5",
  } = req.query as Partial<CommentQueryParams>;

  if (!cID) {
    return res.status(400).json({ message: "Comment ID is required." });
  }

  const id = parseInt(cID, 10);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ message: "Comment ID must be a valid integer." });
  }

  if (isNaN(id)) {
    return res
      .status(400)
      .json({ message: "Comment ID must be a valid integer." });
  }

  // Convert and validate pagination parameters
  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
    return res
      .status(400)
      .json({ message: "Page and pageSize must be positive integers." });
  }

  try {
    // Fetch comments where `pID` matches the provided `id` and are not hidden
    const comments = await prisma.comment.findMany({
      where: {
        pID: id,
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

    if (comments.length === 0) {
      return res.status(404).json({
        message: "No comments found for the provided parent comment ID.",
      });
    }

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

    // Manually apply pagination
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedComments = comments.slice(
      startIndex,
      startIndex + pageSizeNum
    );

    res.status(200).json(paginatedComments);
  } catch (error: any) {
    console.error("Error retrieving comments:", error);
    res.status(500).json({
      message: "Internal server error while retrieving the comments.",
    });
  }
}
