import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  const { id } = req.query;
  const commentId = parseInt(id as string, 10);

  if (isNaN(commentId)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { cID: commentId },
      include: {
        user: true,
        _count: {
          select: {
            upvoters: true,
            downvoters: true,
            subComments: true,
          },
        },
        subComments: {
          where: { hidden: false },
          include: {
            user: true,
            _count: {
              select: {
                upvoters: true,
                downvoters: true,
                subComments: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json(comment);
  } catch (error) {
    console.error("Error retrieving comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
} 