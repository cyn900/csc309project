import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Define types for function parameters and return values
type ExecutionResult = {
  stdout: string;
  stderr: string;
};

type Language =
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
 * Executes interpreted code for languages like JavaScript, Python, etc., using Docker.
 * @param language Programming language.
 * @param code Code to execute.
 * @param inputs Input to pass to the program.
 * @param timeout Maximum execution time in milliseconds.
 * @returns Promise resolving to the output and error.
 */
const executeInterpretedCode = (
  language: Language,
  code: string | string[],
  inputs: string[] = [],
  timeout: number = 10000
): Promise<ExecutionResult> => {
  return new Promise((resolve, reject) => {
    const tempDir = resolveTempDir();
    ensureDirectoryExists(tempDir);

    const extensionMap: { [key in Language]?: string } = {
      javascript: "js",
      python: "py",
      ruby: "rb",
      bash: "sh",
      r: "r",
      matlab: "m",
      haskell: "hs",
      typescript: "ts",
    };
    const extension = extensionMap[language];

    if (!extension) {
      return reject(
        new Error(`Unsupported language for interpreted code: ${language}`)
      );
    }

    const filePath = path.join(tempDir, `main.${extension}`);
    const codeContent = Array.isArray(code) ? code.join("\n") : code;
    fs.writeFileSync(filePath, codeContent);

    // Write inputs to input.txt
    const inputFilePath = path.join(tempDir, "input.txt");
    if (inputs.length > 0) {
      fs.writeFileSync(inputFilePath, inputs.join("\n"));
    } else {
      // Ensure input.txt exists even if no inputs are provided
      fs.writeFileSync(inputFilePath, "");
    }

    let command: string;

    if (language === "typescript") {
      // Compile TypeScript to JavaScript
      command = [
        "docker",
        "run",
        "--rm",
        "--name",
        `code-runner-${language}-${uuidv4()}`,
        "-v",
        `${tempDir}:/app`,
        `${language}-image`,
        `/bin/sh -c "tsc /app/main.ts --outDir /app && node /app/main.js < /app/input.txt"`,
      ].join(" ");
    } else {
      command = [
        "docker",
        "run",
        "--rm",
        "--name",
        `code-runner-${language}-${uuidv4()}`,
        "-v",
        `${tempDir}:/app`,
        `${language}-image`,
        `/bin/sh -c '${
          language === "python"
            ? "python3 -u"
            : language === "javascript"
            ? "node"
            : language === "ruby"
            ? "ruby"
            : language === "bash"
            ? "bash"
            : language === "r"
            ? "Rscript"
            : language === "matlab"
            ? "matlab -nodisplay -nosplash -r"
            : language === "haskell"
            ? "runhaskell"
            : ""
        } /app/main.${extension} < /app/input.txt'`,
      ].join(" ");
    }

    console.log(`Executing Docker command: ${command}`);

    exec(command, { timeout }, (error, stdout, stderr) => {
      if (error) {
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
 * Executes compiled code for languages like Java, C, C++, Go, etc., using Docker.
 * @param language Programming language.
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

    const extensionMap: { [key in Language]?: string } = {
      c: "c",
      cpp: "cpp",
      java: "java",
      csharp: "cs",
      go: "go",
      rust: "rs",
    };
    const extension = extensionMap[language];

    if (!extension) {
      return reject(
        new Error(`Unsupported language for compiled code: ${language}`)
      );
    }

    const filePath = path.join(tempDir, `Main.${extension}`);

    // Write the code to the Main.{extension} file
    fs.writeFileSync(filePath, code);

    // Write inputs to input.txt
    const inputFilePath = path.join(tempDir, "input.txt");
    if (inputs.length > 0) {
      fs.writeFileSync(inputFilePath, inputs.join("\n"));
    } else {
      // Ensure input.txt exists even if no inputs are provided
      fs.writeFileSync(inputFilePath, "");
    }

    const compileCommand =
      language === "java"
        ? `javac /app/Main.${extension}`
        : language === "c"
        ? `gcc -o /app/program /app/Main.${extension}`
        : language === "cpp"
        ? `g++ -o /app/program /app/Main.${extension} -lstdc++`
        : language === "csharp"
        ? `mcs -out:/app/Main.exe /app/Main.${extension}`
        : language === "go"
        ? `go build -o /app/program /app/Main.${extension}`
        : language === "rust"
        ? `rustc -o /app/program /app/Main.${extension}`
        : null;

    const executeCommand =
      language === "java"
        ? `java -cp /app Main < /app/input.txt`
        : language === "c" ||
          language === "cpp" ||
          language === "go" ||
          language === "rust"
        ? `/app/program < /app/input.txt`
        : language === "csharp"
        ? `mono /app/Main.exe < /app/input.txt`
        : null;

    if (!compileCommand || !executeCommand) {
      return reject(
        new Error(`Unsupported language for execution: ${language}`)
      );
    }

    const compileAndRunCommand = [
      "docker",
      "run",
      "--rm",
      "--cap-drop=ALL",
      "-v",
      `${tempDir}:/app`,
      `${language}-image`,
      `/bin/sh -c '${compileCommand} && ${executeCommand}'`,
    ].join(" ");

    console.log(`Executing Docker command: ${compileAndRunCommand}`);

    exec(compileAndRunCommand, { timeout }, (error, stdout, stderr) => {
      if (error) {
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
