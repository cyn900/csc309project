import { useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "@/context/ThemeContext"; // Adjust the import path based on your project structure

const CreateTemplate: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [fork, setFork] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formattedTags = tags.split(",").map((tag) => tag.trim());

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("accessToken")}`, // Adjust token retrieval logic if needed
        },
        body: JSON.stringify({
          title,
          explanation,
          tags: formattedTags,
          code,
          fork,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create template");
      }

      setSuccess("Template created successfully!");
      setTimeout(() => router.push("/templates"), 1000); // Redirect after 2 seconds
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div
        className={`w-full max-w-2xl p-6 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create a New Template</h1>
          <button
            onClick={() => router.push("/templates")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isDarkMode
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            Back to Templates
          </button>
        </div>

        {/* Error and Success Messages */}
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {success && <p className="mb-4 text-green-500">{success}</p>}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full mt-1 p-2 rounded focus:outline-none focus:ring ${
                isDarkMode
                  ? "bg-gray-700 text-white focus:ring-indigo-500"
                  : "bg-gray-200 text-gray-900 focus:ring-indigo-500"
              }`}
              required
            />
          </div>
          <div>
            <label htmlFor="explanation" className="block text-sm font-medium">
              Explanation
            </label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className={`w-full mt-1 p-2 rounded focus:outline-none focus:ring ${
                isDarkMode
                  ? "bg-gray-700 text-white focus:ring-indigo-500"
                  : "bg-gray-200 text-gray-900 focus:ring-indigo-500"
              }`}
              rows={4}
              required
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`w-full mt-1 p-2 rounded focus:outline-none focus:ring ${
                isDarkMode
                  ? "bg-gray-700 text-white focus:ring-indigo-500"
                  : "bg-gray-200 text-gray-900 focus:ring-indigo-500"
              }`}
              required
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium">
              Code
            </label>
            <textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full mt-1 p-2 rounded focus:outline-none focus:ring ${
                isDarkMode
                  ? "bg-gray-700 text-white focus:ring-indigo-500"
                  : "bg-gray-200 text-gray-900 focus:ring-indigo-500"
              }`}
              rows={6}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2 px-4 rounded focus:outline-none focus:ring ${
              isDarkMode
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            Create Template
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplate;
