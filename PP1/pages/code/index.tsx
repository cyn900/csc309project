import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios"; // Import axios for API calls
import { useTheme } from "../../context/ThemeContext"; // Import the useTheme hook
import { useCode } from "../../context/CodeContext"; // Import the useCode hook

// Dynamically import Monaco Editor with SSR disabled
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false, // Disables SSR for Monaco Editor
});

const CodeExecution: React.FC = () => {
  const [code, setCode] = useState<string>(""); // Code editor state
  const [output, setOutput] = useState<string>(""); // Execution output state
  const [error, setError] = useState<string | null>(null); // Execution error state
  const [language, setLanguage] = useState<string>("python"); // Selected language state
  const [input, setInput] = useState<string>(""); // Input for the code execution

  const { isDarkMode } = useTheme(); // Access the current theme
  const { code: contextCode, setCode: setContextCode } = useCode(); // Access the code from CodeContext

  useEffect(() => {
    // Retrieve the code from CodeContext when the component mounts
    if (contextCode) {
      setCode(contextCode); // Set the editor code with the context code
      setContextCode(""); // Clear the code from the context
    }
  }, [contextCode, setContextCode]); // Dependencies ensure this runs when context changes

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let formattedInput = [];

      if (input.trim() !== "") {
        try {
          const parsedInput = JSON.parse(input.trim());
          if (Array.isArray(parsedInput)) {
            formattedInput = parsedInput; // Use the parsed array
          } else {
            throw new Error("Input must be a JSON array or an empty string.");
          }
        } catch {
          throw new Error(
            "Invalid input format. Ensure it is a JSON array or an empty string."
          );
        }
      }

      const response = await axios.post("/api/code/execute", {
        code,
        input: formattedInput, // Always send as an array
        language,
      });

      const { stdout, stderr } = response.data.output;
      const formattedOutput = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
      setOutput(formattedOutput);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error("Execution failed:", err);

      // Handle 400 errors specifically
      if (err.response && err.response.status === 400) {
        const { stderr } = err.response.data.output || {};
        const errorMessage = `Execution failed with backend error.\n\nSTDERR:\n${
          stderr || "No stderr provided."
        }`;
        setError(errorMessage);
      } else {
        // General error handling for other status codes
        setError(err.message || "An unexpected error occurred.");
      }
    }
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setLanguage(event.target.value);
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || ""); // Ensure code is always a string (fallback to empty string)
  };

  return (
    <div
      className={`flex flex-col min-h-screen items-center justify-center ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      } mt-6`}
    >
      <div
        className={`w-full max-w-4xl p-6 rounded-lg shadow-lg ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
        }`}
      >
        <h1 className="text-3xl font-bold text-center">Code Execution</h1>
        <p className="text-gray-400 text-center mt-2">
          Write your code and execute it below.
        </p>

        <form className="mt-6" onSubmit={handleExecute}>
          {/* Language Selector */}
          <div className="mb-6">
            <label htmlFor="language" className="block text-sm font-medium">
              Select Language
            </label>
            <select
              id="language"
              className={`mt-1 block w-full px-4 py-2 rounded-md ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              }`}
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="csharp">C#</option>
              <option value="go">Go</option>
              <option value="typescript">TypeScript</option>
              <option value="ruby">Ruby</option>
              <option value="php">PHP</option>
              <option value="swift">Swift</option>
              <option value="kotlin">Kotlin</option>
              <option value="scala">Scala</option>
              <option value="perl">Perl</option>
              <option value="rust">Rust</option>
              <option value="bash">Bash</option>
              <option value="matlab">MATLAB</option>
              <option value="r">R</option>
              <option value="haskell">Haskell</option>
              <option value="elixir">Elixir</option>
            </select>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <label htmlFor="input" className="block text-sm font-medium">
              Input (JSON Array)
            </label>
            <textarea
              id="input"
              rows={4}
              className={`mt-1 block w-full px-4 py-2 rounded-md ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              }`}
              value={input}
              onChange={(e) => {
                try {
                  // Attempt to parse input as JSON to ensure it's valid
                  const parsedInput = JSON.parse(e.target.value);
                  if (Array.isArray(parsedInput)) {
                    setInput(JSON.stringify(parsedInput, null, 2)); // Pretty-print JSON if valid
                  } else {
                    throw new Error("Input must be a JSON array.");
                  }
                } catch (err) {
                  setInput(e.target.value); // Keep the raw value if parsing fails
                }
              }}
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide input as a JSON array, e.g., ["PythonUser1",
              "PythonUser2"].
            </p>
          </div>

          {/* Code Editor Area */}
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm font-medium">
              Code
            </label>
            <MonacoEditor
              height="400px"
              language={language}
              value={code}
              onChange={handleEditorChange} // Update state on change
              theme={isDarkMode ? "vs-dark" : "vs-light"} // Switch Monaco theme based on mode
              options={{
                selectOnLineNumbers: true,
                minimap: { enabled: false },
              }}
            />
          </div>

          {/* Execute Button */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Execute Code
          </button>
        </form>

        <div className="mt-6">
          <h2 className="text-xl font-medium">Execution Result</h2>
          {error ? (
            <pre className="p-4 bg-red-100 text-red-700 rounded-md mt-2 whitespace-pre-wrap">
              Error: {error}
            </pre>
          ) : (
            <pre
              className={`p-4 rounded-md mt-2 whitespace-pre-wrap ${
                isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
              }`}
            >
              {output}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeExecution;
