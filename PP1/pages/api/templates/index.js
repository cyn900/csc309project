import prisma from "@/utils/db";
import { isLoggedIn } from "../../../utils/auth";
import jwt from "jsonwebtoken";

const handleGet = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let { title, tags, fork, explanation, page = 1, pageSize = 5 } = req.query;

  // Convert and validate pagination parameters
  page = parseInt(page, 10);
  pageSize = parseInt(pageSize, 10);
  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    return res
      .status(400)
      .json({ message: "Page and pageSize must be positive integers." });
  }

  // Validate data type for title
  if (title && typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Incorrect data type provided for title." });
  }

  const conditions = [];

  // Add fork condition dynamically
  if (typeof fork !== "undefined") {
    if (fork === "true") {
      conditions.push({ fork: true });
    } else if (fork === "false") {
      conditions.push({ fork: false });
    } else {
      return res
        .status(400)
        .json({ message: "Fork must be either 'true' or 'false'." });
    }
  } else {
    // Default to filtering out forked templates
    conditions.push({ fork: false });
  }

  // Normalize tags to always be an array
  if (tags) {
    tags = typeof tags === "string" ? [tags] : tags;
    if (!Array.isArray(tags)) {
      return res
        .status(400)
        .json({ message: "Tags must be an array or a single string." });
    }
  }

  // Parse JSON if tags are passed as a JSON string
  try {
    if (typeof tags === "string") tags = JSON.parse(tags);
  } catch (err) {
    return res.status(400).json({ message: "Invalid JSON format for tags." });
  }

  // Build conditions based on tags
  if (tags && tags.length) {
    conditions.push({
      tags: {
        some: {
          value: {
            in: tags,
          },
        },
      },
    });
  }

  // Add title condition
  if (title) {
    conditions.push({ title: { contains: title } });
  }

  // Add explanation condition
  if (explanation) {
    conditions.push({ explanation: { contains: explanation } });
  }

  try {
    console.log("Conditions:", JSON.stringify(conditions, null, 2));

    const paginatedTemplates = await prisma.template.findMany({
      where: { AND: conditions },
      include: {
        tags: true,
        user: true,
        blogs: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    res.status(200).json(paginatedTemplates);
  } catch (error) {
    console.error("Search query failed:", {
      error: error.message,
      stack: error.stack,
      conditions,
    });
    res
      .status(500)
      .json({ message: "Internal server error while executing search" });
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

  if (typeof title !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid type for title; expected 'string'." });
  }
  if (typeof explanation !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid type for explanation; expected 'string'." });
  }
  if (
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === "string") ||
    tags.length > 10
  ) {
    return res.status(400).json({
      error:
        "Invalid type for tags; expected an array of strings and no more than 10 tags.",
    });
  }
  if (typeof code !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid type for code; expected 'string'." });
  }
  if (typeof fork !== "boolean") {
    return res
      .status(400)
      .json({ error: "Invalid type for fork; expected 'boolean'." });
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
  const token = req.headers.authorization?.split(" ")[1];

  // Extracting tID from the query string and converting it to an integer
  const tID = parseInt(req.query.tID, 10);

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

    // Attempt to find the template with the provided tID
    const template = await prisma.template.findUnique({
      where: { tID },
    });

    // If no template found, return an error
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (template.uID !== user.uID) {
      return res.status(403).json({
        error: "You do not have permission to delete this template",
      });
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

  // Type validations
  if (typeof tID !== "number") {
    return res.status(400).json({
      error: "Invalid type for Template ID (tID); expected 'number'.",
    });
  }
  if (typeof title !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid type for title; expected 'string'." });
  }
  if (typeof explanation !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid type for explanation; expected 'string'." });
  }
  if (
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === "string") ||
    tags.length > 10
  ) {
    return res.status(400).json({
      error:
        "Invalid type for tags; expected an array of strings and no more than 10 tags.",
    });
  }
  if (typeof code !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid type for code; expected 'string'." });
  }
  if (typeof fork !== "boolean") {
    return res
      .status(400)
      .json({ error: "Invalid type for fork; expected 'boolean'." });
  }

  const token = req.headers.authorization?.split(" ")[1];

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

    const existingTemplate = await prisma.template.findUnique({
      where: { tID },
    });

    // Check if the template exists before checking ownership
    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check if the logged-in user has the permission to update the template
    if (existingTemplate.uID !== user.uID) {
      return res.status(403).json({
        error: "You do not have permission to update this template",
      });
    }

    // Check if another template with the same title exists
    const duplicateTitle = await prisma.template.findFirst({
      where: {
        title: title,
        tID: { not: tID }, // Exclude the current template from the search
      },
    });

    if (duplicateTitle) {
      return res
        .status(409)
        .json({ error: "Another template with the same title already exists" });
    }

    // Process tags and templates
    const tagConnectOrCreate = tags.map((tag) => ({
      where: { value: tag },
      create: { value: tag },
    }));

    // Update the template, using existing values where new ones are not provided
    const updatedTemplate = await prisma.template.update({
      where: { tID },
      data: {
        title: title ?? existingTemplate.title,
        explanation: explanation ?? existingTemplate.explanation,
        code: code ?? existingTemplate.code,
        fork: fork ?? existingTemplate.fork,
        uID: user.uID, // Assuming uID should always be set to the current user's ID
        tags: {
          set: [], // Clear existing tags first
          connectOrCreate: tagConnectOrCreate,
        },
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
  } else if (req.method === "PATCH") {
    handleUpdate(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE", "PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
