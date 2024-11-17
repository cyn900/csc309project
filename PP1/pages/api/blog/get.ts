import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { bID } = req.query;
  const token = req.headers.authorization;

  // if (!token) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }

  try {
    const blog = await prisma.blog.findUnique({
      where: { bID: parseInt(bID as string, 10) },
      include: {
        tags: true,
        templates: true,
        user: {
          select: {
            uID: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found in get ts" });
    }

    res.status(200).json({ blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
} 