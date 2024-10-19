import { v4 as uuidv4 } from "uuid";

let sessions = {}; // Store active running processes by sessionId

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { input, sessionId } = req.body;

    // Check if sessionId exists
    if (!sessionId || !sessions[sessionId]) {
      return res.status(404).json({
        error: "Session not found. Please start a new code session.",
      });
    }

    try {
      const { process } = sessions[sessionId];

      // Send input to the process's stdin
      process.stdin.write(input + "\n");

      // Capture output and return it as a promise
      let output = await new Promise((resolve, reject) => {
        let outputData = "";
        let errorData = "";

        process.stdout.on("data", (data) => {
          outputData += data.toString();
        });

        process.stderr.on("data", (data) => {
          errorData += data.toString();
        });

        process.on("close", (code) => {
          if (code !== 0) {
            reject(`Error: ${errorData}`);
          } else {
            resolve(outputData);
          }
        });
      });

      return res.status(200).json({ output });
    } catch (error) {
      return res.status(500).json({ error: "Failed to send input" });
    }
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
