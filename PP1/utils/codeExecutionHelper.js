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
      reject({
        status: 400,
        stdout: output.trim(),
        stderr: errorOutput.trim(),
        message: "Execution timed out",
      });
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
        return reject({
          stdout: "",
          stderr: "",
          message: "Unsupported compiled language",
        });
    }

    fs.writeFileSync(filePath, code);

    const compileProcess = spawn(compileCommand, { shell: true });

    let compileErrorOutput = "";

    const compileTimer = setTimeout(() => {
      compileProcess.kill();
      reject({
        stdout: "",
        stderr: compileErrorOutput.trim(),
        message: "Compilation timed out",
      });
    }, timeout);

    compileProcess.stderr.on("data", (data) => {
      compileErrorOutput += data.toString();
    });

    compileProcess.on("close", (code) => {
      clearTimeout(compileTimer);
      if (code !== 0) {
        return reject({
          stdout: "",
          stderr: compileErrorOutput.trim(),
          message: "Compilation failed.",
        });
      }

      const runProcess = spawn(runCommand, { shell: true });

      let output = "";
      let errorOutput = "";

      const runTimer = setTimeout(() => {
        runProcess.kill();
        reject({
          stdout: output.trim(),
          stderr: errorOutput.trim(),
          message: "Execution timed out",
        });
      }, timeout);

      runProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      runProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      runProcess.on("close", (code) => {
        clearTimeout(runTimer);
        // Clean up temporary files
        fs.unlinkSync(filePath);
        if (language === "java") {
          const classFilePath = path.join(tempDir, `${javaClassName}.class`);
          if (fs.existsSync(classFilePath)) {
            fs.unlinkSync(classFilePath);
          }
        } else {
          const compiledFilePath = path.join(tempDir, fileName);
          if (fs.existsSync(compiledFilePath)) {
            fs.unlinkSync(compiledFilePath);
          }
        }

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
        runProcess.stdin.write(inputs.join("\n") + "\n");
      }
      runProcess.stdin.end();
    });
  });
}

module.exports = { executeInterpretedCode, executeCompiledCode };
