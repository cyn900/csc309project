import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

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

  const { id, page = '1', limit = '5', expand } = req.query;
  const commentId = parseInt(id as string, 10);
  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  
  // Get user information from token if available
  const authorizationHeader = req.headers.authorization;
  let userId: number | null = null;

  if (authorizationHeader) {
    const userClaims = verifyToken(authorizationHeader) as UserClaims | null;
    if (userClaims?.useremail) {
      const user = await prisma.user.findUnique({
        where: { email: userClaims.useremail },
      });
      if (user) {
        userId = user.uID;
      }
    }
  }

  if (isNaN(commentId)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }

  try {
    // Add total count query for pagination
    const totalComments = await prisma.comment.count({
      where: {
        pID: commentId,
        hidden: false
      }
    });

    const comment = await prisma.comment.findUnique({
      where: { cID: commentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        blog: {
          select: {
            bID: true,
          }
        },
        _count: {
          select: {
            upvoters: true,
            downvoters: true,
            subComments: true,
          },
        },
        ...(req.query.expand === 'true' ? {
          subComments: {
            where: { hidden: false },
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
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
          }
        } : {}),
        upvoters: {
          select: { uID: true },
        },
        downvoters: {
          select: { uID: true },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Transform the data to include hasUpvoted and hasDownvoted
    const transformedComment = {
      ...comment,
      hasUpvoted: userId ? comment.upvoters?.length > 0 : false,
      hasDownvoted: userId ? comment.downvoters?.length > 0 : false,
      subComments: comment.subComments?.map((subComment: any) => ({
        ...subComment,
        hasUpvoted: userId ? subComment.upvoters?.length > 0 : false,
        hasDownvoted: userId ? subComment.downvoters?.length > 0 : false,
        upvoters: undefined,
        downvoters: undefined,
      })),
    };

    // Remove the upvoters and downvoters arrays from the main comment
    delete (transformedComment as any).upvoters;
    delete (transformedComment as any).downvoters;

    // If this is a request for replies (expand=true), wrap the response
    if (req.query.expand === 'true') {
      return res.status(200).json({
        comments: transformedComment.subComments || [],
        totalComments,
        totalPages: Math.ceil(totalComments / limitNumber)
      });
    }

    res.status(200).json(transformedComment);
  } catch (error) {
    console.error("Error retrieving comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
} 