const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const executeInterpretedCode = (command, inputs = [], timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { shell: true });

    let output = "";
    let errorOutput = "";

    // Set timeout for the process
    const timer = setTimeout(() => {
      process.kill(); // Terminate the process if timeout is reached
      reject(new Error("Execution timed out"));
    }, timeout);

    // Capture stdout data
    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Capture stderr data
    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Handle process exit
    process.on("close", (code) => {
      clearTimeout(timer); // Clear the timeout on close
      if (code !== 0) {
        reject(`Error: ${errorOutput || `Process exited with code ${code}`}`);
      } else {
        resolve(output);
      }
    });

    // Send all inputs at once
    if (inputs.length > 0) {
      process.stdin.write(inputs.join("\n") + "\n"); // Send all inputs as a single block
    }
    process.stdin.end(); // End stdin as no further input is expected
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

    // Set a timeout for compilation
    const compileTimer = setTimeout(() => {
      compileProcess.kill();
      reject(new Error("Compilation timed out"));
    }, timeout);

    compileProcess.stderr.on("data", (data) => {
      clearTimeout(compileTimer);
      reject(`Compilation error: ${data.toString()}`);
    });

    compileProcess.on("close", (code) => {
      clearTimeout(compileTimer);
      if (code !== 0) {
        return reject("Compilation failed");
      }

      // Execute the compiled code
      const runProcess = spawn(runCommand, { shell: true });

      let output = "";
      let errorOutput = "";

      // Set a timeout for execution
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
          reject(`Execution error: ${errorOutput}`);
        } else {
          resolve(output);
        }

        // Clean up temporary files
        fs.unlinkSync(filePath);
        if (language === "java") {
          fs.unlinkSync(path.join(tempDir, `${javaClassName}.class`));
        } else {
          fs.unlinkSync(path.join(tempDir, fileName));
        }
      });

      // Send all inputs at once, if provided
      if (inputs.length > 0) {
        runProcess.stdin.write(inputs.join("\n") + "\n");
      }
      runProcess.stdin.end();
    });
  });
}

module.exports = { executeInterpretedCode, executeCompiledCode };
