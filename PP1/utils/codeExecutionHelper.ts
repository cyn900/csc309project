import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Define types for function parameters and return values
type ExecutionResult = {
  stdout: string;
  stderr: string;
};

type Language = "javascript" | "python" | "java" | "c" | "cpp";

/**
 * Ensures a directory exists, creating it if necessary.
 * @param dirPath Path of the directory.
 */
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Resolves the `temp` directory relative to the project root.
 */
const resolveTempDir = () => {
  return path.join(process.cwd(), "pages/api/code/temp");
};

/**
 * Executes interpreted code for languages like JavaScript or Python using Docker.
 * @param language Programming language (e.g., javascript, python).
 * @param code Code to execute.
 * @param inputs Input to pass to the program.
 * @param timeout Maximum execution time in milliseconds.
 * @returns Promise resolving to the output and error.
 */
const executeInterpretedCode = (
  language: string,
  code: string | string[],
  inputs: string[] = [],
  timeout: number = 10000
): Promise<ExecutionResult> => {
  return new Promise((resolve, reject) => {
    const normalizedLanguage = (() => {
      if (language.startsWith("python3")) return "python";
      if (language.startsWith("node") || language.startsWith("javascript"))
        return "javascript";
      return language;
    })();

    const containerName = `code-runner-${normalizedLanguage}-${uuidv4()}`;
    const tempDir = path.join(process.cwd(), "pages/api/code/temp");
    ensureDirectoryExists(tempDir);

    const extension =
      normalizedLanguage === "javascript" ? "js" : normalizedLanguage;
    const filePath = path.join(tempDir, `main.${extension}`);

    // Validate the `code` parameter
    if (!code || (Array.isArray(code) && code.length === 0)) {
      return reject({
        stdout: "",
        stderr: "",
        message: "No code provided for execution.",
      });
    }

    // Write the code to the file
    const codeContent = Array.isArray(code) ? code.join("\n") : String(code);
    fs.writeFileSync(filePath, codeContent);

    // Log the file content for verification
    console.log("Code to be executed:");
    console.log(codeContent);
    console.log(`File created at: ${filePath}`);
    console.log("File content:");
    console.log(fs.readFileSync(filePath, "utf-8"));

    // Docker command to execute the code
    const command = [
      "docker",
      "run",
      "--rm",
      "--name",
      containerName,
      "-v",
      `${tempDir}:/app`, // Mount the temp directory
      `${normalizedLanguage}-image`,
      `${
        normalizedLanguage === "python"
          ? "python -u"
          : normalizedLanguage === "javascript"
          ? "node"
          : normalizedLanguage
      } /app/main.${extension}`,
    ].join(" ");

    console.log(`Executing Docker command: ${command}`);

    exec(command, { timeout }, (error, stdout, stderr) => {
      console.log("Command executed:", command);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      // Do not delete the file; just log its path for verification
      console.log(`Temporary file retained for debugging: ${filePath}`);

      if (error) {
        console.error("Execution error:", error.message);
        return reject({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          message: `Execution error: ${error.message}`,
        });
      }

      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
};

/**
 * Executes compiled code for languages like Java, C, or C++ using Docker.
 * @param language Programming language (e.g., java, c, cpp).
 * @param code Source code to compile and execute.
 * @param inputs Input to pass to the program.
 * @param timeout Maximum execution time in milliseconds.
 * @returns Promise resolving to the output and error.
 */
const executeCompiledCode = (
  language: Language,
  code: string,
  inputs: string[] = [],
  timeout: number = 30000
): Promise<ExecutionResult> => {
  return new Promise((resolve, reject) => {
    const tempDir = resolveTempDir();
    ensureDirectoryExists(tempDir);

    // Determine file extension based on language
    const extensionMap: { [key in Language]: string } = {
      c: "c",
      cpp: "cpp",
      java: "java",
      javascript: "js",
      python: "py",
    };
    const extension = extensionMap[language];

    const fileName = `program-${uuidv4()}`;
    const filePath = path.join(tempDir, `${fileName}.${extension}`);

    // Write the source code to a file
    fs.writeFileSync(filePath, Array.isArray(code) ? code.join("\n") : code);

    const compileCommand =
      language === "java"
        ? `javac /app/${fileName}.java`
        : language === "c" || language === "cpp"
        ? `gcc -o /app/program /app/${fileName}.${extension}`
        : null;

    const executeCommand =
      language === "java"
        ? `java -cp /app ${fileName}`
        : language === "c" || language === "cpp"
        ? `/app/program`
        : null;

    if (!compileCommand || !executeCommand) {
      return reject(new Error(`Unsupported language: ${language}`));
    }

    // Compile and execute the code
    const compileAndRunCommand = [
      "docker",
      "run",
      "--rm",
      "--read-only",
      "--cap-drop=ALL",
      "-v",
      `${tempDir}:/app`,
      `${language}-image`,
      `/bin/sh -c "${compileCommand} && ${executeCommand}"`,
    ].join(" ");

    console.log(`Executing Docker command: ${compileAndRunCommand}`);

    exec(compileAndRunCommand, { timeout }, (error, stdout, stderr) => {
      console.log("Command executed:", compileAndRunCommand);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      // Do not delete the file; just log its path for verification
      console.log(`Temporary file retained for debugging: ${filePath}`);

      if (error) {
        console.error("Execution error:", error.message);
        return reject({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          message: `Execution error: ${error.message}`,
        });
      }

      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
};

export { executeInterpretedCode, executeCompiledCode };
