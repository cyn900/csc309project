import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

interface UserClaims {
  useremail: string;
}

interface BlogReportRequestBody {
  bID: string;
  explanation: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!["POST", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authorization token is required." });
  }

  const userClaims = verifyToken(token) as UserClaims | null;

  if (!userClaims || !userClaims.useremail) {
    return res
      .status(401)
      .json({ message: "Invalid or missing authorization token." });
  }

  const user = await prisma.user.findUnique({
    where: { email: userClaims.useremail },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (req.method === "POST") {
    const { bID, explanation } = req.body as BlogReportRequestBody;

    if (!bID || !explanation) {
      return res
        .status(400)
        .json({ message: "Blog ID and explanation are required." });
    }

    try {
      const blog = await prisma.blog.findUnique({
        where: { bID: parseInt(bID, 10) },
      });

      if (!blog) {
        return res.status(404).json({ message: "Blog post not found." });
      }

      const existingReport = await prisma.blogReport.findFirst({
        where: {
          bID: parseInt(bID, 10),
          uID: user.uID,
        },
      });

      if (existingReport) {
        return res
          .status(409)
          .json({ message: "You have already reported this blog." });
      }

      const newBlogReport = await prisma.blogReport.create({
        data: {
          explanation,
          blog: {
            connect: { bID: parseInt(bID, 10) },
          },
          user: {
            connect: { uID: user.uID },
          },
        },
      });

      return res.status(201).json({
        message: "Blog report created successfully",
        blogReport: newBlogReport,
      });
    } catch (error: any) {
      console.error("Error creating blog report:", error);
      return res.status(500).json({
        message: "Unable to create blog report, database error.",
      });
    }
  } else if (req.method === "DELETE") {
    const { bID } = req.query as { bID?: string };

    if (!bID) {
      return res
        .status(400)
        .json({ message: "Blog ID is required for deletion." });
    }

    try {
      const report = await prisma.blogReport.findFirst({
        where: {
          bID: parseInt(bID, 10),
          uID: user.uID,
        },
      });

      if (!report) {
        return res.status(404).json({
          message: "Blog report not found or not yours to delete.",
        });
      }

      await prisma.blogReport.delete({
        where: { brID: report.brID },
      });

      return res
        .status(200)
        .json({ message: "Blog report deleted successfully." });
    } catch (error: any) {
      console.error("Error deleting blog report:", error);
      return res.status(500).json({
        message: "Unable to delete blog report, database error.",
      });
    }
  }
}
