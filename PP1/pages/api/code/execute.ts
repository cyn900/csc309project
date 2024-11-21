import { NextApiRequest, NextApiResponse } from "next";
import {
  executeInterpretedCode,
  executeCompiledCode,
} from "@/utils/codeExecutionHelper";

interface CodeExecutionRequestBody {
  code: string;
  input: string[];
  language: "javascript" | "python" | "java" | "c" | "cpp";
}

// Define types for function parameters and return values
type ExecutionResult = {
  stdout: string;
  stderr: string;
};

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

    let compiledLanguage = false;
    let command: string | undefined;

    // Determine the appropriate command based on the language
    switch (language) {
      case "javascript":
        command = `node -e "${code}"`; // Execute JavaScript code using Node.js
        break;
      case "python":
        command = `python3 -c "${code}"`; // Execute Python code
        break;
      case "java":
      case "c":
      case "cpp":
        compiledLanguage = true;
        break;
      default:
        return res.status(400).json({ error: "Unsupported language" });
    }

    // Execute the code and handle the response
    let output: ExecutionResult;

    if (compiledLanguage) {
      // Execute for compiled languages like Java, C, or C++
      output = await executeCompiledCode(language, code, input); // Assume this returns output as a string
    } else {
      // Execute for interpreted languages like JavaScript or Python
      if (!command) {
        return res.status(400).json({
          error: "Command generation failed for interpreted language",
        });
      }
      output = await executeInterpretedCode(language, code, input);
    }

    return res.status(200).json({ output }); // Return the output directly
  } catch (error: any) {
    // Handle errors and include stderr if available
    console.error("Error during code execution:", error);

    // Check if `stderr` exists in the error object
    const stderr = error.stderr || "No stderr available.";
    const message = error.message || "Failed to execute code.";

    return res.status(400).json({
      error: `Failed to execute code: ${message}`,
      output: {
        stderr: stderr,
      },
    });
  }
}
