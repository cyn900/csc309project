import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTheme } from "@/context/ThemeContext"; // Adjust the import path based on your project structure

const CreateTemplate: React.FC = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    explanation: "",
    code: "",
    tags: [] as string[],
    fork: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>("");
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState({ title: 0, explanation: 0 });

  // Update character counts
  useEffect(() => {
    setCharCount({
      title: formData.title.length,
      explanation: formData.explanation.length,
    });
  }, [formData.title, formData.explanation]);

  // Add this useEffect to load code execution data
  useEffect(() => {
    const savedData = localStorage.getItem('newTemplateData');
    if (savedData) {
      const { code, language, input } = JSON.parse(savedData);
      setFormData(prev => ({
        ...prev,
        code: code,
        explanation: `Language: ${language}\n\nSample Input: ${input || 'None'}\n`,
      }));
      // Clear the saved data after loading
      localStorage.removeItem('newTemplateData');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const formattedTags = formData.tags.map((tag) => tag.trim());

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("accessToken")}`, // Adjust token retrieval logic if needed
        },
        body: JSON.stringify({
          title: formData.title,
          explanation: formData.explanation,
          tags: formattedTags,
          code: formData.code,
          fork: formData.fork,
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

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (formData.tags.length >= 10) {
        setError("Maximum 10 tags allowed");
        return;
      }
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Template</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-lg animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">
              Title
              <span className="text-sm text-gray-500 ml-2">
                ({charCount.title}/100 characters)
              </span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value.slice(0, 100) }))}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-400"
              }`}
              placeholder="Enter your template title..."
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Explanation
              <span className="text-sm text-gray-500 ml-2">
                ({charCount.explanation}/500 characters)
              </span>
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value.slice(0, 500) }))}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-400"
              }`}
              placeholder="Write your template explanation..."
              rows={6}
              required
              maxLength={500}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Tags
              <span className="text-sm text-gray-500 ml-2">
                (Press Enter to add, {10 - formData.tags.length} remaining)
              </span>
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagAdd}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-400"
              }`}
              placeholder="Type a tag and press Enter..."
              disabled={formData.tags.length >= 10}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center 
                           transition-transform duration-200 hover:scale-105"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.filter((t) => t !== tag),
                    }))}
                    className="ml-2 hover:text-red-200 transition-colors duration-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Code
            </label>
            <textarea
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 font-mono ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-400"
              }`}
              placeholder="Paste your code here..."
              rows={10}
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-blue-500 text-white rounded-lg transition-all duration-200
                        ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600 hover:scale-105"}`}
            >
              {isSubmitting ? "Creating..." : "Create Template"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg transition-all duration-200 hover:bg-gray-600 hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplate;
