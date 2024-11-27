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

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  const userClaims = verifyToken(token) as UserClaims | null;

  if (!userClaims || !userClaims.useremail) {
    return res
      .status(401)
      .json({ message: "Invalid or missing authorization token" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: userClaims.useremail },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Pagination parameters
    const { page = "1", pageSize = "5" } = req.query as {
      page?: string;
      pageSize?: string;
    };

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    if (
      isNaN(pageNum) ||
      pageNum < 1 ||
      isNaN(pageSizeNum) ||
      pageSizeNum < 1
    ) {
      return res
        .status(400)
        .json({ message: "Page and pageSize must be positive integers." });
    }

    const skip = (pageNum - 1) * pageSizeNum;

    const blogs = await prisma.blog.findMany({
      where: {
        uID: user.uID, // Assuming `uID` is the field linking blogs to their creator
      },
      include: {
        tags: true, // Include tags for each blog
        templates: true, // Include templates for each blog
        _count: {
          select: {
            upvoters: true,
            downvoters: true,
            comments: true,
          },
        },
      },
      orderBy: {
        bID: "desc", // new blog show first
      },
      skip: skip,
      take: pageSizeNum,
    });

    // Return total count for client-side pagination handling
    const totalCount = await prisma.blog.count({
      where: { uID: user.uID },
    });

    res
      .status(200)
      .json({ blogs, totalCount, page: pageNum, pageSize: pageSizeNum });
  } catch (error: any) {
    console.error("Error retrieving blogs:", error);
    res
      .status(500)
      .json({ message: "Internal server error while retrieving blogs" });
  }
}
