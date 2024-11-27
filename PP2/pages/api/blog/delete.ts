import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res
      .status(401)
      .json({ message: "Invalid or missing authorization token" });
  }

  const userClaims = verifyToken(authorizationHeader);
  if (!userClaims || !userClaims.useremail) {
    return res
      .status(401)
      .json({ message: "Invalid or missing authorization token" });
  }

  // Retrieve user ID using the email from the token
  const user = await prisma.user.findUnique({
    where: { email: userClaims.useremail },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Parse blogId from query
  const { bID } = req.query;

  if (!bID || Array.isArray(bID) || isNaN(parseInt(bID, 10))) {
    return res.status(400).json({ message: "Invalid blog ID provided." });
  }

  const blog = await prisma.blog.findUnique({
    where: { bID: parseInt(bID, 10) },
  });

  if (!blog) {
    return res.status(404).json({ message: "Blog post not found" });
  }

  if (blog.uID !== user.uID) {
    return res
      .status(403)
      .json({ message: "You do not have permission to delete this blog post" });
  }

  try {
    await prisma.blog.delete({
      where: { bID: parseInt(bID, 10) },
    });

    res.status(200).json({ message: "Delete successfully" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res
      .status(500)
      .json({ message: "Unable to delete blog post, database error." });
  }
}
