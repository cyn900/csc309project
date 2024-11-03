import prisma from "@/utils/db";
import { isLoggedIn } from "../../../utils/auth";
import jwt from "jsonwebtoken";

const handleGet = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    title = "",
    tags = [],
    explanation = "",
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Ensure `tags` is an array
  const tagArray = Array.isArray(tags) ? tags : [tags];

  // Build search conditions
  const conditions = [];

  if (title) {
    conditions.push({ title: { contains: title } });
  }

  if (tagArray.length) {
    conditions.push({
      tags: {
        some: {
          value: {
            in: tagArray,
          },
        },
      },
    });
  }

  if (explanation) {
    conditions.push({
      explanation: { contains: explanation },
    });
  }

  const searchConditions = conditions.length ? { AND: conditions } : {};

  try {
    const templates = await prisma.template.findMany({
      skip: offset,
      take: parseInt(limit),
      where: searchConditions,
    });

    const totalTemplates = await prisma.template.count({
      where: searchConditions,
    });

    res.status(200).json({
      templates,
      totalPages: Math.ceil(totalTemplates / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching templates" });
  }
};

const handlePost = isLoggedIn(async (req, res) => {
  const { title, explanation, tags, code, fork } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  // Check if a template with the same title already exists
  const existingTemplate = await prisma.template.findUnique({
    where: { title },
  });

  if (existingTemplate) {
    return res
      .status(400)
      .json({ error: "Template with this title already exists" });
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const email = decoded.useremail;

    if (!email) {
      return res.status(400).json({ error: "Invalid user" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log(user);

    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const newTemplate = await prisma.template.create({
      data: {
        title,
        explanation,
        code,
        fork: fork || false,
        uID: user.uID,
        ...(tags && {
          tags: {
            connectOrCreate: tags.map((tag) => ({
              where: { value: tag },
              create: { value: tag },
            })),
          },
        }),
      },
    });

    res
      .status(201)
      .json({ message: "Template created", template: newTemplate });
  } catch (error) {
    console.error("Error creating template:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the template" });
  }
});

const handleDelete = isLoggedIn(async (req, res) => {
  const { tID } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!tID) {
    return res.status(400).json({ error: "Template ID is required" });
  }

  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const email = decoded.useremail;

    if (!email) {
      return res.status(400).json({ error: "Invalid user" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const template = await prisma.template.findUnique({
      where: { tID },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    await prisma.template.delete({
      where: { tID },
    });

    res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the template" });
  }
});

const handleUpdate = isLoggedIn(async (req, res) => {
  const { title, explanation, tags, code, fork, tID } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!tID) {
    return res.status(400).json({ error: "Template ID (tID) is required" });
  }

  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const email = decoded.useremail;

    if (!email) {
      return res.status(400).json({ error: "Invalid user" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const existingTemplate = await prisma.template.findUnique({
      where: { tID: parseInt(tID) },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    const updatedTemplate = await prisma.template.update({
      where: { tID: parseInt(tID) },
      data: {
        title,
        explanation,
        code,
        fork,
        uID: user.uID,
        ...(tags && {
          tags: {
            connectOrCreate: tags.map((tag) => ({
              where: { value: tag },
              create: { value: tag },
            })),
          },
        }),
      },
    });

    res.status(200).json({
      message: "Template updated successfully",
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the template" });
  }
});

export default function handler(req, res) {
  if (req.method === "GET") {
    handleGet(req, res);
  } else if (req.method === "POST") {
    handlePost(req, res);
  } else if (req.method === "DELETE") {
    handleDelete(req, res);
  } else if (req.method === "PUT") {
    handleUpdate(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
