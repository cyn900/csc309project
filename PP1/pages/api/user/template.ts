import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

interface UserClaims {
  useremail: string;
}

interface QueryParams {
  page?: string;
  pageSize?: string;
}

const handler = async (
  req: NextApiRequest & { query: QueryParams },
  res: NextApiResponse
): Promise<void> => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end("Method Not Allowed");
    return; // Explicitly return after handling the response
  }

  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({ message: "Authorization token is required" });
    return; // Explicitly return after handling the response
  }

  const userClaims = verifyToken(token) as UserClaims | null;
  if (!userClaims) {
    res.status(401).json({ message: "Invalid or missing authorization token" });
    return; // Explicitly return after handling the response
  }

  const user = await prisma.user.findUnique({
    where: { email: userClaims.useremail },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return; // Explicitly return after handling the response
  }

  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "5", 10);

  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    res
      .status(400)
      .json({ message: "Page and pageSize must be positive integers." });
    return; // Explicitly return after handling the response
  }

  const skip = (page - 1) * pageSize;

  try {
    const templates = await prisma.template.findMany({
      where: {
        uID: user.uID,
      },
      include: {
        tags: true,
      },
      orderBy: {
        tID: "desc",  // Order by tID in descending order
      },
      skip,
      take: pageSize,
    });

    const totalCount = await prisma.template.count({
      where: { uID: user.uID },
    });

    res.status(200).json({ templates, totalCount, page, pageSize });
  } catch (error) {
    console.error("Error retrieving templates:", error);
    res
      .status(500)
      .json({ message: "Internal server error while retrieving templates" });
  }
};

export default handler;
