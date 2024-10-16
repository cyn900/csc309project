const {
  executeInterpretedCode,
  executeCompiledCode,
} = require("../../utils/codeExecutionHelper");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" }); // Return 405 if not POST
    }

    const { code, input, language } = req.body; // Get code, input, and language from the request

    let compiledLanguage = false; // Check if the language requires compilation

    let result;

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
      result = await executeInterpretedCode(command, input);
    }

    // Return the result (stdout) to the client
    res.status(200).json({ output: result });
  } catch (error) {
    // Handle errors (e.g., code execution errors or unsupported languages)
    res.status(500).json({ error: `Failed to execute code: ${error}` });
  }
}
