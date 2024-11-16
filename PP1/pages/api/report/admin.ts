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
  // Verify allowed methods
  if (!["GET", "PATCH"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).end("Method Not Allowed");
  }

  // Authenticate and authorize user
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

  const user = await prisma.user.findUnique({
    where: { email: userClaims.useremail },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  // Process GET requests for data retrieval with pagination
  if (req.method === "GET") {
    const {
      type,
      page = "1",
      pageSize = "5",
    } = req.query as {
      type?: string;
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

    try {
      let data;

      if (type === "blog") {
        data = await prisma.blog.findMany({
          orderBy: { blogReports: { _count: "desc" } },
          skip,
          take: pageSizeNum,
          include: { _count: { select: { blogReports: true } } },
        });
      } else if (type === "comment") {
        data = await prisma.comment.findMany({
          orderBy: { commentReports: { _count: "desc" } },
          skip,
          take: pageSizeNum,
          include: { _count: { select: { commentReports: true } } },
        });
      } else {
        return res.status(400).json({ message: "Invalid type parameter" });
      }

      return res.status(200).json(data);
    } catch (error: any) {
      console.error("Error retrieving data:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Process PATCH requests for data modification
  else if (req.method === "PATCH") {
    const { id, type, hidden } = req.body as {
      id: number;
      type: "blog" | "comment";
      hidden: boolean;
    };

    if (typeof hidden !== "boolean") {
      return res
        .status(400)
        .json({ message: "Hidden must be defined as true or false." });
    }

    try {
      if (type === "blog") {
        const blogExists = await prisma.blog.findUnique({
          where: { bID: id },
          select: { bID: true },
        });

        if (!blogExists) {
          return res.status(404).json({ message: "Blog not found" });
        }

        const updated = await prisma.blog.update({
          where: { bID: id },
          data: { hidden },
        });
        return res.status(200).json(updated);
      } else if (type === "comment") {
        const commentExists = await prisma.comment.findUnique({
          where: { cID: id },
          select: { cID: true },
        });

        if (!commentExists) {
          return res.status(404).json({ message: "Comment not found" });
        }

        const updated = await prisma.comment.update({
          where: { cID: id },
          data: { hidden },
        });
        return res.status(200).json(updated);
      } else {
        return res
          .status(400)
          .json({ message: 'Type must be "blog" or "comment".' });
      }
    } catch (error: any) {
      console.error("Error updating data:", error);
      return res
        .status(500)
        .json({ message: "Internal server error while updating data" });
    }
  }
}
