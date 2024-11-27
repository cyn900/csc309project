import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { useCode } from "../../context/CodeContext";
import { useRouter } from 'next/router';
import Link from 'next/link';

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const CodeExecution: React.FC = () => {
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("python");
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // New loading state

  const { isDarkMode } = useTheme();
  const { code: contextCode, setCode: setContextCode } = useCode();
  const router = useRouter();
  const { tID } = router.query;

  useEffect(() => {
    if (contextCode) {
      setCode(contextCode);
      setContextCode("");
    }
  }, [contextCode, setContextCode]);

  useEffect(() => {
    const fetchTemplateCode = async () => {
      if (tID) {
        try {
          const response = await axios.get(`/api/templates?tID=${tID}`);
          setCode(response.data.code);
        } catch (error) {
          console.error("Failed to fetch template code:", error);
        }
      }
    };

    fetchTemplateCode();
  }, [tID]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Show loading screen while code is executing
    setError(null);
    setOutput(""); // Clear previous output

    try {
      let formattedInput = [];

      if (input.trim() !== "") {
        try {
          const parsedInput = JSON.parse(input.trim());
          if (Array.isArray(parsedInput)) {
            formattedInput = parsedInput;
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
        input: formattedInput,
        language,
      });

      const { stdout, stderr } = response.data.output;
      const formattedOutput = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
      setOutput(formattedOutput);
      setError(null);
    } catch (err: any) {
      console.error("Execution failed:", err);

      if (err.response && err.response.status === 400) {
        const { stderr } = err.response.data.output || {};
        const errorMessage = `Execution failed with backend error.\n\nSTDERR:\n${
          stderr || "No stderr provided."
        }`;
        setError(errorMessage);
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false); // Hide loading screen after execution is complete
    }
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setLanguage(event.target.value);
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  const handleCreateTemplate = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Please log in to create a template");
      return;
    }
    // Store the current code execution state in localStorage
    const templateData = {
      code: code,
      language: language,
      input: input
    };
    localStorage.setItem('newTemplateData', JSON.stringify(templateData));
    router.push('/templates/create');
  };

  return (
    <div
      className={`min-h-screen p-8 ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div
        className={`max-w-4xl mx-auto rounded-lg ${
          isDarkMode ? "text-white" : "text-black"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Code Execution</h1>
          <button
            onClick={handleCreateTemplate}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Create Template
          </button>
        </div>
        <p className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Write your code and execute it below.
        </p>

        <form className="space-y-6" onSubmit={handleExecute}>
          <div>
            <label htmlFor="language" className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              Select Language
            </label>
            <select
              id="language"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 text-white border-gray-700"
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
              <option value="ruby">Ruby</option>
              <option value="rust">Rust</option>
              <option value="bash">Bash</option>
              <option value="r">R</option>
              <option value="haskell">Haskell</option>
            </select>
          </div>

          <div>
            <label htmlFor="input" className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              Input (JSON Array)
            </label>
            <textarea
              id="input"
              rows={4}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-black border-gray-300"
              }`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <p className={`text-sm mt-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}>
              Provide input as a JSON array, e.g., ["PythonUser1", "PythonUser2"].
            </p>
          </div>

          <div>
            <label htmlFor="code" className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              Code
            </label>
            <div className="border rounded-lg overflow-hidden">
              <MonacoEditor
                height="400px"
                language={language}
                value={code}
                onChange={handleEditorChange}
                theme={isDarkMode ? "vs-dark" : "vs-light"}
                options={{
                  selectOnLineNumbers: true,
                  minimap: { enabled: false },
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Execute Code
          </button>
        </form>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className={`ml-4 text-lg font-semibold ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}>Loading...</span>
            </div>
          ) : (
            <div>
              <h2 className={`text-xl font-medium mb-4 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}>Execution Result</h2>
              {error ? (
                <pre className={`p-4 rounded-lg whitespace-pre-wrap ${
                  isDarkMode 
                    ? "bg-red-900/50 text-red-200 border border-red-800" 
                    : "bg-red-100 text-red-700"
                }`}>
                  Error: {error}
                </pre>
              ) : (
                <pre className={`p-4 rounded-lg whitespace-pre-wrap ${
                  isDarkMode
                    ? "bg-gray-800 text-gray-300 border border-gray-700"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {output}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeExecution;
