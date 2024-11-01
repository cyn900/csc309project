import prisma from "@/utils/db";

const handleGet = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const searchConditions = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          {
            tags: { some: { name: { contains: search, mode: "insensitive" } } },
          },
          { explanation: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  try {
    // Fetch paginated templates with search filters if provided
    const templates = await prisma.template.findMany({
      skip: offset,
      take: parseInt(limit),
      where: searchConditions,
    });

    // Count total templates based on search
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

const handlePost = async (req, res) => {
  const { title, explanation, tags, code, fork, uID } = req.body;

  if (!title || !uID) {
    return res
      .status(400)
      .json({ error: "Title and user ID (uID) are required" });
  }

  try {
    const newTemplate = await prisma.template.create({
      data: {
        title,
        explanation,
        code,
        fork: fork || false,
        uID,
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
};

const handleDelete = async (req, res) => {
  const { tID, uID } = req.body;

  if (!tID || !uID) {
    return res
      .status(400)
      .json({ error: "Template ID and user ID are required" });
  }

  try {
    const template = await prisma.template.findUnique({
      where: { tID },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (template.uID !== uID) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this template" });
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
};

async function handleUpdate(req, res) {
  const { title, explanation, tags, code, fork, uID, tID } = req.body;

  if (!tID) {
    return res.status(400).json({ error: "Template ID (tID) is required" });
  }

  try {
    // Find the template by tID
    const existingTemplate = await prisma.template.findUnique({
      where: { tID: parseInt(tID) },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Update the template
    const updatedTemplate = await prisma.template.update({
      where: { tID: parseInt(tID) },
      data: {
        title,
        explanation,
        code,
        fork,
        uID,
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
}

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
