import { executeInterpretedCode, executeCompiledCode } from "./execute";
import { v4 as uuidv4 } from "uuid";

let sessions = {}; // To store active running processes by sessionId

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { action, input, sessionId, language, code } = req.body;

    // Handle code execution
    if (action === "run-code") {
      try {
        const newSessionId = uuidv4(); // Generate a unique session ID for the user

        // Start a new process by executing the code
        const { process, output } = await executeInterpretedCode(
          language,
          code
        );

        // Store the running process in the sessions object with the sessionId
        sessions[newSessionId] = { process, output };

        // Return the sessionId and initial output to the user
        return res.status(200).json({ sessionId: newSessionId, output });
      } catch (error) {
        return res.status(500).json({ error: "Failed to run code" });
      }
    }

    // Handle input sending
    if (action === "send-input") {
      if (!sessionId || !sessions[sessionId]) {
        return res
          .status(404)
          .json({
            error: "Session not found. Please start a new code session.",
          });
      }

      try {
        const { process } = sessions[sessionId];

        // Send input to the process's stdin
        process.stdin.write(input + "\n");

        let output = "";
        process.stdout.on("data", (data) => {
          output += data.toString();
        });

        process.stderr.on("data", (data) => {
          output += data.toString();
        });

        return res.status(200).json({ output });
      } catch (error) {
        return res.status(500).json({ error: "Failed to send input" });
      }
    }

    return res.status(400).json({ error: "Invalid action" });
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
