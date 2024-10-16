const { executeCodeWithInput } = require("../utils/codeExecutionHelper");

const runCodeWithInputController = async (req, res) => {
  try {
    const { code, input, language } = req.body; // Get code, input, and language from the request

    // Determine the appropriate command based on the language
    let command;

    switch (language) {
      case "javascript":
        command = `node -e "${code}"`; // Execute JavaScript code using Node.js
        break;
      case "python":
        command = `python -c "${code}"`; // Execute Python code
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
    const result = await executeCodeWithInput(command, input);

    // Return the result (stdout) to the client
    res.status(200).json({ output: result });
  } catch (error) {
    // Handle errors (e.g., code execution errors or unsupported languages)
    res.status(500).json({ error: `Failed to execute code: ${error}` });
  }
};

module.exports = { runCodeWithInputController };
