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

// Function to execute compiled languages like Java
async function executeCompiledCode(language, code, input) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, "temp"); // Temporary folder to store files
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Java-specific: Set filename to "Main.java" to match the public class name
    let fileName, filePath, compileCommand, runCommand;

    switch (language) {
      case "java":
        fileName = "Main.java"; // Ensure the file name matches the public class name
        filePath = path.join(tempDir, fileName);
        compileCommand = `javac ${filePath}`;
        runCommand = `java -cp ${tempDir} Main`; // Run the Main class
        break;
      case "c":
        fileName = `program-${Date.now()}.c`;
        filePath = path.join(tempDir, fileName);
        compileCommand = `gcc ${filePath} -o ${tempDir}/program`;
        runCommand = `${tempDir}/program`;
        break;
      case "cpp":
        fileName = `program-${Date.now()}.cpp`;
        filePath = path.join(tempDir, fileName);
        compileCommand = `g++ ${filePath} -o ${tempDir}/program`;
        runCommand = `${tempDir}/program`;
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
        fs.unlinkSync(filePath);
        if (language === "java") {
          fs.unlinkSync(path.join(tempDir, "Main.class")); // Clean up the Main class
        } else {
          fs.unlinkSync(path.join(tempDir, "program"));
        }

        resolve(output); // Return the output
      });
    });
  });
}

module.exports = { executeInterpretedCode, executeCompiledCode };
