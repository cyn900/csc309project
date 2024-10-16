const { spawn } = require("child_process");

const executeCode = (command, input = "") => {
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

module.exports = { executeCode };
