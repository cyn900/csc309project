import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { isLoggedIn } from "@/utils/auth";
import jwt from "jsonwebtoken";

interface TemplateQueryParams {
  title?: string;
  tags?: string | string[];
  fork?: string;
  explanation?: string;
  page?: string;
  pageSize?: string;
}

interface TemplateRequestBody {
  title: string;
  explanation: string;
  tags: string[];
  code: string;
  fork: boolean;
  tID?: number;
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    title,
    tags,
    fork,
    explanation,
    page = "1",
    pageSize = "5",
  } = req.query as Partial<TemplateQueryParams>;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
    return res
      .status(400)
      .json({ message: "Page and pageSize must be positive integers." });
  }

  const conditions: any[] = [];

  // Add fork condition
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
    conditions.push({ fork: false });
  }

  // Normalize tags to always be an array
  let normalizedTags: string[] = [];
  if (tags) {
    if (typeof tags === "string") {
      normalizedTags = [tags];
    } else if (Array.isArray(tags)) {
      normalizedTags = tags;
    } else {
      return res
        .status(400)
        .json({ message: "Tags must be an array or a single string." });
    }
  }

  // Build conditions based on tags
  if (normalizedTags.length > 0) {
    conditions.push({
      tags: {
        some: {
          value: {
            in: normalizedTags,
          },
        },
      },
    });
  }

  // Add title and explanation conditions
  if (title) {
    conditions.push({ title: { contains: title } });
  }
  if (explanation) {
    conditions.push({ explanation: { contains: explanation } });
  }

  try {
    const templates = await prisma.template.findMany({
      where: { AND: conditions },
      include: {
        tags: true,
        user: true,
        blogs: true,
      },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
    });

    res.status(200).json(templates);
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const handlePost = isLoggedIn(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const { title, explanation, tags, code, fork } =
      req.body as TemplateRequestBody;

    // Validate input
    if (typeof title !== "string" || typeof explanation !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid data type for title or explanation." });
    }
    if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
      return res
        .status(400)
        .json({ error: "Tags must be an array of strings." });
    }
    if (typeof code !== "string" || typeof fork !== "boolean") {
      return res
        .status(400)
        .json({ error: "Invalid data type for code or fork." });
    }

    try {
      const existingTemplate = await prisma.template.findUnique({
        where: { title },
      });

      if (existingTemplate) {
        return res
          .status(409)
          .json({ error: "Template with this title already exists." });
      }

      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ error: "Authorization token is required." });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
        useremail: string;
      };
      const user = await prisma.user.findUnique({
        where: { email: decoded.useremail },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const newTemplate = await prisma.template.create({
        data: {
          title,
          explanation,
          code,
          fork,
          uID: user.uID,
          tags: {
            connectOrCreate: tags.map((tag) => ({
              where: { value: tag },
              create: { value: tag },
            })),
          },
        },
      });

      res.status(201).json({
        message: "Template created successfully.",
        template: newTemplate,
      });
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

const handleDelete = isLoggedIn(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const tID = parseInt(req.query.tID as string, 10);

    if (isNaN(tID)) {
      return res.status(400).json({ error: "Invalid template ID." });
    }

    try {
      const template = await prisma.template.findUnique({ where: { tID } });

      if (!template) {
        return res.status(404).json({ error: "Template not found." });
      }

      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ error: "Authorization token is required." });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
        useremail: string;
      };
      const user = await prisma.user.findUnique({
        where: { email: decoded.useremail },
      });

      if (!user || template.uID !== user.uID) {
        return res
          .status(403)
          .json({ error: "You are not authorized to delete this template." });
      }

      await prisma.template.delete({ where: { tID } });
      res.status(200).json({ message: "Template deleted successfully." });
    } catch (error: any) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

const handleUpdate = isLoggedIn(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const { title, explanation, tags, code, fork, tID } =
      req.body as TemplateRequestBody;

    if (typeof tID !== "number") {
      return res.status(400).json({ error: "Template ID must be a number." });
    }

    try {
      const existingTemplate = await prisma.template.findUnique({
        where: { tID },
      });

      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found." });
      }

      await prisma.template.update({
        where: { tID },
        data: {
          title,
          explanation,
          code,
          fork,
          tags: {
            set: [],
            connectOrCreate: tags.map((tag) => ({
              where: { value: tag },
              create: { value: tag },
            })),
          },
        },
      });

      res.status(200).json({ message: "Template updated successfully." });
    } catch (error: any) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "POST") return handlePost(req, res);
  if (req.method === "DELETE") return handleDelete(req, res);
  if (req.method === "PATCH") return handleUpdate(req, res);

  res.setHeader("Allow", ["GET", "POST", "DELETE", "PATCH"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
