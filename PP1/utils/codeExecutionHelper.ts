import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

type ExecutionResult = {
  stdout: string;
  stderr: string;
  message?: string;
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

const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const resolveTempDir = (): string => {
  return path.join(process.cwd(), "pages/api/code/temp");
};

const executeCommandWithTimeout = (
  command: string,
  timeout: number,
  stdin: string = ""
): Promise<ExecutionResult> => {
  return new Promise((resolve, reject) => {
    const child = exec(
      command,
      { timeout, maxBuffer: 1024 * 1024 }, // Adjust maxBuffer as needed
      (error, stdout, stderr) => {
        if (error) {
          let detailedMessage = "An unexpected error occurred.";

          // Handle timeout error
          if (error.signal === "SIGTERM") {
            detailedMessage =
              "Execution timed out. The code took too long to complete.";
          }

          // Handle maxBuffer overflow
          if (error.message.includes("stdout maxBuffer length exceeded")) {
            detailedMessage =
              "Execution error: Maximum buffer size exceeded. This may occur if your code prints too much output.";
          }

          return reject({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            message: detailedMessage,
          });
        }

        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      }
    );

    // Write stdin to the process
    if (stdin) {
      child.stdin?.write(stdin);
      child.stdin?.end();
    }
  });
};

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
      return reject({
        stdout: "",
        stderr: "",
        message: `Unsupported language for interpreted code: ${language}`,
      });
    }

    const filePath = path.join(tempDir, `main.${extension}`);
    const codeContent = Array.isArray(code) ? code.join("\n") : code;
    fs.writeFileSync(filePath, codeContent);

    const stdin = inputs.join("\n");

    const languageCommands: { [key: string]: string } = {
      python: `python3 -u /app/main.py`,
      javascript: `node /app/main.js`,
      ruby: `ruby /app/main.rb`,
      bash: `bash /app/main.sh`,
      r: `Rscript /app/main.r`,
      haskell: `runhaskell /app/main.hs`,
      matlab: `matlab -batch "run('/app/main.m')"`,
    };

    const command = [
      "docker",
      "run",
      "--rm",
      "-i", // Enable interactive mode for stdin
      "--name",
      `code-runner-${language}-${uuidv4()}`,
      "-v",
      `${tempDir}:/app`,
      `${language}-image`,
      `/bin/sh -c '${languageCommands[language]}'`,
    ].join(" ");

    executeCommandWithTimeout(command, timeout, stdin)
      .then(resolve)
      .catch(reject);
  });
};

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
      return reject({
        stdout: "",
        stderr: "",
        message: `Unsupported language for compiled code: ${language}`,
      });
    }

    const filePath = path.join(tempDir, `Main.${extension}`);
    fs.writeFileSync(filePath, code);

    const stdin = inputs.join("\n");

    const compileCommand =
      language === "rust"
        ? `mkdir -p /app/tmp && RUST_TMPDIR=/app/tmp rustc -o /app/program /app/Main.rs`
        : language === "c"
        ? `gcc -o /app/program /app/Main.c`
        : language === "cpp"
        ? `g++ -o /app/program /app/Main.cpp`
        : language === "go"
        ? `go build -o /app/program /app/Main.go`
        : language === "java"
        ? `javac -d /app /app/Main.java`
        : language === "csharp"
        ? `mcs -out:/app/Main.exe /app/Main.cs`
        : null;

    const executeCommand =
      language === "java"
        ? `cat /dev/stdin | java -cp /app Main`
        : language === "c" || language === "cpp" || language === "go"
        ? `/app/program`
        : language === "csharp"
        ? `mono /app/Main.exe`
        : language === "rust"
        ? `/app/program`
        : null;

    if (!compileCommand || !executeCommand) {
      return reject({
        stdout: "",
        stderr: "",
        message: `Unsupported language for compiled code: ${language}`,
      });
    }

    const compileAndRunCommand = [
      "docker",
      "run",
      "--rm",
      "-i", // Interactive flag to support stdin
      "--cap-drop=ALL",
      "-v",
      `${tempDir}:/app`,
      `${language}-image`,
      `/bin/sh -c '${compileCommand} && ${executeCommand}'`,
    ].join(" ");

    console.log("Running command:", compileAndRunCommand); // Debugging log

    executeCommandWithTimeout(compileAndRunCommand, timeout, stdin)
      .then(resolve)
      .catch(reject);
  });
};

export { executeInterpretedCode, executeCompiledCode };
