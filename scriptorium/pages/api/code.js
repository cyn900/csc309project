const { executeCode } = require("../../utils/codeExecutionHelper");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" }); // Return 405 if not POST
    }

    const { code, input, language } = req.body; // Get code, input, and language from the request

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
        command = `${code}`;
        break;
      case "c":
        command = `${code}`;
        break;
      case "cpp":
        command = `${code}`;
        break;
      default:
        return res.status(400).json({ error: "Unsupported language" });
    }

    // Execute the code and pass the input (if provided)
    const result = await executeCode(command, input);

    // Return the result (stdout) to the client
    res.status(200).json({ output: result });
  } catch (error) {
    // Handle errors (e.g., code execution errors or unsupported languages)
    res.status(500).json({ error: `Failed to execute code: ${error}` });
  }
}
