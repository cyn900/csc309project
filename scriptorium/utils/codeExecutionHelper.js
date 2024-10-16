const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const executeInterpretedCode = (command, input = "") => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { shell: true });

    let output = "";
    let errorOutput = "";

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
      if (code !== 0) {
        reject(`Error: ${errorOutput || `Process exited with code ${code}`}`);
      } else {
        resolve(output);
      }
    });

    // Send input to the stdin stream
    if (input) {
      process.stdin.write(input);
    }
    process.stdin.end(); // Close stdin after writing input
  });
};

async function executeCompiledCode(language, code, input) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, "temp"); // Temporary folder to store files
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Generate a unique file name using UUID
    const fileName = `program-${uuidv4()}`;
    let filePath, compileCommand, runCommand, javaClassName;

    switch (language) {
      case "java":
        javaClassName = `Main${uuidv4().replace(/-/g, "")}`; // Unique class name without hyphens
        filePath = path.join(tempDir, `${javaClassName}.java`); // File will match the class name
        code = code.replace(
          /public class Main/,
          `public class ${javaClassName}`
        ); // Dynamically modify the class name in the code
        compileCommand = `javac ${filePath}`;
        runCommand = `java -cp ${tempDir} ${javaClassName}`; // Run the compiled class
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

    // Write the code to the file
    fs.writeFileSync(filePath, code);

    // Step 1: Compile the code
    const compileProcess = spawn(compileCommand, { shell: true });

    compileProcess.stderr.on("data", (data) => {
      reject(`Compilation error: ${data.toString()}`);
    });

    compileProcess.on("close", (code) => {
      if (code !== 0) {
        return reject("Compilation failed");
      }

      // Step 2: Execute the compiled code
      const runProcess = spawn(runCommand, { shell: true });

      let output = "";
      runProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      runProcess.stderr.on("data", (data) => {
        reject(`Execution error: ${data.toString()}`);
      });

      if (input) {
        runProcess.stdin.write(input);
        runProcess.stdin.end();
      }

      runProcess.on("close", (code) => {
        if (code !== 0) {
          reject("Execution failed");
        }

        // Clean up temporary files
        fs.unlinkSync(filePath); // Delete the .java source file
        if (language === "java") {
          fs.unlinkSync(path.join(tempDir, `${javaClassName}.class`)); // Delete the correct .class file
        } else {
          fs.unlinkSync(path.join(tempDir, fileName)); // Delete compiled binaries for C/C++
        }

        resolve(output); // Return the output
      });
    });
  });
}

module.exports = { executeInterpretedCode, executeCompiledCode };
