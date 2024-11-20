import { spawn } from "child_process";
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
 * Executes interpreted code for languages like JavaScript or Python.
 * @param language Programming language (e.g., javascript, python).
 * @param code Code to execute.
 * @param inputs Input to pass to the program.
 * @param timeout Maximum execution time in milliseconds.
 * @returns Promise resolving to the output and error.
 */
const executeInterpretedCode = (
  language: string,
  code: string | string[], // Allow code to be a string or array
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
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const extension =
      normalizedLanguage === "javascript" ? "js" : normalizedLanguage;
    const filePath = path.join(tempDir, `main.${extension}`);

    // Convert code to a string if it's not already
    fs.writeFileSync(
      filePath,
      Array.isArray(code) ? code.join("\n") : String(code)
    );

    const runCommand = [
      "docker",
      "run",
      "--rm",
      "--name",
      containerName,
      "-v",
      `${tempDir}:/app`,
      `${normalizedLanguage}-image`,
      `${
        normalizedLanguage === "javascript" ? "node" : normalizedLanguage
      } /app/main.${extension}`,
    ];

    const process = spawn(runCommand.join(" "), { shell: true });

    let output = "";
    let errorOutput = "";

    const timer = setTimeout(() => {
      process.kill();
      reject({
        stdout: output.trim(),
        stderr: errorOutput.trim(),
        message: "Execution timed out",
      });
    }, timeout);

    process.stdout.on("data", (data) => (output += data.toString()));
    process.stderr.on("data", (data) => (errorOutput += data.toString()));

    process.on("close", (code) => {
      clearTimeout(timer);
      fs.unlinkSync(filePath);
      if (code !== 0) {
        return reject({
          stdout: output.trim(),
          stderr: errorOutput.trim(),
          message: `Execution error: ${
            errorOutput.trim() || `Process exited with code ${code}`
          }`,
        });
      }
      resolve({ stdout: output.trim(), stderr: errorOutput.trim() });
    });

    if (inputs.length > 0) {
      process.stdin.write(inputs.join("\n") + "\n");
    }
    process.stdin.end();
  });
};

/**
 * Executes compiled code for languages like Java, C, or C++.
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
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

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

    // Ensure `code` is a valid string before writing
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

    console.log(
      "Compiling Docker command:",
      ["docker", "run", compileCommand].join(" ")
    );

    const compileProcess = spawn("docker", [
      "run",
      "--rm",
      "--read-only",
      "--cap-drop=ALL",
      "-v",
      `${tempDir}:/app`,
      `${language}-image`,
      compileCommand,
    ]);

    compileProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("Compilation failed."));
      } else {
        console.log(
          "Running execution command:",
          ["docker", "run", executeCommand].join(" ")
        );

        const executeProcess = spawn("docker", [
          "run",
          "--rm",
          "--read-only",
          "--cap-drop=ALL",
          "-v",
          `${tempDir}:/app`,
          `${language}-image`,
          executeCommand,
        ]);

        let output = "";
        let errorOutput = "";

        const timer = setTimeout(() => {
          executeProcess.kill();
          reject({
            stdout: output.trim(),
            stderr: errorOutput.trim(),
            message: "Execution timed out",
          });
        }, timeout);

        executeProcess.stdout.on("data", (data) => (output += data.toString()));
        executeProcess.stderr.on(
          "data",
          (data) => (errorOutput += data.toString())
        );

        executeProcess.on("close", (execCode) => {
          fs.unlinkSync(filePath);
          clearTimeout(timer);

          if (execCode !== 0) {
            reject({
              stdout: output.trim(),
              stderr: errorOutput.trim(),
              message: `Execution error: ${
                errorOutput.trim() || `Process exited with code ${execCode}`
              }`,
            });
          } else {
            resolve({ stdout: output.trim(), stderr: errorOutput.trim() });
          }
        });
      }
    });
  });
};

export { executeInterpretedCode, executeCompiledCode };
