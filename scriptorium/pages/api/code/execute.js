import { v4 as uuidv4 } from "uuid";
const {
  executeInterpretedCode,
  executeCompiledCode,
} = require("../../../utils/codeExecutionHelper");

let sessions = {}; // Store sessions with sessionId as the key

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" }); // Return 405 if not POST
    }

    const { code, input, language, sessionId } = req.body; // Get code, input, and language from the request

    let compiledLanguage = false;
    let result;

    // Handle sending input to an existing session
    if (sessionId && sessions[sessionId]) {
      // Send input to the existing running process
      const { process } = sessions[sessionId];

      process.stdin.write(input + "\n");

      let output = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        output += data.toString();
      });

      return res.status(200).json({ output });
    }

    // Generate a new session ID for a new process
    const newSessionId = uuidv4();

    // Determine the appropriate command based on the language
    let command;
    switch (language) {
      case "javascript":
        command = `node -e "${code}"`; // Execute JavaScript code using Node.js
        break;
      case "python":
        command = `python3 -c "${code}"`; // Execute Python code
        break;
      case "java":
      case "c":
      case "cpp":
        // Call the helper to handle compilation and execution for Java, C, C++
        compiledLanguage = true;
        break;
      default:
        return res.status(400).json({ error: "Unsupported language" });
    }

    // Execute the code and pass the input (if provided)
    if (compiledLanguage) {
      result = await executeCompiledCode(language, code, input);
    } else {
      const { process, output } = await executeInterpretedCode(command, input);

      // Store the process in sessions so that future input can be sent
      sessions[newSessionId] = { process };

      // Return the result (stdout) and sessionId to the client
      return res.status(200).json({ sessionId: newSessionId, output });
    }
  } catch (error) {
    // Handle errors (e.g., code execution errors or unsupported languages)
    res.status(500).json({ error: `Failed to execute code: ${error}` });
  }
}
