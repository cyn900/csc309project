import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";

interface UserClaims {
  useremail: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  const { id, page = '1', pageSize = '5' } = req.query;
  const commentId = parseInt(id as string, 10);
  const pageNumber = parseInt(page as string, 10);
  const pageSizeNumber = parseInt(pageSize as string, 10);


  try {
    // Get total count of replies
    const totalReplies = await prisma.comment.count({
      where: {
        pID: commentId,
        hidden: false,
      },
    });

    // Get paginated replies
    const replies = await prisma.comment.findMany({
      where: {
        pID: commentId,
        hidden: false,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: {
            upvoters: true,
            downvoters: true,
            subComments: true,
          },
        },
        upvoters: {
          select: { uID: true }
        },
        downvoters: {
          select: { uID: true }
        },
      },
      orderBy: {
        cID: 'desc'
      },
      skip: (pageNumber - 1) * pageSizeNumber,
      take: pageSizeNumber,
    });


    res.status(200).json({
      totalComments: totalReplies,
      totalPages: Math.ceil(totalReplies / pageSizeNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error("Error retrieving replies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
} 