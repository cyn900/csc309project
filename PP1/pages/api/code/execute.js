const {
  executeInterpretedCode,
  executeCompiledCode,
} = require("../../../utils/codeExecutionHelper");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { code, input, language } = req.body; // Retrieve code, input, and language from request
    let compiledLanguage = false;
    let command;

    // Determine the appropriate command based on the language
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
        compiledLanguage = true;
        break;
      default:
        return res.status(400).json({ error: "Unsupported language" });
    }

    // Execute the code and handle the response
    if (compiledLanguage) {
      // Execute for compiled languages like Java, C, or C++
      const output = await executeCompiledCode(language, code, input); // Assume this returns output as a string
      return res.status(200).json({ output }); // Return the output directly
    } else {
      // Execute for interpreted languages like JavaScript or Python
      const output = await executeInterpretedCode(command, input);
      return res.status(200).json({ output });
    }
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: `Failed to execute code: ${error.message}` });
  }
}
