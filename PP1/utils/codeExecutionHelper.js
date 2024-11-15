const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const executeInterpretedCode = (command, inputs = [], timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { shell: true });

    let output = "";
    let errorOutput = "";

    const timer = setTimeout(() => {
      process.kill(); // Terminate the process if timeout is reached
      reject({ status: 400, message: "Execution timed out" });
    }, timeout);

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        // Handle known error messages with more detailed output
        if (errorOutput.includes("ZeroDivisionError")) {
          return reject({
            message: "Runtime error: Division by zero detected in the code.",
          });
        } else if (errorOutput.includes("SyntaxError")) {
          return reject({
            message: `Syntax error in the provided code: ${errorOutput.trim()}`,
          });
        } else if (errorOutput.includes("ReferenceError")) {
          return reject({ message: `Reference error: ${errorOutput.trim()}` });
        }
        return reject({
          message: `Execution error: ${
            errorOutput.trim() || `Process exited with code ${code}`
          }`,
        });
      }
      resolve(output.trim());
    });

    if (inputs.length > 0) {
      process.stdin.write(inputs.join("\n") + "\n");
    }
    process.stdin.end();
  });
};

async function executeCompiledCode(
  language,
  code,
  inputs = [],
  timeout = 30000
) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const fileName = `program-${uuidv4()}`;
    let filePath, compileCommand, runCommand, javaClassName;

    switch (language) {
      case "java":
        javaClassName = `Main${uuidv4().replace(/-/g, "")}`;
        filePath = path.join(tempDir, `${javaClassName}.java`);
        code = code.replace(
          /public class Main/,
          `public class ${javaClassName}`
        );
        compileCommand = `javac ${filePath}`;
        runCommand = `java -cp ${tempDir} ${javaClassName}`;
        break;
      case "c":
        filePath = path.join(tempDir, `${fileName}.c`);
        compileCommand = `gcc ${filePath} -o ${tempDir}/${fileName}`;
        runCommand = `${tempDir}/${fileName}`;
        break;
      case "cpp":
        filePath = path.join(tempDir, `${fileName}.cpp`);
        compileCommand = `g++ ${filePath} -o ${tempDir}/${fileName}`;
        runCommand = `${tempDir}/${fileName}`;
        break;
      default:
        return reject("Unsupported compiled language");
    }

    fs.writeFileSync(filePath, code);

    const compileProcess = spawn(compileCommand, { shell: true });

    const compileTimer = setTimeout(() => {
      compileProcess.kill();
      reject(new Error("Compilation timed out"));
    }, timeout);

    compileProcess.stderr.on("data", (data) => {
      clearTimeout(compileTimer);
      reject(`Compilation error: ${data.toString().trim()}`);
    });

    compileProcess.on("close", (code) => {
      clearTimeout(compileTimer);
      if (code !== 0) {
        return reject("Compilation failed.");
      }

      const runProcess = spawn(runCommand, { shell: true });

      let output = "";
      let errorOutput = "";

      const runTimer = setTimeout(() => {
        runProcess.kill();
        reject(new Error("Execution timed out"));
      }, timeout);

      runProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      runProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      runProcess.on("close", (code) => {
        clearTimeout(runTimer);
        if (code !== 0) {
          if (errorOutput.includes("ArithmeticException")) {
            return reject({
              message:
                "Runtime error: Division by zero or invalid arithmetic operation.",
            });
          } else if (errorOutput.includes("Exception")) {
            return reject({ message: `Runtime error: ${errorOutput.trim()}` });
          }
          return reject({
            message: `Execution error: ${
              errorOutput.trim() || `Process exited with code ${code}`
            }`,
          });
        }
        resolve(output.trim());

        // Clean up temporary files
        fs.unlinkSync(filePath);
        if (language === "java") {
          fs.unlinkSync(path.join(tempDir, `${javaClassName}.class`));
        } else {
          fs.unlinkSync(path.join(tempDir, fileName));
        }
      });

      if (inputs.length > 0) {
        runProcess.stdin.write(inputs.join("\n") + "\n");
      }
      runProcess.stdin.end();
    });
  });
}

module.exports = { executeInterpretedCode, executeCompiledCode };
