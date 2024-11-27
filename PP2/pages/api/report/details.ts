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
    return res.status(401).json({ message: "Invalid or missing authorization token" });
  }

  const user = await prisma.user.findUnique({
    where: { email: userClaims.useremail },
  });

  console.log(user?.role);
  if (user?.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { type, id, page = "1", pageSize = "5" } = req.query;
  const pageNum = parseInt(page as string);
  const pageSizeNum = parseInt(pageSize as string);
  const skip = (pageNum - 1) * pageSizeNum;

  try {
    if (type === "blog") {
      const [reports, totalCount] = await prisma.$transaction([
        prisma.blogReport.findMany({
          where: { bID: Number(id) },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { bID: 'desc' },
          skip,
          take: pageSizeNum
        }),
        prisma.blogReport.count({
          where: { bID: Number(id) }
        })
      ]);
      
      return res.status(200).json({
        items: reports,
        totalCount,
        page: pageNum,
        pageSize: pageSizeNum
      });
    } else if (type === "comment") {
      const [reports, totalCount] = await prisma.$transaction([
        prisma.commentReport.findMany({
          where: { cID: Number(id) },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { cID: 'desc' },
          skip,
          take: pageSizeNum
        }),
        prisma.commentReport.count({
          where: { cID: Number(id) }
        })
      ]);

      return res.status(200).json({
        items: reports,
        totalCount,
        page: pageNum,
        pageSize: pageSizeNum
      });
    } else {
      return res.status(400).json({ message: "Invalid type parameter" });
    }
  } catch (error) {
    console.error("Error fetching report details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
} 