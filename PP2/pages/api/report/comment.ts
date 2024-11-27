import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

interface UserClaims {
  useremail: string;
}

interface CommentReportRequestBody {
  cID: string;
  explanation: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!["POST", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  const userClaims = verifyToken(token) as UserClaims | null;

  if (!userClaims || !userClaims.useremail) {
    return res.status(401).json({ message: "Invalid or missing authorization token." });
  }

  const user = await prisma.user.findUnique({
    where: { email: userClaims.useremail },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (req.method === "POST") {
    const { cID, explanation } = req.body as CommentReportRequestBody;

    if (!cID || !explanation) {
      return res
        .status(400)
        .json({ message: "Comment ID and explanation are required." });
    }

    try {
      const comment = await prisma.comment.findUnique({
        where: { cID: parseInt(cID, 10) },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment post not found." });
      }

      const existingReport = await prisma.commentReport.findFirst({
        where: {
          cID: parseInt(cID, 10),
          uID: user.uID,
        },
      });

      if (existingReport) {
        return res
          .status(409)
          .json({ message: "You have already reported this comment." });
      }

      const newCommentReport = await prisma.commentReport.create({
        data: {
          explanation,
          comment: {
            connect: { cID: parseInt(cID, 10) },
          },
          user: {
            connect: { uID: user.uID },
          },
        },
      });

      return res.status(201).json({
        message: "Comment report created successfully",
        commentReport: newCommentReport,
      });
    } catch (error: any) {
      console.error("Error creating comment report:", error);
      return res.status(500).json({
        message: "Unable to create comment report, database error.",
      });
    }
  } else if (req.method === "DELETE") {
    const { cID } = req.query as { cID?: string };

    if (!cID) {
      return res
        .status(400)
        .json({ message: "Comment ID is required for deletion." });
    }

    try {
      const report = await prisma.commentReport.findFirst({
        where: {
          cID: parseInt(cID, 10),
          uID: user.uID,
        },
      });

      if (!report) {
        return res
          .status(404)
          .json({ message: "Comment report not found or not yours to delete." });
      }

      await prisma.commentReport.delete({
        where: { crID: report.crID },
      });

      return res.status(200).json({
        message: "Comment report deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting comment report:", error);
      return res.status(500).json({
        message: "Unable to delete comment report, database error.",
      });
    }
  }
}
