import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "../../context/ThemeContext"; // Import the useTheme hook
import { useCode } from "../../context/CodeContext"; // Import the useCode hook

// Dynamically import Monaco Editor with SSR disabled
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false, // Disables SSR for Monaco Editor
});

const CodeExecution: React.FC = () => {
  const [code, setCode] = useState<string>(""); // Code editor state
  const [output, setOutput] = useState<string>(""); // Execution output state
  const [language, setLanguage] = useState<string>("javascript"); // Selected language state

  const { isDarkMode } = useTheme(); // Access the current theme
  const { code: contextCode, setCode: setContextCode } = useCode(); // Access the code from CodeContext

  useEffect(() => {
    // Retrieve the code from CodeContext when the component mounts
    if (contextCode) {
      setCode(contextCode); // Set the editor code with the context code
      setContextCode(""); // Clear the code from the context
    }
  }, [contextCode, setContextCode]); // Dependencies ensure this runs when context changes

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder logic to simulate code execution
    setOutput("Execution Result: \n" + code);
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
      } mt-6`} // Ensure that this section matches the navbar
    >
      <div
        className={`w-full max-w-4xl sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl p-6 rounded-lg shadow-lg ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
        }`}
      >
        <h1 className="text-3xl font-bold text-center text-lg sm:text-2xl md:text-3xl">
          Code Execution
        </h1>
        <p className="text-gray-400 text-center mt-2 text-sm sm:text-base md:text-lg">
          Write your code and execute it below.
        </p>

        <form className="mt-6" onSubmit={handleExecute}>
          {/* Language Selector */}
          <div className="mb-6">
            <label
              htmlFor="language"
              className="block text-sm font-medium text-gray-300"
            >
              Select Language
            </label>
            <select
              id="language"
              className={`mt-1 block w-full px-4 py-2 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
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

          {/* Code Editor Area */}
          <div className="mb-6">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-300"
            >
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

        {/* Output Area */}
        <div className="mt-6 mb-10">
          <h2 className="text-xl font-medium text-gray-300">
            Execution Result
          </h2>
          <pre
            className={`${
              isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
            } p-4 rounded-md mt-2 whitespace-pre-wrap`}
          >
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeExecution;
