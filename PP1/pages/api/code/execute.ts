import { NextApiRequest, NextApiResponse } from "next";
import {
  executeInterpretedCode,
  executeCompiledCode,
} from "@/utils/codeExecutionHelper";

interface CodeExecutionRequestBody {
  code: string;
  input: string[];
  language:
    | "javascript"
    | "python"
    | "java"
    | "c"
    | "cpp"
    | "csharp"
    | "go"
    | "typescript"
    | "ruby"
    | "rust"
    | "bash"
    | "matlab"
    | "r"
    | "haskell";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { code, input, language } = req.body as CodeExecutionRequestBody;

    if (!code || !language) {
      return res
        .status(400)
        .json({ error: "Code and language are required fields" });
    }

    const stdin = input.join("\n"); // Combine inputs into a single string

    let output;

    if (
      [
        "javascript",
        "python",
        "typescript",
        "ruby",
        "bash",
        "r",
        "matlab",
        "haskell",
      ].includes(language)
    ) {
      output = await executeInterpretedCode(language, code, [stdin]);
    } else if (
      ["java", "c", "cpp", "csharp", "go", "rust"].includes(language)
    ) {
      output = await executeCompiledCode(language, code, [stdin]);
    } else {
      return res.status(400).json({ error: "Unsupported language" });
    }

    return res.status(200).json({ output });
  } catch (error: any) {
    console.error("Error during code execution:", error);

    return res.status(400).json({
      error: `Failed to execute code: ${error.message || "Unknown error"}`,
      output: {
        stderr: error.stderr || "No stderr available",
        message: error.message || "No message available",
      },
    });
  }
}
